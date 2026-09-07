"""
metrics.py — метрики качества RAG.

ЧТО ЭТО И ПОЧЕМУ НЕ RAGAS
─────────────────────────
Реализованы четыре канонические метрики RAG — те же, что считает Ragas, по тем
же определениям. Отличие в исполнении: считаются напрямую через Claude и Voyage,
которые в проекте уже есть.

Аргументы за такой выбор:

  • Судья. У Ragas судья по умолчанию — OpenAI. Его можно заменить, но это
    ещё один слой абстракции поверх модели, которую мы и так вызываем.
  • Прозрачность. Метрика RAG — это не формула, а промпт судьи. Когда
    faithfulness падает с 0.9 до 0.6, нужно видеть, ЧТО именно спросили у
    судьи. Здесь промпт лежит рядом, в этом же файле.
  • Цена. Каждая метрика — это вызовы API. Ниже видно, сколько именно
    (в docstring каждой функции), и это осознанный выбор, а не чёрный ящик.

Против: Ragas даёт больше метрик из коробки и общий язык с индустрией. Если
метрик понадобится сильно больше — переезд оправдан, тем более что
langchain-core уже приехал в зависимости вместе с voyageai.

<critical>
Каждый вызов метрики тратит токены. Полный прогон по 5 кейсам — порядка
40-50 обращений к API. Это инструмент для CI на pull request и для проверки
гипотез, а не для запуска на каждый коммит.
</critical>

ЧТО ИЗМЕРЯЕТ КАЖДАЯ

    faithfulness      — насколько ответ опирается на контекст (нет ли выдумок)
    answer_relevancy  — отвечает ли ответ на заданный вопрос, а не на соседний
    context_precision — какая доля найденных кусков реально пригодилась
    context_recall    — всё ли нужное поиск вообще нашёл

Первые две оценивают ГЕНЕРАЦИЮ, вторые две — ПОИСК. Это принципиально: если
падает faithfulness, чинить надо промпт; если падает context_recall — чинить
надо retrieval.py. Одна общая «оценка качества RAG» такого различия не даёт,
и потому бесполезна.
"""

import asyncio
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from services import prompts  # noqa: E402
from services.anthropic_client import EFFORT_FAST, MODEL, client  # noqa: E402
from services.tool_loop import extract_text  # noqa: E402

# ── Схемы ответов судьи ────────────────────────────────────────────────────

STATEMENTS_SCHEMA = {
    "type": "object",
    "properties": {
        "statements": {
            "type": "array",
            "items": {"type": "string"},
            "description": "Atomic factual claims, one fact each, self-contained.",
        }
    },
    "required": ["statements"],
    "additionalProperties": False,
}

VERDICTS_SCHEMA = {
    "type": "object",
    "properties": {
        "verdicts": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "statement": {"type": "string"},
                    "supported": {"type": "boolean"},
                    "reason": {"type": "string"},
                },
                "required": ["statement", "supported", "reason"],
                "additionalProperties": False,
            },
        }
    },
    "required": ["verdicts"],
    "additionalProperties": False,
}

QUESTIONS_SCHEMA = {
    "type": "object",
    "properties": {
        "questions": {
            "type": "array",
            "items": {"type": "string"},
            "description": "Questions this answer would be a good answer to.",
        }
    },
    "required": ["questions"],
    "additionalProperties": False,
}

USEFULNESS_SCHEMA = {
    "type": "object",
    "properties": {
        "verdicts": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "index": {"type": "integer"},
                    "useful": {"type": "boolean"},
                    "reason": {"type": "string"},
                },
                "required": ["index", "useful", "reason"],
                "additionalProperties": False,
            },
        }
    },
    "required": ["verdicts"],
    "additionalProperties": False,
}


async def _judge(system: str, user: str, schema: dict, max_tokens: int = 1500) -> dict:
    """Один вызов Claude-судьи со строгой схемой ответа.

    effort=low везде: это задачи классификации и декомпозиции, а не
    рассуждения. Выше платить не за что.
    """
    response = await client.messages.create(
        model=MODEL,
        max_tokens=max_tokens,
        system=prompts.system_block(system),
        output_config={
            "effort": EFFORT_FAST,
            "format": {"type": "json_schema", "schema": schema},
        },
        messages=[{"role": "user", "content": user}],
    )
    return json.loads(extract_text(response.content))


# ═══════════════════════════════════════════════════════════════════════════
#  1. FAITHFULNESS — доля утверждений ответа, подтверждённых контекстом
# ═══════════════════════════════════════════════════════════════════════════

