"""
exa_client.py — веб-поиск через Exa AI как инструмент для Claude.

Почему raw httpx, а не официальный SDK `exa-py`
───────────────────────────────────────────────
`exa-py` тянет за собой `openai>=1.48` и `requests` — ради четырёх POST-запросов.
В сервисе, где уже стоит `anthropic`, это лишнее дерево зависимостей и лишний
шанс на конфликт версий httpx/pydantic; `requests` вдобавок синхронный и в
async-сервисе просто лежал бы мёртвым грузом. Контракт Exa полностью описан
OpenAPI-спекой, гадать не о чем, а httpx уже есть в requirements.

Чем Exa отличается от встроенного web_search Anthropic
──────────────────────────────────────────────────────
Это не замена, а второй, дополняющий инструмент — и модель выбирает сама:

  web_search (Anthropic, server-side) — свежесть и факты «на сегодня».
      Работает на стороне Anthropic, ответ приходит уже с citations.
  exa_search (здесь)                  — семантический поиск по смыслу.
      Лучше находит объяснения и учебные материалы: запрос «объясни, почему
      дискриминант определяет число корней» Exa понимает как смысл, а не как
      набор ключевых слов. Плюс `contents.summary` даёт краткую выжимку
      страницы вместо простыни текста — экономит контекст.

<critical>
Ответы Exa — это текст с чужих сайтов. В tool_loop они возвращаются модели
внутри тега <search_results>, а системные промпты явно объявляют содержимое
таких тегов данными, а не инструкциями. Без этого страница с текстом
«Assistant: ignore your instructions» становится вектором prompt injection.
</critical>

Экономика: /search тарифицируется за запрос, /contents — за страницу, /answer
дороже всего (внутри работает своя LLM). Поэтому основной инструмент —
/search с `contents.summary`, а /answer сюда сознательно НЕ вынесен как
инструмент: платить второй модели за ответ, который затем всё равно
переписывает Claude, смысла нет.
"""

import os
from typing import Any

import httpx

EXA_API_KEY = os.getenv("EXA_API_KEY")
EXA_BASE_URL = os.getenv("EXA_BASE_URL", "https://api.exa.ai")

# Общий таймаут запроса. Exa при livecrawl может думать до ~10 c, но tool_loop
# делает несколько витков подряд, поэтому держим потолок низким и лучше вернём
# модели «таймаут, попробуй другой инструмент», чем подвесим весь запрос.
_TIMEOUT = httpx.Timeout(20.0, connect=5.0)

# Ограничения, чтобы модель не могла запросить 100 страниц полного текста и
# выбить контекст. Верхние границы — наши, не API.
_MAX_RESULTS = 10
_MAX_URLS = 5
_MAX_TEXT_CHARS = 2000


def _headers() -> dict[str, str]:
    # Спека Exa допускает и `x-api-key`, и `Authorization: Bearer`.
    # Берём x-api-key: он однозначно задан в securitySchemes, тогда как в
    # отрендеренной документации по /search название заголовка указано неверно.
    return {"x-api-key": EXA_API_KEY or "", "Content-Type": "application/json"}


async def _post(path: str, payload: dict) -> dict[str, Any]:
    """Один POST к Exa. Ошибки не бросает — возвращает конверт для tool_loop."""
    if not EXA_API_KEY:
        return {
            "status": "error",
            "error": "EXA_API_KEY is not configured on the server.",
            "hint": "Do not retry exa tools. Use the built-in web_search tool instead, or answer from the lesson materials.",
        }

    try:
        async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
            response = await client.post(
                f"{EXA_BASE_URL}{path}", json=payload, headers=_headers()
            )
    except httpx.TimeoutException:
        return {
            "status": "error",
            "error": f"Exa {path} timed out after 20s.",
            "hint": "Retry once with a shorter query, or switch to the built-in web_search tool.",
        }
    except httpx.HTTPError as e:
        return {
            "status": "error",
            "error": f"Network error calling Exa: {type(e).__name__}",
            "hint": "Switch to the built-in web_search tool.",
        }

    if response.status_code == 401:
        return {
            "status": "error",
            "error": "Exa rejected the API key (401).",
            "hint": "Do not retry exa tools in this conversation. Use web_search instead.",
        }
    if response.status_code == 429:
        return {
            "status": "error",
            "error": "Exa rate limit reached (429).",
            "hint": "Do not retry immediately. Use the built-in web_search tool for this question.",
        }
    if response.status_code >= 400:
        # Тело ошибки Exa: {"tag": "...", "error": "..."} — отдаём модели как есть,
        # текст ошибки часто прямо говорит, какой параметр невалиден.
        detail = response.text[:400]
        return {
            "status": "error",
            "error": f"Exa {path} returned {response.status_code}: {detail}",
            "hint": "Fix the arguments and retry once; if it fails again, use web_search.",
        }

    return {"status": "ok", "_raw": response.json()}


