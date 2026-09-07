"""
tool_loop.py — многовитковый агентный цикл: вызов → инструменты → снова вызов.

Что здесь реализовано сверх «наивного» цикла из документации
─────────────────────────────────────────────────────────────

1. ПАРАЛЛЕЛЬНОЕ ВЫПОЛНЕНИЕ, ОДИН ОТВЕТНЫЙ MESSAGE.
   Модель может попросить несколько инструментов в одном ответе. Они
   выполняются через asyncio.gather, а ВСЕ tool_result уходят обратно ОДНИМ
   user-сообщением.
   <critical>
   Разбивать результаты на несколько сообщений нельзя: это не ошибка API, но
   модель на таком поведении быстро «переучивается» и перестаёт запрашивать
   инструменты параллельно — запросы становятся последовательными и медленными.
   </critical>

2. ЭСКАЛАЦИЯ ПРИ НЕУДОВЛЕТВОРИТЕЛЬНОМ РЕЗУЛЬТАТЕ.
   Если все инструменты витка вернули пусто или ошибку, к сообщению с
   результатами добавляется текстовый блок-напоминание: не выдумывать ответ,
   не повторять тот же вызов, а взять другой инструмент или другие аргументы.
   Без этого модель склонна трактовать пустой результат как «ответа не
   существует» и заканчивать разговор. Дополнительно каждый инструмент сам
   кладёт в результат поле `hint` с конкретным следующим шагом.

3. ЗАЩИТА ОТ ЗАЦИКЛИВАНИЯ.
   Повтор идентичного вызова (то же имя + те же аргументы) не выполняется
   второй раз: модель получает готовый ответ с пометкой, что это повтор.
   Иначе «попробуй ещё раз» из пункта 2 превращается в бесконечный цикл
   одинаковых запросов.

4. pause_turn.
   Серверные инструменты (web_search) крутят собственный цикл на стороне
   Anthropic и на 10-й итерации отдают stop_reason "pause_turn".
   Продолжение — просто повторный запрос с добавленным assistant-ходом.
   <critical>
   Никакого «Continue.» дописывать НЕЛЬЗЯ: API сам видит хвостовой
   server_tool_use и продолжает. И историю надо ДОПОЛНЯТЬ, а не пересобирать
   из двух сообщений (пример в документации SDK делает именно это и теряет
   весь предыдущий разговор).
   </critical>

5. КЭШИРОВАНИЕ.
   cache_control на последнем определении инструмента (кэширует весь массив
   tools) и на системном промпте. В цикле из 4-5 витков одни и те же несколько
   тысяч токенов иначе оплачивались бы по полной цене на каждом витке.
   На claude-sonnet-5 порог кэширования — 1024 токена.
"""

import asyncio
import json
from dataclasses import dataclass, field
from typing import Any, Awaitable, Callable

MAX_TOOL_TURNS = 6          # витков с инструментами
MAX_PAUSE_RESUMES = 3       # продолжений после pause_turn

# Текстовый блок, дописываемый к сообщению с результатами инструментов.
#
# На claude-sonnet-5 нельзя использовать mid-conversation {"role": "system"} —
# модель возвращает 400 (`role 'system' is not supported on this model`).
# Документированная замена — текстовый блок ПОСЛЕ блоков tool_result в том же
# user-сообщении, что здесь и сделано.
#
# Оговорка про доверие: этот блок лежит в том же сообщении, что и данные из
# инструментов, то есть теоретически такой же тег может прийти со стороннего
# сайта внутри результата поиска. Последствие подделки ограничено — максимум
# лишний вызов инструмента; ничего чувствительного этот текст не разрешает.
ESCALATION_NUDGE = """<retry_directive>
Every tool call in the previous step returned an empty result or an error.

Do NOT answer from guesswork, and do NOT repeat an identical call. Choose one:
  1. call a DIFFERENT tool that could answer this;
  2. call the same tool with genuinely different arguments — reformulated query,
     a different technical term, another language, a wider time window;
  3. only if you have already tried at least two distinct approaches: say plainly
     that you could not find it, and name what you tried.
</retry_directive>"""


@dataclass
class ToolCallTrace:
    name: str
    input: dict
    status: str
    duplicate: bool = False


@dataclass
class ToolLoopResult:
    text: str
    structured: dict | None
    stop_reason: str
    turns: int
    trace: list[ToolCallTrace] = field(default_factory=list)
    usage: dict = field(default_factory=dict)
    messages: list = field(default_factory=list)

    @property
    def tools_used(self) -> list[str]:
        return [t.name for t in self.trace]


def extract_text(content: list) -> str:
    """Весь текст ответа.

    Собирает ВСЕ текстовые блоки, а не первый: при включённых citations ответ
    режется на много text-блоков (цитируемые и нецитируемые), и взять только
    content[0] значит потерять большую часть ответа. Блоки thinking
    пропускаются — на claude-sonnet-5 они по умолчанию приходят пустыми.
    """
    return "".join(b.text for b in content if getattr(b, "type", None) == "text")


