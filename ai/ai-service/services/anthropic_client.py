"""
anthropic_client.py — все обращения к Claude API из ai-service.

Что изменилось по сравнению с прежней версией и почему
──────────────────────────────────────────────────────

1. ПРОМПТЫ ВЫНЕСЕНЫ в services/prompts.py. Здесь остался только транспорт.
   Причина не косметическая: раньше контекст RAG подставлялся в системный
   промпт через f-string, из-за чего префикс запроса был уникален на каждый
   вопрос и кэшировать было нечего. Теперь системный промпт — байт-стабильная
   константа с cache_control, а данные уходят в messages.

2. CITATIONS вместо «контекста в промпте». chat_with_rag и explain_document
   передают материалы как document-блоки с citations.enabled — ответ приходит
   разрезанным на текстовые блоки, к каждому приложены точные цитаты
   (символьные позиции для текста, номера страниц для PDF).
   <critical>
   Citations НЕСОВМЕСТИМЫ с output_config.format — вместе они дают HTTP 400.
   Поэтому у функций с цитатами нет JSON-схемы, и формат ответа задан
   инструкцией и пятью примерами в prompts.py. Это не упущение, а
   вынужденный и осознанный выбор в пользу цитат.
   </critical>

3. STRUCTURED OUTPUTS там, где цитаты не нужны: generate_summary и
   explain_image возвращают JSON по схеме из schemas_out.py.

4. PDF как первоклассный вход: explain_document принимает base64 PDF
   document-блоком, с постраничными цитатами.

5. Устранены две реальные несовместимости с claude-sonnet-5:
   • temperature=0.0 в calendar_assistant (сэмплирующие параметры на этой
     модели возвращают 400, а в anthropic 1.x это ещё и TypeError клиента);
   • разбор ответа по content[0] — при citations ответ состоит из МНОГИХ
     текстовых блоков, и первый из них это лишь начало предложения.
"""

import base64
import json
import os
from typing import Any

import anthropic

from services import prompts
from services.schemas_out import EXPLANATION_SCHEMA, SUMMARY_SCHEMA
from services.tool_loop import extract_citations, extract_text, run_tool_loop
from services.tools.registry import ToolContext, build_executor, build_tools, result_to_content

client = anthropic.AsyncAnthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

# ── Выбор модели ────────────────────────────────────────────────────────────
#
# MODEL — рабочая лошадка для всего потокового: чат, саммари, ответы по
# материалам. Оставлен claude-sonnet-5, как и было: это боевой сервис, и
# переводить весь трафик на более дорогую модель без просьбы неправильно.
#
# MODEL_COMPLEX — для задач, где ошибка дороже токенов: разбор фотографии с
# обязательным пересчётом и календарь, где решение модели превращается в
# реальную запись в чужом календаре. По умолчанию тоже sonnet-5, чтобы
# поведение не изменилось само по себе; переключается одной переменной
# окружения ANTHROPIC_MODEL_COMPLEX=claude-opus-5 без правки кода.
#
# <critical>
# Кэш привязан к модели. Разные модели на одном и том же системном промпте —
# это два разных кэша, а не один общий. Менять MODEL на лету между запросами
# одного типа означает никогда не попадать в кэш.
# </critical>
MODEL = os.getenv("ANTHROPIC_MODEL", "claude-sonnet-5")
MODEL_COMPLEX = os.getenv("ANTHROPIC_MODEL_COMPLEX", "claude-opus-5")

# claude-sonnet-5: сэмплирующие параметры (temperature/top_p/top_k) возвращают
# 400 при любом ненулевом отклонении от значения по умолчанию, а budget_tokens
# удалён. Единственный рычаг «сколько думать» — output_config.effort.
EFFORT_FAST = "low"       # классификация, роутинг, судья в eval
EFFORT_NORMAL = "medium"  # чат, саммари
EFFORT_DEEP = "high"      # разбор изображений и документов
EFFORT_MAX = "xhigh"      # веб-исследование с несколькими витками инструментов


def _extract_text(content: list) -> str:
    """Совместимость: часть кода импортирует эту функцию по старому имени."""
    return extract_text(content)


