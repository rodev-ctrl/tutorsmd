"""
chat.py — диалоговый ассистент.

Два эндпоинта с разными компромиссами:

  POST /chat/message  агентный. Модель сама решает, идти ли в материалы ученика,
                      искать ли в вебе и надо ли уточнить дату — и продолжает
                      вызывать инструменты, пока не соберёт ответ.
  POST /chat/stream   потоковый. Инструментов нет, контекст RAG подбирается
                      заранее одним запросом; ответ идёт токен за токеном.

Почему стриминг без инструментов: пока крутится цикл инструментов, показывать
пользователю нечего — между витками модель молчит по несколько секунд, и
«живой» вывод превращается в паузу с последующей простынёй. Для UI в стиле
ChatGPT честнее один заранее собранный контекст и непрерывный поток.
"""

import asyncio
import json

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse

from auth import verify_jwt
from schemas.requests import ChatRequest
from services import prompts
from services.anthropic_client import EFFORT_NORMAL, MODEL, client
from services.retrieval import search_lesson_summaries, search_similar_chunks
from services.tool_loop import extract_citations, extract_text, run_tool_loop
from services.tools.registry import ToolContext, build_executor, build_tools, result_to_content

router = APIRouter()


def _require_identity(user: dict, requester_id: str) -> str:
    """JWT-личность обязана совпадать с requester_id.

    <critical>
    Раньше эта проверка выполнялась только внутри retrieval.py, то есть только
    когда use_rag=true. С use_rag=false запрос проходил вообще без сверки
    личности: любой обладатель сервисного токена мог вести чат от имени
    произвольного requester_id. Сейчас проверка стоит в роутере и выполняется
    всегда, до любой ветвления по use_rag.
    </critical>
    """
    authenticated_user_id = user.get("user_id")
    if not authenticated_user_id or authenticated_user_id != requester_id:
        raise HTTPException(
            status_code=403,
            detail=f"JWT identity ({authenticated_user_id}) does not match requester_id ({requester_id})",
        )
    return authenticated_user_id


def _history_messages(body: ChatRequest) -> list[dict]:
    return [{"role": m.role, "content": m.content} for m in body.history]


async def _prefetch_context(body: ChatRequest, authenticated_user_id: str) -> list[dict]:
    """Заранее подобранные чанки для потокового режима.

    Сначала материалы урока, при пустом результате — саммари прошлых уроков
    («что мы вообще проходили»). Оба вызова синхронные (psycopg2), поэтому
    уходят в поток, чтобы не блокировать event loop.
    """
    if not body.use_rag:
        return []

    chunks = await asyncio.to_thread(
        search_similar_chunks,
        query=body.message,
        requester_id=body.requester_id,
        authenticated_user_id=authenticated_user_id,
        lesson_id=body.lesson_id,
        top_k=3,
    )
    if chunks:
        return chunks

    return await asyncio.to_thread(
        search_lesson_summaries,
        body.message,
        requester_id=body.requester_id,
        authenticated_user_id=authenticated_user_id,
        top_k=3,
    )


def _context_documents(chunks: list[dict]) -> list[dict]:
    """Чанки → document-блоки с цитатами.

    В system их положить нельзя — document-блоки допустимы только в messages.
    Это удачно совпадает с требованием кэширования: системный промпт остаётся
    байт-стабильным, а меняющийся от запроса к запросу контекст лежит после него.
    """
    return [
        {
            "type": "document",
            "source": {"type": "text", "media_type": "text/plain", "data": c["content"]},
            "title": f"Material · Abschnitt {c.get('chunk_index', 0)}",
            "citations": {"enabled": True},
        }
        for c in chunks
    ]


@router.post("/message")
async def chat(
    body: ChatRequest,
    user: dict = Depends(verify_jwt),
):
    """Агентный чат: модель сама выбирает инструменты и повторяет попытки.

    Инструменты: поиск по собственным материалам, семантический веб-поиск Exa,
    дочитывание страниц, работа со временем и часовыми поясами.

    <critical>
    Здесь НЕТ betas=["compact-2026-01-12"] / context_management, которые стояли
    в прежней версии. Серверная компакция требует, чтобы возвращаемые блоки
    compaction сохранялись и отправлялись обратно на следующем витке. Этот
    сервис историю не хранит — она приходит от клиента как список строк
    {role, content}, поэтому блоки компакции терялись бы сразу же, и параметр
    работал вхолостую. Появится серверное хранение истории — компакцию можно
    вернуть, тогда она заработает по-настоящему.
    </critical>
    """
    authenticated_user_id = _require_identity(user, body.requester_id)

    ctx = ToolContext(
        requester_id=body.requester_id,
        lesson_id=body.lesson_id,
    )

    tools = build_tools("research", "time") if body.use_rag else build_tools("time")

    try:
        result = await run_tool_loop(
            client,
            model=MODEL,
            system=prompts.system_block(prompts.CHAT_SYSTEM),
            messages=_history_messages(body) + [
                {"role": "user", "content": f"<user_request>\n{body.message}\n</user_request>"}
            ],
            tools=tools,
            executor=build_executor(ctx),
            result_formatter=result_to_content,
            max_tokens=2000,
            effort=EFFORT_NORMAL,
        )
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return {
        "answer": result.text,
        "tools_used": result.tools_used,
        "stop_reason": result.stop_reason,
        "input_tokens": result.usage["input_tokens"],
        "output_tokens": result.usage["output_tokens"],
        # Попадания в кэш — единственная достоверная проверка, что кэширование
        # действительно работает. Ноль на повторных запросах означает, что
        # где-то в префикс просочились меняющиеся данные.
        "cache_read_tokens": result.usage["cache_read"],
        "cache_write_tokens": result.usage["cache_write"],
    }


@router.post("/stream")
async def chat_stream(
    body: ChatRequest,
    user: dict = Depends(verify_jwt),
):
    """Потоковый ответ — для плавного UI.

    Проверка личности выполняется ДО открытия потока: иначе 403 пришлось бы
    отдавать внутри уже начатого SSE-ответа со статусом 200, и клиент увидел
    бы ошибку как обычное сообщение.
    """
    authenticated_user_id = _require_identity(user, body.requester_id)

    try:
        chunks = await _prefetch_context(body, authenticated_user_id)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))

    content: list[dict] = _context_documents(chunks)
    content.append({"type": "text", "text": f"<user_request>\n{body.message}\n</user_request>"})
    messages = _history_messages(body) + [{"role": "user", "content": content}]

    async def generate():
        try:
            async with client.messages.stream(
                model=MODEL,
                max_tokens=1500,
                system=prompts.system_block(prompts.CHAT_SYSTEM),
                output_config={"effort": EFFORT_NORMAL},
                messages=messages,
            ) as stream:
                async for text in stream.text_stream:
                    yield f"data: {json.dumps({'text': text})}\n\n"

                # Цитаты известны только по завершении потока: они приходят
                # отдельными citations_delta и привязаны к уже отправленным
                # текстовым блокам. Отдаём их одним финальным событием, чтобы
                # фронтенд мог подсветить источники после отрисовки текста.
                final = await stream.get_final_message()
                citations = extract_citations(final.content)
                if citations:
                    yield f"data: {json.dumps({'citations': citations})}\n\n"

        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
        finally:
            yield "data: [DONE]\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",  # отключает буферизацию nginx
        },
    )
