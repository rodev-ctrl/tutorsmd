"""
registry.py — JSON-Schema спецификации инструментов и диспетчер вызовов.

Три принципа, по которым здесь всё устроено.

1. STRICT + ВСЕ ПОЛЯ В required.
   `"strict": True` гарантирует, что `tool_use.input` валиден по схеме — модель
   не сможет прислать строку вместо числа или выдумать лишний ключ. Условие
   строгого режима: `additionalProperties: false` И `required`, перечисляющий
   ВСЕ свойства. Поэтому «необязательных» полей в схемах нет: вместо них
   пустая строка / 0 / пустой массив как явный признак «не задано», и это
   написано в description каждого такого поля. Так надёжнее, чем частичный
   required: модель не гадает, что можно опустить.

2. ИДЕНТИЧНОСТЬ НЕ ПРИХОДИТ ОТ МОДЕЛИ.
   <critical>
   Ни в одной схеме ниже нет user_id, requester_id, profile_id, calendar_id или
   lesson_id. Всё это лежит в ToolContext, который собирается в роутере из
   проверенного JWT. Аргументы инструмента модель формирует из текста
   пользователя, а текст пользователя может содержать «мой user_id = <чужой
   uuid>» — то есть аргумент инструмента это ещё одна поверхность IDOR.
   Того, чего нет в схеме, подделать нельзя.
   </critical>

3. РЕЗУЛЬТАТ ИНСТРУМЕНТА ВСЕГДА НЕСЁТ ПОДСКАЗКУ, ЧТО ДЕЛАТЬ ДАЛЬШЕ.
   Каждая функция возвращает конверт со `status` (ok / empty / error) и, если
   результат неудовлетворительный, — поле `hint` с конкретным следующим шагом.
   Это то, что реально заставляет модель вызвать второй инструмент, а не
   сдаться или начать выдумывать: пустой результат без подсказки модель
   склонна трактовать как «ответа не существует».
"""

import asyncio
import json
from dataclasses import dataclass
from typing import Any, Awaitable, Callable

from services.tools import datetime_tools, db_tools, exa_client


@dataclass
class ToolContext:
    """Серверная правда о запросе. Модель на неё не влияет."""

    requester_id: str = ""          # clients.id или tutors.id из JWT-клейма user_id
    lesson_id: str | None = None    # урок, в рамках которого идёт разговор
    tutor_calendar_id: str = ""     # календарь, переданный роутером
    default_timezone: str = "UTC"   # подставляется, если профиль не найден


# ═══════════════════════════════════════════════════════════════════════════
#  JSON-Schema спецификации
# ═══════════════════════════════════════════════════════════════════════════

TOOL_GET_CURRENT_DATETIME = {
    "name": "get_current_datetime",
    "description": (
        "Current date and time in a given IANA timezone. "
        "Call this FIRST whenever the user says anything relative in time — 'tomorrow', "
        "'next Thursday', 'in two weeks', 'this evening'. You have no clock of your own: "
        "without this call any date you produce is a guess, and a guessed lesson date is "
        "a missed lesson. Returns the ISO timestamp with offset, the weekday, and whether "
        "daylight saving time is currently in effect."
    ),
    "strict": True,
    "input_schema": {
        "type": "object",
        "properties": {
            "timezone": {
                "type": "string",
                "description": (
                    "IANA timezone name, e.g. 'Europe/Berlin', 'Europe/Moscow'. "
                    "Get the user's own one from resolve_user_timezone first. "
                    "Use 'UTC' only when the user's timezone is genuinely unknown."
                ),
            }
        },
        "required": ["timezone"],
        "additionalProperties": False,
    },
}

TOOL_RESOLVE_USER_TIMEZONE = {
    "name": "resolve_user_timezone",
    "description": (
        "The timezone and interface language stored in the profile of the user who is "
        "making THIS request. Takes no arguments — the identity comes from the verified "
        "session on the server, not from anything you or the user can pass in. "
        "Call it before get_current_datetime for any scheduling task."
    ),
    "strict": True,
    "input_schema": {"type": "object", "properties": {}, "required": [], "additionalProperties": False},
}