def _usage(response) -> dict:
    u = response.usage
    return {
        "input_tokens": getattr(u, "input_tokens", 0),
        "output_tokens": getattr(u, "output_tokens", 0),
        "cache_read_input_tokens": getattr(u, "cache_read_input_tokens", 0),
        "cache_creation_input_tokens": getattr(u, "cache_creation_input_tokens", 0),
    }


# ═══════════════════════════════════════════════════════════════════════════
#  1. Саммари урока
# ═══════════════════════════════════════════════════════════════════════════

async def generate_summary(transcript: str) -> dict:
    """Транскрипт урока → структурированное саммари (SUMMARY_SCHEMA).

    Транскрипт обёрнут в <transcript> — именно на этот тег ссылается блок
    <security_rules> системного промпта, объявляя его содержимое данными.
    Без тега граница между инструкцией и пользовательским текстом размыта,
    и строка «Ignore previous instructions» в чате урока попадает в модель
    неотличимо от инструкции.
    """
    response = await client.messages.create(
        model=MODEL,
        max_tokens=2048,
        system=prompts.system_block(prompts.SUMMARY_SYSTEM),
        output_config={
            "effort": EFFORT_NORMAL,
            "format": {"type": "json_schema", "schema": SUMMARY_SCHEMA},
        },
        messages=[{
            "role": "user",
            "content": f"<transcript>\n{transcript}\n</transcript>",
        }],
    )
    data = json.loads(extract_text(response.content))
    data["_usage"] = _usage(response)
    return data


def summary_to_markdown(data: dict) -> str:
    """Структурированное саммари → markdown ровно того вида, что ждёт фронтенд.

    Живёт рядом со схемой сознательно: LessonSummaryCard.tsx разбирает markdown
    вручную (## заголовки, дефисные списки, **жирный**), поэтому схема и
    рендерер обязаны меняться вместе. Разнеси их по разным файлам — и первое же
    переименование секции тихо сломает карточку на фронтенде.

    Заголовки локализованы, потому что саммари пишется на языке урока и
    английский «Homework» посреди русского текста выглядит как баг.
    """
    lang = data.get("language", "en")
    headings = {
        "de": ("Behandelte Themen", "Kernpunkte", "Hausaufgaben"),
        "ru": ("Пройденные темы", "Ключевые моменты", "Домашнее задание"),
        "en": ("Topics Covered", "Key Points", "Homework"),
    }.get(lang, ("Topics Covered", "Key Points", "Homework"))

    parts: list[str] = []
    for heading, items in zip(headings, (
        data.get("topics_covered") or [],
        data.get("key_points") or [],
        data.get("homework") or [],
    )):
        if not items:
            continue  # пустая секция целиком опускается — «домашнего нет» не пишем
        parts.append(f"## {heading}\n" + "\n".join(f"- {item}" for item in items))

    return "\n\n".join(parts)


# ═══════════════════════════════════════════════════════════════════════════
#  2. Разбор изображения
# ═══════════════════════════════════════════════════════════════════════════

async def explain_image(
    base64_image: str,
    mime_type: str = "image/jpeg",
    user_note: str = "",
) -> dict:
    """Фото задачи → пошаговое объяснение с обязательной перепроверкой.

    Двойной пересчёт (сначала поштучно с нумерацией, затем построчно снизу
    слева) описан в <counting_methodology> системного промпта, но работает он
    не из-за инструкции, а из-за схемы: поле `verification` обязательное, и
    заполнить его, не сделав второй проход, нечем.

    effort=high — на разборе изображений это заметно влияет на аккуратность
    подсчёта, в отличие от чата, где выше medium смысла нет.
    """
    content: list[dict[str, Any]] = [
        {
            "type": "image",
            "source": {"type": "base64", "media_type": mime_type, "data": base64_image},
        },
        {
            "type": "text",
            "text": (
                "Erkläre diese Aufgabe Schritt für Schritt auf Deutsch. "
                "Wenn es sich um eine Zählaufgabe handelt, wende die zweistufige "
                "Zählmethodik an und trage die Gegenprobe in `verification` ein."
            ),
        },
    ]
    if user_note:
        content.append({
            "type": "text",
            "text": f"<user_request>\n{user_note}\n</user_request>",
        })

    response = await client.messages.create(
        model=MODEL_COMPLEX,
        max_tokens=3000,
        system=prompts.system_block(prompts.VISION_SYSTEM),
        output_config={
            "effort": EFFORT_DEEP,
            "format": {"type": "json_schema", "schema": EXPLANATION_SCHEMA},
        },
        messages=[{"role": "user", "content": content}],
    )
    data = json.loads(extract_text(response.content))
    data["_usage"] = _usage(response)
    return data


