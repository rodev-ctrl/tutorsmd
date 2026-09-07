"""
schemas_out.py — JSON-схемы для structured outputs (output_config.format).

Правила Anthropic для этих схем, которые легко нарушить молча:

  • корень обязан быть {"type": "object"}
  • "additionalProperties": false обязателен на КАЖДОМ объекте, включая
    вложенные — иначе валидация не строгая
  • "required" должен перечислять все ключи из properties (модель всё равно
    заполнит их; частичный required только добавляет неопределённости)
  • enum лучше, чем описание словами: "status одно из ..." модель может
    нарушить, enum — нет

<critical>
Схемы НЕЛЬЗЯ применять там, где включены citations: output_config.format
вместе с citations возвращает HTTP 400. Поэтому у chat_with_rag и у
разбора документов схем здесь нет — там формат задан примерами в prompts.py.
</critical>
"""

# ── 1. Саммари урока ────────────────────────────────────────────────────────
# Заменяет прежний свободный markdown. Markdown для БД собирается из этого
# JSON детерминированно (services/summary.py::summary_to_markdown), поэтому
# фронтенд (LessonSummaryCard.tsx) получает ровно тот же формат, что и раньше,
# но теперь без риска, что модель переименует или потеряет секцию.
SUMMARY_SCHEMA = {
    "type": "object",
    "properties": {
        "language": {
            "type": "string",
            "enum": ["de", "ru", "en"],
            "description": "Language the summary is written in — must match the transcript.",
        },
        "subject": {
            "type": "string",
            "description": "School subject as a short noun phrase, in the summary's language.",
        },
        "topics_covered": {
            "type": "array",
            "items": {"type": "string"},
            "description": "Concepts actually worked on. Not activities, not the lesson plan.",
        },
        "key_points": {
            "type": "array",
            "items": {"type": "string"},
            "description": "Self-contained takeaways: formulas, rules, corrections that mattered.",
        },
        "homework": {
            "type": "array",
            "items": {"type": "string"},
            "description": "Concrete assignments. Empty array when none was given — never a 'no homework' item.",
        },
    },
    "required": ["language", "subject", "topics_covered", "key_points", "homework"],
    "additionalProperties": False,
}


# ── 2. Объяснение изображения ───────────────────────────────────────────────
# `verification` — не декоративное поле. Схема обязывает его заполнить, и это
# то, что реально заставляет модель сделать второй проход подсчёта другим
# методом (см. <counting_methodology> в prompts.VISION_SYSTEM). Инструкция
# в промпте без обязательного поля выполняется заметно реже.
EXPLANATION_SCHEMA = {
    "type": "object",
    "properties": {
        "task_type": {
            "type": "string",
            "enum": ["calculation", "counting", "geometry", "text_comprehension", "other"],
            "description": "Kind of task on the image. 'counting' triggers the two-pass counting methodology.",
        },
        "steps": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "step_number": {"type": "integer"},
                    "explanation": {"type": "string"},
                },
                "required": ["step_number", "explanation"],
                "additionalProperties": False,
            },
            "description": "One thought per step, numbered from 1.",
        },
        "verification": {
            "type": "string",
            "description": (
                "The cross-check, verbatim. For counting tasks: the second pass done "
                "by a DIFFERENT method (bottom-left, row by row) and whether it agrees. "
                "For other tasks: substituting the result back, an estimate, or a unit check."
            ),
        },
        "final_answer": {
            "type": "string",
            "description": "The bare answer, no derivation.",
        },
        "confidence": {
            "type": "string",
            "enum": ["high", "medium", "low"],
            "description": "high only when the verification agrees with the first pass.",
        },
    },
    "required": ["task_type", "steps", "verification", "final_answer", "confidence"],
    "additionalProperties": False,
}


# ── 3. Календарь ────────────────────────────────────────────────────────────
CALENDAR_RESULT_SCHEMA = {
    "type": "object",
    "properties": {
        "status": {
            "type": "string",
            "enum": ["booked", "conflict", "needs_clarification", "failed"],
        },
        "event": {
            "type": ["object", "null"],
            "properties": {
                "title": {"type": "string"},
                "start_iso": {
                    "type": "string",
                    "description": "ISO-8601 WITH offset, e.g. 2026-09-10T16:00:00+02:00. Never naive local time.",
                },
                "end_iso": {"type": "string"},
                "timezone": {"type": "string", "description": "IANA name, e.g. Europe/Berlin"},
                "calendar_id": {"type": "string"},
            },
            "required": ["title", "start_iso", "end_iso", "timezone", "calendar_id"],
            "additionalProperties": False,
        },
        "alternatives": {
            "type": "array",
            "items": {"type": "string"},
            "description": "ISO-8601 start times of genuinely free slots. Only when status is 'conflict'.",
        },
        "message_to_user": {
            "type": "string",
            "description": "Shown to the user, in THEIR language, with date and time spelled out — not raw ISO.",
        },
        "tools_used": {
            "type": "array",
            "items": {"type": "string"},
            "description": "Tool names in call order — used for auditing what the assistant actually did.",
        },
    },
    "required": ["status", "event", "alternatives", "message_to_user", "tools_used"],
    "additionalProperties": False,
}


# ── 4. Eval-судья ───────────────────────────────────────────────────────────
FAITHFULNESS_SCHEMA = {
    "type": "object",
    "properties": {
        "faithful": {"type": "boolean"},
        "reason": {
            "type": "string",
            "description": "One sentence naming the specific unsupported claim, or confirming grounding.",
        },
        "unsupported_claims": {
            "type": "array",
            "items": {"type": "string"},
            "description": "Exact offending phrases from the answer. Empty when faithful.",
        },
    },
    "required": ["faithful", "reason", "unsupported_claims"],
    "additionalProperties": False,
}


# ── 5. Классификация запроса чата (роутинг RAG / web / прямой ответ) ────────
# Дешёвый вызов на effort=low перед основным: стоит ли вообще ходить в
# pgvector и в Voyage. Экономит embedding-вызов и SQL на «привет» и «спасибо».
QUERY_ROUTE_SCHEMA = {
    "type": "object",
    "properties": {
        "needs_materials": {
            "type": "boolean",
            "description": "True when the question is about the user's own lesson materials.",
        },
        "needs_web": {
            "type": "boolean",
            "description": "True when the question needs current/external facts the materials cannot hold.",
        },
        "search_query": {
            "type": "string",
            "description": (
                "The question rewritten as a standalone retrieval query, with pronouns from the "
                "chat history resolved. Empty string when neither search is needed."
            ),
        },
        "reason": {"type": "string"},
    },
    "required": ["needs_materials", "needs_web", "search_query", "reason"],
    "additionalProperties": False,
}