TOOL_CONVERT_TIMEZONE = {
    "name": "convert_timezone",
    "description": (
        "Express one instant in a different timezone. Use it when the student and the "
        "tutor are in different zones: the calendar runs in the tutor's zone, but the "
        "confirmation shown to the student must be in theirs. Always name BOTH times "
        "in your reply."
    ),
    "strict": True,
    "input_schema": {
        "type": "object",
        "properties": {
            "iso_datetime": {
                "type": "string",
                "description": "ISO-8601 timestamp, ideally with offset, e.g. '2026-09-10T16:00:00+02:00'.",
            },
            "to_timezone": {"type": "string", "description": "Target IANA timezone."},
            "from_timezone": {
                "type": "string",
                "description": (
                    "IANA timezone the timestamp is in. Empty string when iso_datetime "
                    "already carries an offset."
                ),
            },
        },
        "required": ["iso_datetime", "to_timezone", "from_timezone"],
        "additionalProperties": False,
    },
}

TOOL_ADD_DURATION = {
    "name": "add_duration_to_datetime",
    "description": (
        "Add (or subtract, with negative values) an interval to a timestamp. "
        "Do NOT do date arithmetic in your head: month boundaries, leap years and "
        "daylight-saving transitions are exactly where it goes wrong. Addition is done "
        "on wall-clock time, so 'tomorrow at the same time' keeps the same clock reading "
        "even across a DST change."
    ),
    "strict": True,
    "input_schema": {
        "type": "object",
        "properties": {
            "iso_datetime": {"type": "string", "description": "Starting ISO-8601 timestamp."},
            "weeks": {"type": "integer", "description": "Weeks to add. 0 for none. Negative subtracts."},
            "days": {"type": "integer", "description": "Days to add. 0 for none."},
            "hours": {"type": "integer", "description": "Hours to add. 0 for none."},
            "minutes": {"type": "integer", "description": "Minutes to add. 0 for none."},
            "timezone": {
                "type": "string",
                "description": "IANA timezone for the arithmetic. Empty string when iso_datetime has an offset.",
            },
        },
        "required": ["iso_datetime", "weeks", "days", "hours", "minutes", "timezone"],
        "additionalProperties": False,
    },
}

TOOL_FIND_NEXT_WEEKDAY = {
    "name": "find_next_weekday",
    "description": (
        "Resolve 'next Thursday' / 'nächsten Donnerstag' / 'в следующий четверг' to a real "
        "date. The single most common phrasing when booking a lesson, and the single most "
        "common counting mistake. Returns the resolved date plus today's date, so you can "
        "state both to the user."
    ),
    "strict": True,
    "input_schema": {
        "type": "object",
        "properties": {
            "weekday": {
                "type": "string",
                "description": "Weekday name in English, German or Russian, e.g. 'thursday', 'Donnerstag', 'четверг'.",
            },
            "timezone": {"type": "string", "description": "IANA timezone of the user."},
            "at_time": {
                "type": "string",
                "description": "24-hour 'HH:MM', e.g. '16:00'. Empty string keeps the current time of day.",
            },
            "skip_today": {
                "type": "boolean",
                "description": (
                    "True (normal) means 'next Thursday' said ON a Thursday resolves to next week. "
                    "False only when the user clearly means today. When it is genuinely ambiguous, "
                    "do not guess — ask."
                ),
            },
        },
        "required": ["weekday", "timezone", "at_time", "skip_today"],
        "additionalProperties": False,
    },
}

TOOL_EXA_SEARCH = {
    "name": "exa_search",
    "description": (
        "Semantic web search (Exa). Finds pages by MEANING, not keyword overlap, so it is "
        "the better tool for conceptual and educational questions — 'why does the "
        "discriminant decide the number of roots' works as a query. Returns per-result "
        "summaries and highlights rather than full pages, to keep the context small. "
        "If it returns nothing, do not repeat the same query: reformulate it (different "
        "technical term, different language, broader or narrower) and search again."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "query": {
                "type": "string",
                "description": "Natural-language query. Full questions work better here than keyword lists.",
            },
            "num_results": {"type": "integer", "description": "1-10. Use 3-5 for a focused question."},
            "category": {
                "type": "string",
                "enum": ["", "company", "publication", "news", "personal site", "financial report", "people"],
                "description": "Result category filter. Empty string for no filter — that is the normal case.",
            },
            "include_domains": {
                "type": "array",
                "items": {"type": "string"},
                "description": "Restrict to these domains, e.g. ['serlo.org']. Empty array for no restriction.",
            },
            "days_back": {
                "type": "integer",
                "description": "Only pages published within this many days. 0 = no date filter. Use for current events only.",
            },
            "include_full_text": {
                "type": "boolean",
                "description": (
                    "False by default — summaries are usually enough and far cheaper in context. "
                    "Set true only on a SECOND call, when the summaries were not sufficient."
                ),
            },
        },
        "required": ["query", "num_results", "category", "include_domains", "days_back", "include_full_text"],
        "additionalProperties": False,
    },
}