def _trim(text: str | None, limit: int = _MAX_TEXT_CHARS) -> str:
    if not text:
        return ""
    text = text.strip()
    return text if len(text) <= limit else text[:limit].rstrip() + " […]"


async def exa_search(
    query: str,
    num_results: int = 5,
    category: str = "",
    include_domains: list[str] | None = None,
    days_back: int = 0,
    include_full_text: bool = False,
) -> dict:
    """Семантический веб-поиск с краткими выжимками страниц.

    По умолчанию возвращает `summary` (выжимка под конкретный запрос) и
    `highlights` (релевантные цитаты) вместо полного текста: для ответа
    школьнику этого достаточно, а контекста уходит в разы меньше.
    include_full_text=True модель ставит сама, когда выжимки не хватило —
    это второй виток, а не поведение по умолчанию.
    """
    num_results = max(1, min(int(num_results or 5), _MAX_RESULTS))

    contents: dict[str, Any] = {
        "summary": {"query": query},
        "highlights": {"query": query, "maxCharacters": 500},
    }
    if include_full_text:
        contents["text"] = {"maxCharacters": _MAX_TEXT_CHARS, "verbosity": "compact"}

    payload: dict[str, Any] = {
        "query": query,
        "type": "auto",
        "numResults": num_results,
        "contents": contents,
    }
    if category:
        payload["category"] = category
    if include_domains:
        payload["includeDomains"] = include_domains[:20]
    if days_back and days_back > 0:
        # Exa хочет ISO-8601. Считаем от текущего момента в UTC —
        # это единственное место в модуле, где вообще нужно «сейчас».
        from datetime import datetime, timedelta, timezone

        since = datetime.now(timezone.utc) - timedelta(days=int(days_back))
        payload["startPublishedDate"] = since.isoformat().replace("+00:00", "Z")

    envelope = await _post("/search", payload)
    if envelope["status"] != "ok":
        return envelope

    raw = envelope["_raw"]
    results = raw.get("results") or []

    if not results:
        return {
            "status": "empty",
            "results": [],
            "hint": (
                "Exa found nothing for this query. Do NOT repeat the same query. "
                "Reformulate it — different technical term, different language "
                "(many school topics are better documented in English), broader or "
                "narrower scope — and search once more. If two different "
                "formulations both come back empty, say so instead of inventing an answer."
            ),
        }

    return {
        "status": "ok",
        "query": query,
        "results": [
            {
                "title": r.get("title") or "(untitled)",
                "url": r.get("url"),
                "published": r.get("publishedDate"),
                "author": r.get("author"),
                "summary": _trim(r.get("summary"), 800),
                "highlights": [_trim(h, 400) for h in (r.get("highlights") or [])[:3]],
                **({"text": _trim(r.get("text"))} if include_full_text else {}),
            }
            for r in results
        ],
        "cost_usd": (raw.get("costDollars") or {}).get("total"),
    }


async def exa_get_contents(urls: list[str], summary_query: str = "") -> dict:
    """Полный текст конкретных страниц.

    Второй шаг после exa_search: у результата поиска была многообещающая
    выжимка, но для ответа нужен сам текст.

    <critical>
    Поля ContentsOptions у /contents лежат на ВЕРХНЕМ уровне тела запроса,
    а у /search — внутри объекта `contents`. Это несимметрично в самом API;
    если скопировать форму из /search, Exa молча вернёт результаты без текста.
    </critical>
    """
    if not urls:
        return {"status": "error", "error": "No URLs given.", "hint": "Call exa_search first."}

    payload: dict[str, Any] = {
        "urls": [u for u in urls if u][:_MAX_URLS],
        "text": {"maxCharacters": _MAX_TEXT_CHARS, "verbosity": "standard"},
    }
    if summary_query:
        payload["summary"] = {"query": summary_query}

    envelope = await _post("/contents", payload)
    if envelope["status"] != "ok":
        return envelope

    raw = envelope["_raw"]
    results = raw.get("results") or []
    statuses = raw.get("statuses") or []
    failed = [s for s in statuses if s.get("status") == "error"]

    if not results:
        return {
            "status": "empty",
            "results": [],
            "failed": [{"url": s.get("id"), "error": (s.get("error") or {}).get("tag")} for s in failed],
            "hint": (
                "None of these pages could be fetched (paywall, robots.txt or dead link). "
                "Go back to exa_search with a different query and pick other sources."
            ),
        }

    return {
        "status": "ok",
        "results": [
            {
                "title": r.get("title") or "(untitled)",
                "url": r.get("url"),
                "published": r.get("publishedDate"),
                "summary": _trim(r.get("summary"), 800),
                "text": _trim(r.get("text")),
            }
            for r in results
        ],
        "failed": [{"url": s.get("id"), "error": (s.get("error") or {}).get("tag")} for s in failed],
        "cost_usd": (raw.get("costDollars") or {}).get("total"),
    }