# ═══════════════════════════════════════════════════════════════════════════
#  3. Разбор PDF / документа (с постраничными цитатами)
# ═══════════════════════════════════════════════════════════════════════════

async def explain_document(
    file_bytes: bytes,
    question: str = "",
    filename: str = "document.pdf",
    media_type: str = "application/pdf",
) -> dict:
    """PDF (или текстовый файл) → разбор с цитатами и номерами страниц.

    Claude читает PDF целиком: текст, таблицы, диаграммы и формулы — каждая
    страница дополнительно растеризуется в изображение, поэтому схемы и
    рукописные пометки тоже видны.

    <critical>
    Схемы вывода здесь нет и быть не может: citations + output_config.format
    возвращают 400. Для документа ценнее цитаты — ученик видит, на какой
    странице это написано. Формат ответа задан примерами в DOCUMENT_SYSTEM.
    </critical>

    Ограничения API: 32 МБ на запрос и 600 страниц (100, если окно контекста
    модели меньше 1M). Отсканированный PDF без текстового слоя цитировать
    нельзя — цитаты по изображениям пока не поддерживаются; текст модель всё
    равно прочитает, просто без ссылок на страницы.
    """
    encoded = base64.standard_b64encode(file_bytes).decode("utf-8")

    document_block: dict[str, Any] = {
        "type": "document",
        "source": {"type": "base64", "media_type": media_type, "data": encoded},
        "title": filename,
        "citations": {"enabled": True},
        # Документ идёт до вопроса и кэшируется: при разборе одного файла
        # обычно задают несколько вопросов подряд, и повторно оплачивать
        # 20-страничный PDF на каждом вопросе незачем.
        "cache_control": {"type": "ephemeral"},
    }

    # Документ перед текстом — так рекомендует документация, и на длинных PDF
    # это заметно улучшает качество ответа.
    content: list[dict[str, Any]] = [document_block]
    if question:
        content.append({"type": "text", "text": f"<user_request>\n{question}\n</user_request>"})
    else:
        content.append({
            "type": "text",
            "text": "Fasse dieses Dokument so zusammen, dass ein Schüler damit lernen kann.",
        })

    response = await client.messages.create(
        model=MODEL_COMPLEX,
        max_tokens=4000,
        system=prompts.system_block(prompts.DOCUMENT_SYSTEM),
        output_config={"effort": EFFORT_DEEP},
        messages=[{"role": "user", "content": content}],
    )

    return {
        "answer": extract_text(response.content),
        "citations": extract_citations(response.content),
        "_usage": _usage(response),
    }


# ═══════════════════════════════════════════════════════════════════════════
#  4. Ответ по материалам урока (RAG с цитатами)
# ═══════════════════════════════════════════════════════════════════════════

def _context_documents(chunks: list[dict]) -> list[dict]:
    """Чанки → document-блоки с включёнными цитатами.

    Каждый чанк — отдельный документ, а не один склеенный текст: тогда
    document_index в цитате однозначно указывает на конкретный материал, и
    ответ можно связать с исходным файлом.

    <critical>
    Цитаты должны быть включены у ВСЕХ документов запроса либо ни у одного —
    смешанный режим API отвергает.
    </critical>
    """
    return [
        {
            "type": "document",
            "source": {
                "type": "text",
                "media_type": "text/plain",
                "data": chunk["content"],
            },
            "title": f"Material {str(chunk.get('material_id', ''))[:8]} · Abschnitt {chunk.get('chunk_index', i)}",
            "context": (
                f"Aus den Unterrichtsmaterialien der Lektion "
                f"{str(chunk.get('lesson_id', ''))[:8]}. Relevanz {chunk.get('similarity', 0):.2f}."
            ),
            "citations": {"enabled": True},
        }
        for i, chunk in enumerate(chunks)
    ]


