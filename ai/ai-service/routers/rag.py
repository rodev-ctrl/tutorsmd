"""
RAG = RETRIEVAL + AUGMENTED + GENERATION
RETRIEVAL - достать нужную информацию
AUGMENTED - добавить её в контекст модели
GENERATION - LLM генерирует ответ на основе этого контекста

RETRIEVAL здесь гибридный (см. services/retrieval.py):

    1) Векторный поиск — по смыслу, pgvector <=>
       Переживает переформулировку, промахивается по точным токенам.

    2) Лексический поиск — по токенам, Postgres FTS + BM25
       Ловит «Aufgabe 14b», «H2O», номера параграфов. Смысла не понимает.

    3) RRF сливает обе выдачи, Voyage rerank расставляет итоговый порядок.

AUGMENTED теперь тоже устроен иначе: чанки уходят в модель не склеенной
строкой внутри системного промпта, а отдельными document-блоками с
включёнными citations. Отсюда два выигрыша — ответ приходит с точными
ссылками на исходные куски, и системный промпт остаётся байт-стабильным,
то есть кэшируемым.
"""

import asyncio

from fastapi import APIRouter, Depends, HTTPException

from auth import verify_jwt
from schemas.requests import AskRequest, IngestDocumentRequest
from services.anthropic_client import answer_with_web_search, chat_with_rag
from services.retrieval import ingest_document, search_similar_chunks
from services.tools.registry import ToolContext

router = APIRouter()


@router.post("/ingest")
async def ingest(
    body: IngestDocumentRequest,
    user: dict = Depends(verify_jwt),
):
    """
    Индексирует текст учебного материала.
    Вызывается из Node.js после загрузки PDF/конспекта.
    """
    try:
        # psycopg2 и voyage-клиент синхронные: без to_thread они блокируют
        # event loop на всё время индексации (а это десятки embedding-вызовов),
        # и параллельные запросы к сервису встают в очередь.
        count = await asyncio.to_thread(
            ingest_document,
            requester_id=body.requester_id,
            authenticated_user_id=user.get("user_id"),
            lesson_id=body.lesson_id,
            material_id=body.material_id,
            text=body.text,
            metadata=body.metadata,
        )
        return {"chunks_indexed": count, "material_id": body.material_id}
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/ask")
async def ask(
    body: AskRequest,
    user: dict = Depends(verify_jwt),
):
    """Вопрос → гибридный поиск → ответ Claude с цитатами."""
    try:
        chunks = await asyncio.to_thread(
            search_similar_chunks,
            query=body.question,
            requester_id=body.requester_id,
            authenticated_user_id=user.get("user_id"),
            lesson_id=body.lesson_id,
            top_k=body.top_k,
        )

        if not chunks:
            # В материалах ничего релевантного (после порога 0.7 и реранкинга) —
            # уходим в веб. Там модель работает циклом инструментов: пустая
            # выдача одного поиска не заканчивает попытку, а ведёт к
            # переформулировке запроса или к другому инструменту.
            fallback = await answer_with_web_search(
                body.question,
                ctx=ToolContext(requester_id=body.requester_id, lesson_id=body.lesson_id),
            )
            return {
                "answer": fallback["answer"],
                "sources": [],
                "citations": [],
                "fallback": "web_search",
                "search_queries": fallback["queries"],
                "tools_used": fallback["tools_used"],
            }

        result = await chat_with_rag(body.question, chunks=chunks)

        return {
            "answer": result["answer"],
            "sources": [
                {
                    "lesson_id": str(c["lesson_id"]),
                    "material_id": str(c["material_id"]),
                    "similarity": round(float(c["similarity"]), 3),
                    "excerpt": c["content"][:200] + "...",
                }
                for c in chunks
            ],
            # Новое поле. citations привязывают КОНКРЕТНОЕ предложение ответа к
            # конкретному месту в материале, тогда как sources говорят лишь
            # «эти три куска были в контексте». document_index в цитате — это
            # индекс в массиве sources выше, порядок совпадает.
            "citations": result["citations"],
        }

    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