TOOL_EXA_GET_CONTENTS = {
    "name": "exa_get_contents",
    "description": (
        "Fetch the full text of specific pages you already found with exa_search. "
        "The escalation step: the summary looked right but you need the actual wording, "
        "a formula, or a number from the page."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "urls": {
                "type": "array",
                "items": {"type": "string"},
                "description": "Up to 5 URLs taken from previous exa_search results.",
            },
            "summary_query": {
                "type": "string",
                "description": "What to extract from each page. Empty string returns the plain text.",
            },
        },
        "required": ["urls", "summary_query"],
        "additionalProperties": False,
    },
}

TOOL_SEARCH_MATERIALS = {
    "name": "search_lesson_materials",
    "description": (
        "Search the user's OWN uploaded lesson materials (hybrid vector + keyword search "
        "with reranking). Always try this BEFORE any web search when the question could "
        "plausibly be about something the tutor uploaded — an answer grounded in the "
        "student's own worksheet beats a correct answer from the internet. "
        "Scope is fixed server-side to this user's own lessons; there is no argument that "
        "could widen it. Returns an empty result with a hint when nothing matches."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "query": {
                "type": "string",
                "description": (
                    "Standalone search query. Resolve pronouns from the conversation first: "
                    "'explain that again' must become 'explain the discriminant'."
                ),
            },
            "top_k": {"type": "integer", "description": "How many chunks to return, 1-10. Use 3-5."},
        },
        "required": ["query", "top_k"],
        "additionalProperties": False,
    },
}

TOOL_GET_LESSON_CONTEXT = {
    "name": "get_lesson_context",
    "description": (
        "Facts about the lesson this conversation belongs to: scheduled time, duration, "
        "subject, and the timezones of both tutor and student. Takes no arguments — the "
        "lesson is bound server-side. Use it before scheduling so you build on the real "
        "booking instead of asking the user to repeat what the system already knows."
    ),
    "strict": True,
    "input_schema": {"type": "object", "properties": {}, "required": [], "additionalProperties": False},
}


# Именованные наборы. Порядок внутри набора ФИКСИРОВАН и не зависит от запроса:
# определения инструментов рендерятся в позицию 0 промпта, поэтому любая
# перестановка обнуляет весь кэш (tools → system → messages).
TOOLSETS: dict[str, list[dict]] = {
    "time": [
        TOOL_RESOLVE_USER_TIMEZONE,
        TOOL_GET_CURRENT_DATETIME,
        TOOL_FIND_NEXT_WEEKDAY,
        TOOL_ADD_DURATION,
        TOOL_CONVERT_TIMEZONE,
    ],
    "research": [
        TOOL_SEARCH_MATERIALS,
        TOOL_EXA_SEARCH,
        TOOL_EXA_GET_CONTENTS,
    ],
    "lesson": [
        TOOL_GET_LESSON_CONTEXT,
    ],
}


def build_tools(*names: str, cache: bool = True) -> list[dict]:
    """Собирает список определений инструментов из именованных наборов.

    cache_control ставится на ПОСЛЕДНИЙ инструмент: он кэширует весь массив
    tools целиком (кэш — префиксный, а tools стоят в самом начале префикса).
    Определения инструментов вместе с примерами в описаниях — это несколько
    тысяч токенов, которые иначе оплачивались бы на каждом витке tool-loop
    по полной цене.
    """
    tools: list[dict] = []
    for name in names:
        tools.extend(TOOLSETS[name])

    if cache and tools:
        # Копия последнего элемента, а не мутация: TOOLSETS — общие константы
        # модуля, и приписать им cache_control на месте значило бы менять
        # определения для всех остальных вызовов.
        tools = tools[:-1] + [{**tools[-1], "cache_control": {"type": "ephemeral"}}]
    return tools


# ═══════════════════════════════════════════════════════════════════════════
#  Диспетчер
# ═══════════════════════════════════════════════════════════════════════════