_DECOMPOSE_SYSTEM = f"""You split text into atomic factual statements.

{prompts.INJECTION_GUARD_EN}

<rules>
Each statement must be ONE fact, understandable on its own, with pronouns
resolved. Split compound sentences. Skip pure filler ("Good question!",
"Let me explain") — it carries no factual claim and cannot be verified.
If the text makes no factual claims at all, return an empty array.
</rules>"""

_SUPPORT_SYSTEM = f"""You decide whether each statement is supported by a context.

{prompts.INJECTION_GUARD_EN}

<rules>
supported = true only if the statement follows from the context. Not "is true
in the real world" — follows from THIS text. A correct fact that the context
does not contain is unsupported; that is exactly what this metric exists to catch.

supported = true is still right when the statement merely rephrases the context
in other words or another language, and when it honestly reports that the
context lacks something.
</rules>"""


async def faithfulness(answer: str, context: str) -> dict:
    """Доля утверждений ответа, которые следуют из контекста. 2 вызова API.

    Определение Ragas: разложить ответ на атомарные утверждения, проверить
    каждое против контекста, вернуть долю подтверждённых.

    Почему доля, а не булево: ответ из десяти верных утверждений и одного
    выдуманного — это 0.91, а не «неверный». Булев флаг такую разницу теряет,
    а именно она показывает, ухудшается модель или улучшается.
    """
    decomposed = await _judge(
        _DECOMPOSE_SYSTEM,
        f"<text_to_split>\n{answer}\n</text_to_split>",
        STATEMENTS_SCHEMA,
    )
    statements = decomposed["statements"]
    if not statements:
        # Нечего проверять — ответ без фактических утверждений («не знаю»,
        # уточняющий вопрос). Это не провал: выдумок в нём тоже нет.
        return {"score": 1.0, "statements": [], "unsupported": [], "note": "no factual claims"}

    judged = await _judge(
        _SUPPORT_SYSTEM,
        f"<context>\n{context}\n</context>\n\n"
        + "<statements>\n"
        + "\n".join(f"{i + 1}. {s}" for i, s in enumerate(statements))
        + "\n</statements>",
        VERDICTS_SCHEMA,
    )
    verdicts = judged["verdicts"]
    if not verdicts:
        return {"score": 0.0, "statements": statements, "unsupported": statements}

    supported = sum(1 for v in verdicts if v["supported"])
    return {
        "score": supported / len(verdicts),
        "statements": statements,
        "unsupported": [v["statement"] for v in verdicts if not v["supported"]],
        "reasons": [v["reason"] for v in verdicts if not v["supported"]],
    }


# ═══════════════════════════════════════════════════════════════════════════
#  2. ANSWER RELEVANCY — отвечает ли ответ на заданный вопрос
# ═══════════════════════════════════════════════════════════════════════════

_REVERSE_SYSTEM = f"""You reconstruct the question from an answer.

{prompts.INJECTION_GUARD_EN}

<rules>
Given an answer, write 3 questions that this answer would be a good and
complete reply to. Base them ONLY on what the answer actually says — do not
use outside knowledge, and do not guess at what was "probably" asked.
Write the questions in the same language as the answer.
</rules>"""


async def answer_relevancy(question: str, answer: str) -> dict:
    """Насколько ответ отвечает именно на заданный вопрос. 1 вызов + эмбеддинги.

    Алгоритм Ragas, реализованный дословно: по ответу восстанавливаются
    вопросы, на которые он был бы хорошим ответом, затем считается косинусная
    близость каждого к исходному вопросу; берётся среднее.

    Идея в обратном ходе. Если ответ верен и по делу, восстановленный по нему
    вопрос почти совпадёт с исходным. Если модель ушла в сторону — на
    «объясни дискриминант» рассказала про теорему Виета — восстановленный
    вопрос будет про Виета, и близость упадёт. Прямое «оцени релевантность
    от 1 до 5» ловит это заметно хуже: судья склонен ставить высокие оценки
    осмысленному тексту независимо от того, о том ли он.

    <critical>
    Метрика не проверяет правильность. Уверенно неверный, но точно
    отвечающий на вопрос ответ получит высокий балл. Правильность —
    это faithfulness, и метрики нужно смотреть вместе.
    </critical>
    """
    from services.embeddings import get_embeddings

    generated = await _judge(
        _REVERSE_SYSTEM,
        f"<answer>\n{answer}\n</answer>",
        QUESTIONS_SCHEMA,
        max_tokens=600,
    )
    questions = generated["questions"]
    if not questions:
        return {"score": 0.0, "generated_questions": []}

    # input_type="query" для всех: сравниваются вопросы с вопросами,
    # асимметрия query/document здесь была бы искажением.
    vectors = await asyncio.to_thread(get_embeddings, [question] + questions, "query")
    origin, rest = vectors[0], vectors[1:]

    def cosine(a, b):
        dot = sum(x * y for x, y in zip(a, b))
        na = sum(x * x for x in a) ** 0.5
        nb = sum(x * x for x in b) ** 0.5
        return dot / (na * nb) if na and nb else 0.0

    sims = [cosine(origin, v) for v in rest]
    return {
        "score": sum(sims) / len(sims),
        "generated_questions": questions,
        "similarities": [round(s, 3) for s in sims],
    }