async def chat_with_rag(question: str, context: str | None = None, chunks: list[dict] | None = None) -> dict:
    """Ответ на вопрос по учебным материалам, с точными цитатами.

    Принимает либо готовые chunks (предпочтительно — тогда работают цитаты),
    либо склеенную строку context. Второй путь оставлен для совместимости с
    прежними вызовами и цитат не даёт: из склеенной строки уже не восстановить,
    из какого материала взято предложение.
    """
    if chunks:
        content: list[dict[str, Any]] = _context_documents(chunks)
    elif context:
        content = [{
            "type": "document",
            "source": {"type": "text", "media_type": "text/plain", "data": context},
            "title": "Unterrichtsmaterial",
            "citations": {"enabled": True},
        }]
    else:
        content = []

    content.append({"type": "text", "text": f"<user_request>\n{question}\n</user_request>"})

    response = await client.messages.create(
        model=MODEL,
        max_tokens=1500,
        system=prompts.system_block(prompts.RAG_CHAT_SYSTEM),
        output_config={"effort": EFFORT_NORMAL},
        messages=[{"role": "user", "content": content}],
    )

    return {
        "answer": extract_text(response.content),
        "citations": extract_citations(response.content),
        "_usage": _usage(response),
    }


# ═══════════════════════════════════════════════════════════════════════════
#  5. Веб-исследование: Anthropic web_search + Exa, с многовитковым циклом
# ═══════════════════════════════════════════════════════════════════════════

# Серверный веб-поиск Anthropic. allowed_callers=["direct"] задан явно:
# у web_search_20260209 значение по умолчанию — ["code_execution_20260120"],
# то есть поиск вызывается моделью изнутри среды исполнения кода
# («динамическая фильтрация»). В связке с нашим собственным циклом
# инструментов это лишний скрытый слой: непонятно, чей виток сейчас идёт, и
# результаты приходят вложенными. "direct" делает web_search обычным
# серверным инструментом рядом с exa_search.
WEB_SEARCH_TOOL = {
    "type": "web_search_20260209",
    "name": "web_search",
    "max_uses": 4,
    "allowed_callers": ["direct"],
}


async def answer_with_web_search(question: str, ctx: ToolContext | None = None) -> dict:
    """Фолбэк, когда в материалах ученика ничего не нашлось.

    Инструментов у модели здесь три, и она выбирает сама:
      exa_search        — семантический поиск, основной для «объясни почему»
      exa_get_contents  — дочитать конкретную страницу
      web_search        — серверный поиск Anthropic, для свежих фактов

    Цикл (services/tool_loop.py) продолжается, пока модель просит инструменты:
    пустая выдача одного инструмента не заканчивает разговор, а получает
    подсказку попробовать другой запрос или другой инструмент.
    """
    ctx = ctx or ToolContext()
    tools = build_tools("research") + [WEB_SEARCH_TOOL]

    result = await run_tool_loop(
        client,
        model=MODEL,
        system=prompts.system_block(prompts.WEB_SEARCH_SYSTEM),
        messages=[{"role": "user", "content": f"<user_request>\n{question}\n</user_request>"}],
        tools=tools,
        executor=build_executor(ctx),
        result_formatter=result_to_content,
        max_tokens=2000,
        effort=EFFORT_MAX,
    )

    return {
        "answer": result.text,
        "queries": [
            t.input.get("query", "")
            for t in result.trace
            if t.name in ("exa_search", "search_lesson_materials") and t.input.get("query")
        ],
        "tools_used": result.tools_used,
        "stop_reason": result.stop_reason,
        "_usage": result.usage,
    }


def read_web_search_results(content: list) -> list[dict]:
    """Источники из блоков web_search_tool_result.

    <critical>
    При ошибке `content` блока — это ОДИН объект, а не список результатов
    (например {"type": "web_search_tool_result_error", "error_code":
    "max_uses_exceeded"}), при этом HTTP-статус остаётся 200. Итерировать
    его как список — TypeError на ровном месте, поэтому проверка isinstance
    обязательна. Успешный поиск без совпадений возвращает ПУСТОЙ список,
    а не ошибку.
    </critical>
    """
    sources: list[dict] = []
    for block in content:
        if getattr(block, "type", None) != "web_search_tool_result":
            continue
        payload = block.content
        if not isinstance(payload, list):
            sources.append({
                "error": getattr(payload, "error_code", "unknown_error"),
            })
            continue
        sources.extend(
            {
                "url": getattr(r, "url", None),
                "title": getattr(r, "title", None),
                "page_age": getattr(r, "page_age", None),
            }
            for r in payload
        )
    return sources