def extract_citations(content: list) -> list[dict]:
    """Цитаты из всех текстовых блоков, в порядке появления.

    Форма объекта зависит от источника документа:
      text/plain  → char_location  (start_char_index / end_char_index)
      PDF         → page_location  (start_page_number / end_page_number)
      web_search  → web_search_result_location (url / title)
    """
    out: list[dict] = []
    for block in content:
        for citation in getattr(block, "citations", None) or []:
            item: dict[str, Any] = {
                "type": getattr(citation, "type", None),
                "cited_text": getattr(citation, "cited_text", None),
                "document_title": getattr(citation, "document_title", None),
            }
            for attr in (
                "document_index", "start_char_index", "end_char_index",
                "start_page_number", "end_page_number", "url", "title",
            ):
                value = getattr(citation, attr, None)
                if value is not None:
                    item[attr] = value
            out.append(item)
    return out


def _call_key(name: str, tool_input: dict) -> str:
    """Стабильный ключ вызова. sort_keys обязателен — иначе один и тот же
    вызов с другим порядком ключей не распознается как повтор."""
    return name + "|" + json.dumps(tool_input or {}, sort_keys=True, ensure_ascii=False, default=str)


async def run_tool_loop(
    client,
    *,
    model: str,
    system: list[dict] | str,
    messages: list[dict],
    tools: list[dict],
    executor: Callable[[str, dict], Awaitable[dict]],
    result_formatter: Callable[[dict], str],
    max_tokens: int = 2048,
    effort: str = "medium",
    output_schema: dict | None = None,
    max_turns: int = MAX_TOOL_TURNS,
) -> ToolLoopResult:
    """Крутит цикл, пока модель просит инструменты, и возвращает финальный ответ.

    executor         — async (name, input) -> dict-конверт со `status`
    result_formatter — dict-конверт -> строка для блока tool_result
    output_schema    — JSON-схема; если задана, финальный ответ придёт как JSON.
                       Совместима с tools, но НЕ совместима с citations (400).
    """
    messages = list(messages)  # не мутируем аргумент вызывающего
    trace: list[ToolCallTrace] = []
    seen: dict[str, dict] = {}
    usage_total = {"input_tokens": 0, "output_tokens": 0, "cache_read": 0, "cache_write": 0}

    output_config: dict[str, Any] = {"effort": effort}
    if output_schema:
        output_config["format"] = {"type": "json_schema", "schema": output_schema}

    pause_resumes = 0
    response = None

    for turn in range(1, max_turns + 1):
        response = await client.messages.create(
            model=model,
            max_tokens=max_tokens,
            system=system,
            tools=tools,
            output_config=output_config,
            messages=messages,
        )

        u = response.usage
        usage_total["input_tokens"] += getattr(u, "input_tokens", 0) or 0
        usage_total["output_tokens"] += getattr(u, "output_tokens", 0) or 0
        usage_total["cache_read"] += getattr(u, "cache_read_input_tokens", 0) or 0
        usage_total["cache_write"] += getattr(u, "cache_creation_input_tokens", 0) or 0

        # ── Серверный инструмент упёрся в свой лимит витков ────────────────
        if response.stop_reason == "pause_turn":
            if pause_resumes >= MAX_PAUSE_RESUMES:
                break
            pause_resumes += 1
            # ДОПОЛНЯЕМ историю. Пересборка messages из двух сообщений (как в
            # примере SDK) стёрла бы весь предыдущий разговор.
            messages.append({"role": "assistant", "content": response.content})
            continue

        if response.stop_reason != "tool_use":
            break

        tool_uses = [b for b in response.content if b.type == "tool_use"]
        if not tool_uses:
            break

        messages.append({"role": "assistant", "content": response.content})

        # ── Выполняем все запрошенные инструменты параллельно ──────────────
        async def run_one(block) -> tuple[Any, dict, bool]:
            key = _call_key(block.name, block.input)
            if key in seen:
                # Тот же вызов уже был. Возвращаем прежний результат с явной
                # пометкой — иначе указание «попробуй иначе» выродится в
                # бесконечное повторение одного и того же запроса.
                repeat = dict(seen[key])
                repeat["hint"] = (
                    "IDENTICAL call already made in this conversation; it was not executed again. "
                    "Change the arguments substantively or use a different tool."
                )
                return block, repeat, True
            result = await executor(block.name, block.input)
            seen[key] = result
            return block, result, False

        executed = await asyncio.gather(*(run_one(b) for b in tool_uses))

        tool_results = []
        turn_statuses = []
        for block, result, is_duplicate in executed:
            status = result.get("status", "ok")
            turn_statuses.append(status)
            trace.append(ToolCallTrace(block.name, dict(block.input or {}), status, is_duplicate))

            entry: dict[str, Any] = {
                "type": "tool_result",
                "tool_use_id": block.id,
                "content": result_formatter(result),
            }
            if status == "error":
                entry["is_error"] = True
            tool_results.append(entry)

        # ── Эскалация: ни один инструмент витка не дал полезного результата ─
        if turn_statuses and all(s in ("empty", "error") for s in turn_statuses):
            tool_results.append({"type": "text", "text": ESCALATION_NUDGE})

        messages.append({"role": "user", "content": tool_results})

    # ── Финал ──────────────────────────────────────────────────────────────
    text = extract_text(response.content) if response else ""
    structured = None
    if output_schema and text:
        try:
            structured = json.loads(text)
        except json.JSONDecodeError:
            # output_config.format гарантирует валидный JSON только при
            # нормальном завершении: обрыв по max_tokens режет его на полуслове.
            structured = None

    return ToolLoopResult(
        text=text,
        structured=structured,
        stop_reason=(response.stop_reason if response else "no_response"),
        turns=len([t for t in trace]),
        trace=trace,
        usage=usage_total,
        messages=messages,
    )