# ═══════════════════════════════════════════════════════════════════════════
#  3. CONTEXT PRECISION — какая доля найденных кусков пригодилась
# ═══════════════════════════════════════════════════════════════════════════

_USEFUL_SYSTEM = f"""You judge whether each retrieved chunk helps answer a question.

{prompts.INJECTION_GUARD_EN}

<rules>
useful = true only if the chunk contains information needed to produce the
reference answer. A chunk on the same general topic that contributes nothing
to THIS answer is not useful — that is noise, and noise is what this metric
measures. Judge each chunk independently; do not reward a chunk for being
next to a useful one.
</rules>"""


async def context_precision(question: str, chunks: list[str], ground_truth: str) -> dict:
    """Доля найденных кусков, реально пригодившихся. 1 вызов API.

    Метрика ПОИСКА, а не генерации. Низкое значение означает, что retrieval
    тащит в промпт шум: модель тратит на него контекст и внимание, а качество
    ответа падает даже при верном ответе где-то среди кусков.

    Это прямая проверка того, ради чего в retrieval.py стоят порог 0.7 и
    реранкер. Если после их добавления precision не вырос — они не работают.
    """
    if not chunks:
        return {"score": 0.0, "useful": [], "note": "nothing retrieved"}

    listed = "\n\n".join(f"[{i}]\n{c}" for i, c in enumerate(chunks))
    judged = await _judge(
        _USEFUL_SYSTEM,
        f"<question>\n{question}\n</question>\n\n"
        f"<reference_answer>\n{ground_truth}\n</reference_answer>\n\n"
        f"<retrieved_chunks>\n{listed}\n</retrieved_chunks>",
        USEFULNESS_SCHEMA,
    )
    verdicts = judged["verdicts"]
    if not verdicts:
        return {"score": 0.0, "useful": []}

    useful = [v["index"] for v in verdicts if v["useful"]]
    return {
        "score": len(useful) / len(chunks),
        "useful": useful,
        "noise": [v["index"] for v in verdicts if not v["useful"]],
    }


# ═══════════════════════════════════════════════════════════════════════════
#  4. CONTEXT RECALL — всё ли нужное поиск нашёл
# ═══════════════════════════════════════════════════════════════════════════

async def context_recall(context: str, ground_truth: str) -> dict:
    """Доля утверждений эталонного ответа, покрытых контекстом. 2 вызова API.

    Вторая метрика ПОИСКА и самая важная из четырёх: если нужного куска в
    контексте нет, никакой промпт этого не исправит. Модель либо честно
    скажет «не знаю», либо выдумает — и обе ветки плохи.

    Реализация переиспользует ту же пару промптов, что и faithfulness, но
    в обратную сторону: там проверяли ответ против контекста, здесь —
    эталон против контекста. Симметрия не случайна:
        recall низкий, faithfulness высокий → поиск не нашёл, модель честна
        recall высокий, faithfulness низкий → поиск нашёл, модель выдумала
    Разделить эти два случая одной метрикой невозможно.
    """
    decomposed = await _judge(
        _DECOMPOSE_SYSTEM,
        f"<text_to_split>\n{ground_truth}\n</text_to_split>",
        STATEMENTS_SCHEMA,
    )
    statements = decomposed["statements"]
    if not statements:
        return {"score": 1.0, "missing": [], "note": "reference has no factual claims"}

    judged = await _judge(
        _SUPPORT_SYSTEM,
        f"<context>\n{context}\n</context>\n\n"
        + "<statements>\n"
        + "\n".join(f"{i + 1}. {s}" for i, s in enumerate(statements))
        + "\n</statements>",
        VERDICTS_SCHEMA,
    )
    verdicts = judged["verdicts"]
    if not verdicts:
        return {"score": 0.0, "missing": statements}

    covered = sum(1 for v in verdicts if v["supported"])
    return {
        "score": covered / len(verdicts),
        "missing": [v["statement"] for v in verdicts if not v["supported"]],
    }
