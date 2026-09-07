"""
calendar_assistant.py — запись уроков в Google-календарь тьютора через MCP.

Про транспорт
─────────────
Параметр `mcp_servers` в Anthropic API умеет разговаривать только с MCP-серверами
по публичному URL. Официального хостируемого MCP-сервера Google Calendar нет —
доступные реализации запускаются локально по stdio (`npx -y
@cocal/google-calendar-mcp`), как и наши github/postgres в .mcp.json. Поэтому
мост построен вручную: сервер поднимается подпроцессом, его схемы инструментов
забираются через list_tools(), модели отдаётся только разрешённый список
(без удаления), а цикл tool_use/tool_result крутится нашим кодом.

НЕ ПРОВЕРЕНО НА ЖИВОМ СЕРВЕРЕ: предполагается, что MCP-сервер календаря
настроен через GOOGLE_CALENDAR_MCP_COMMAND/-ARGS и что имена инструментов
совпадают с ALLOWED_CALENDAR_TOOLS. Перед боевым запуском стоит один раз
выполнить с ALLOWED_CALENDAR_TOOLS=None и сверить реальные имена из list_tools().

Что изменилось
──────────────
1. <critical>
   Убран `temperature=0.0`. На claude-sonnet-5 любое ненулевое отклонение
   сэмплирующих параметров от значения по умолчанию возвращает HTTP 400, а в
   anthropic 1.x аргумент temperature вообще удалён из messages.create и даёт
   TypeError ещё до сети. То есть эта функция не могла отработать ни разу.
   Детерминированность, ради которой ставился ноль, теперь достигается иначе:
   строгой схемой ответа и обязательным вычислением дат инструментами.
   </critical>

2. Добавлены инструменты времени. Модель больше не «прикидывает», какое
   сегодня число: get_current_datetime / find_next_weekday / add_duration /
   convert_timezone дают точный ответ, а системный промпт запрещает считать
   даты в уме.

3. Ответ приведён к схеме CALENDAR_RESULT_SCHEMA: статус, событие,
   альтернативы при конфликте, текст для пользователя и список реально
   вызванных инструментов (для аудита — что ассистент на самом деле делал).

4. Общий цикл инструментов из services/tool_loop.py вместо собственного:
   параллельное выполнение, все tool_result одним сообщением, защита от
   повторов и подсказка «попробуй другой инструмент» при пустом результате.
"""

import json
import os
import shlex
from typing import Any

from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

from services import prompts
from services.anthropic_client import EFFORT_DEEP, MODEL_COMPLEX, client
from services.schemas_out import CALENDAR_RESULT_SCHEMA
from services.tool_loop import run_tool_loop
from services.tools.registry import ToolContext, build_executor, build_tools, result_to_content

# Только чтение и создание — сознательно без "delete-event", чтобы ассистент
# физически не мог удалить чужой урок. Инструмента нет в списке — значит его
# нельзя вызвать никаким промптом.
ALLOWED_CALENDAR_TOOLS = {"list-events", "create-event", "list-calendars"}

MAX_TOOL_TURNS = 6


def _mcp_tool_to_anthropic_schema(tool) -> dict:
    return {
        "name": tool.name,
        "description": tool.description or "",
        "input_schema": tool.inputSchema,
    }