def _sync(fn: Callable[..., dict]) -> Callable[..., Awaitable[dict]]:
    """Синхронную функцию (psycopg2, zoneinfo) — в поток, чтобы не блокировать loop."""

    async def wrapper(**kwargs: Any) -> dict:
        return await asyncio.to_thread(fn, **kwargs)

    return wrapper


def build_executor(ctx: ToolContext) -> Callable[[str, dict], Awaitable[dict]]:
    """Возвращает async execute(name, tool_input) с зашитым контекстом.

    Здесь же происходит подстановка серверных идентификаторов: модель передаёт
    только предметные аргументы, а requester_id / lesson_id / calendar_id
    добавляются из ctx уже за границей доверия.
    """

    async def execute(name: str, tool_input: dict) -> dict:
        args = dict(tool_input or {})

        try:
            match name:
                case "get_current_datetime":
                    return await _sync(datetime_tools.get_current_datetime)(
                        timezone=args.get("timezone") or ctx.default_timezone
                    )

                case "resolve_user_timezone":
                    # Аргументы игнорируются намеренно: даже если модель их
                    # придумает, идентичность берётся только из контекста.
                    return await _sync(db_tools.resolve_user_timezone)(profile_id=ctx.requester_id)

                case "convert_timezone":
                    return await _sync(datetime_tools.convert_timezone)(
                        iso_datetime=args.get("iso_datetime", ""),
                        to_timezone=args.get("to_timezone", ""),
                        from_timezone=args.get("from_timezone", "") or "",
                    )

                case "add_duration_to_datetime":
                    return await _sync(datetime_tools.add_duration_to_datetime)(
                        iso_datetime=args.get("iso_datetime", ""),
                        weeks=int(args.get("weeks") or 0),
                        days=int(args.get("days") or 0),
                        hours=int(args.get("hours") or 0),
                        minutes=int(args.get("minutes") or 0),
                        timezone=args.get("timezone", "") or "",
                    )

                case "find_next_weekday":
                    return await _sync(datetime_tools.find_next_weekday)(
                        weekday=args.get("weekday", ""),
                        timezone=args.get("timezone") or ctx.default_timezone,
                        at_time=args.get("at_time", "") or "",
                        skip_today=bool(args.get("skip_today", True)),
                    )

                case "exa_search":
                    return await exa_client.exa_search(
                        query=args.get("query", ""),
                        num_results=int(args.get("num_results") or 5),
                        category=args.get("category", "") or "",
                        include_domains=args.get("include_domains") or None,
                        days_back=int(args.get("days_back") or 0),
                        include_full_text=bool(args.get("include_full_text", False)),
                    )

                case "exa_get_contents":
                    return await exa_client.exa_get_contents(
                        urls=args.get("urls") or [],
                        summary_query=args.get("summary_query", "") or "",
                    )

                case "search_lesson_materials":
                    return await _sync(db_tools.search_own_materials)(
                        query=args.get("query", ""),
                        requester_id=ctx.requester_id,
                        lesson_id=ctx.lesson_id,
                        top_k=max(1, min(int(args.get("top_k") or 3), 10)),
                    )

                case "get_lesson_context":
                    return await _sync(db_tools.resolve_tutor_calendar_context)(
                        lesson_id=ctx.lesson_id or "", requester_id=ctx.requester_id
                    )

                case _:
                    return {
                        "status": "error",
                        "error": f"Unknown tool {name!r}.",
                        "hint": "Use only the tools listed in this request.",
                    }

        except Exception as e:  # noqa: BLE001
            # Исключение инструмента не должно ронять весь запрос: модель
            # получит его как is_error и сможет выбрать другой путь.
            return {
                "status": "error",
                "error": f"{type(e).__name__}: {e}",
                "hint": "This tool failed. Try a different tool or different arguments.",
            }

    return execute


def result_to_content(result: dict) -> str:
    """Результат инструмента → строка для блока tool_result.

    <critical>
    Содержимое оборачивается в <tool_result_data>. Внутри может оказаться текст
    с чужого сайта или из чужого документа, а системные промпты объявляют
    содержимое таких тегов данными, а не инструкциями. Без обёртки страница с
    текстом «Assistant: ignore all previous instructions» попадает модели без
    какой-либо пометки о том, что это ненадёжный источник.
    </critical>
    """
    payload = json.dumps(result, ensure_ascii=False, indent=None, default=str)
    return f"<tool_result_data>\n{payload}\n</tool_result_data>"