async def book_lesson(
    request_text: str,
    tutor_calendar_id: str,
    requester_id: str = "",
    lesson_id: str | None = None,
) -> dict:
    """
    request_text:      естественная формулировка, «Buche eine Stunde für Donnerstag 16 Uhr»
    tutor_calendar_id: какой календарь затрагивается (из БД, не выбирается клиентом)
    requester_id:      профиль пользователя из проверенного JWT — по нему
                       resolve_user_timezone находит его часовой пояс
    lesson_id:         урок, если запрос идёт из его контекста
    """
    command = os.getenv("GOOGLE_CALENDAR_MCP_COMMAND", "npx")
    args = shlex.split(os.getenv("GOOGLE_CALENDAR_MCP_ARGS", "-y @cocal/google-calendar-mcp"))
    server_params = StdioServerParameters(command=command, args=args, env=os.environ.copy())

    ctx = ToolContext(requester_id=requester_id, lesson_id=lesson_id, tutor_calendar_id=tutor_calendar_id)
    local_executor = build_executor(ctx)

    async with stdio_client(server_params) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()

            available = await session.list_tools()
            allowed = [t for t in available.tools if t.name in ALLOWED_CALENDAR_TOOLS]
            if not allowed:
                raise RuntimeError(
                    f"Keine der erlaubten Tools {ALLOWED_CALENDAR_TOOLS} wurde vom MCP-Server "
                    f"angeboten. Verfügbar: {[t.name for t in available.tools]}"
                )

            # Сортировка по имени — не косметика. Определения инструментов
            # рендерятся в самое начало префикса запроса, а кэш префиксный:
            # если MCP-сервер вернёт тот же набор в другом порядке, кэш
            # обнулится целиком. list_tools() порядок не гарантирует.
            mcp_names = {t.name for t in allowed}
            mcp_tools = [_mcp_tool_to_anthropic_schema(t) for t in sorted(allowed, key=lambda t: t.name)]

            # Инструменты времени идут ПЕРВЫМИ, инструменты календаря — после.
            # cache_control ставится на последний элемент всего массива.
            tools = build_tools("time", "lesson", cache=False) + mcp_tools
            tools = tools[:-1] + [{**tools[-1], "cache_control": {"type": "ephemeral"}}]

            async def executor(name: str, tool_input: dict) -> dict:
                if name not in mcp_names:
                    return await local_executor(name, tool_input)

                # Календарь — единственное место, где модель пишет во внешнюю
                # систему. Идентификатор календаря подставляется здесь, из
                # серверного контекста, и перетирает всё, что могла придумать
                # модель: иначе текст пользователя «запиши в календарь X»
                # уводил бы запись в чужой календарь.
                payload = dict(tool_input or {})
                if tutor_calendar_id:
                    for key in ("calendarId", "calendar_id"):
                        if key in payload or name in ("list-events", "create-event"):
                            payload[key if key in payload else "calendarId"] = tutor_calendar_id
                            break

                try:
                    result = await session.call_tool(name, payload)
                except Exception as e:  # noqa: BLE001
                    return {
                        "status": "error",
                        "error": f"MCP call {name} failed: {type(e).__name__}: {e}",
                        "hint": "Try list-calendars to check the calendar is reachable, or report failure to the user.",
                    }

                text = "\n".join(c.text for c in result.content if getattr(c, "type", None) == "text")

                if result.isError:
                    return {
                        "status": "error",
                        "error": text or f"{name} reported an error",
                        "hint": "Check the arguments (ISO-8601 with offset?) and retry once, or try list-events first.",
                    }
                if not text.strip():
                    return {
                        "status": "empty",
                        "hint": (
                            f"{name} returned nothing. If this was list-events, the time window was "
                            "probably too narrow — retry with a wider range before concluding the slot is free."
                        ),
                    }
                return {"status": "ok", "tool": name, "result": text}

            user_content = (
                f"<calendar_id>{tutor_calendar_id}</calendar_id>\n\n"
                f"<user_request>\n{request_text}\n</user_request>"
            )

            loop_result = await run_tool_loop(
                client,
                model=MODEL_COMPLEX,
                system=prompts.system_block(prompts.CALENDAR_SYSTEM),
                messages=[{"role": "user", "content": user_content}],
                tools=tools,
                executor=executor,
                result_formatter=result_to_content,
                max_tokens=2048,
                effort=EFFORT_DEEP,
                output_schema=CALENDAR_RESULT_SCHEMA,
                max_turns=MAX_TOOL_TURNS,
            )

    data: dict[str, Any] = loop_result.structured or {}
    if not data:
        # Схема не разобралась — почти всегда это обрыв по max_tokens или
        # выход из цикла по лимиту витков. Ничего не выдумываем и явно
        # сообщаем, что запись НЕ создана.
        return {
            "status": "failed",
            "event": None,
            "alternatives": [],
            "message_to_user": (
                "Die Anfrage konnte nicht abgeschlossen werden. Es wurde nichts eingetragen — "
                "bitte nenne Datum und Uhrzeit noch einmal ausdrücklich."
            ),
            "tools_used": loop_result.tools_used,
            "stop_reason": loop_result.stop_reason,
            "_usage": loop_result.usage,
        }

    # tools_used, посчитанный нами, надёжнее того, что перечислила модель:
    # это фактические вызовы, а не её собственный отчёт о них.
    data["tools_used"] = loop_result.tools_used
    data["stop_reason"] = loop_result.stop_reason
    data["_usage"] = loop_result.usage
    return data
