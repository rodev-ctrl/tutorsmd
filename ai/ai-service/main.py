"""
main.py — точка входа ai-service (FastAPI + Prometheus).

ЧТО ЗДЕСЬ БЫЛО СЛОМАНО
──────────────────────
Прежняя версия файла не запускалась вообще — не «работала с оговорками», а
падала при импорте:

  1. `app = Litestar(route_handlers=[root, ...])` — имя `root` нигде не
     определено → NameError ещё до старта сервера.
  2. Дальше на объекте Litestar вызывались `app.add_middleware(CORSMiddleware…)`
     и `app.include_router(…)` — методов FastAPI, которых у Litestar нет.
  3. Все роутеры (routers/*.py) написаны как FastAPI APIRouter и в Litestar
     подключиться не могут в принципе.
  4. `uvicorn.run(...)` стоял ПЕРЕД настройкой CORS и подключением роутеров,
     так что даже при исправлении пунктов выше сервер поднялся бы без них.

Похоже, в файл попал кусок туториала по Litestar. Оставлен FastAPI — на нём
написан весь сервис; Prometheus подключён напрямую через prometheus_client,
без второго веб-фреймворка ради одной метрики.
"""

import logging
import os
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from prometheus_client import CONTENT_TYPE_LATEST, Counter, Histogram, generate_latest
from starlette.responses import Response

from routers import calendar, chat, rag, summary, vision

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_: FastAPI):
    """Проверка конфигурации при старте, а не при первом запросе.

    Раньше отсутствие JWT_AI_SERVICE_SECRET проявлялось как невнятная ошибка
    внутри jwt.decode на первом же обращении. Лучше увидеть это в логе
    контейнера сразу после деплоя.

    <critical>
    Значения переменных здесь НЕ логируются — только факт наличия. Ключи
    ANTHROPIC/VOYAGE/JWT в логи попадать не должны (см. CLAUDE.md).
    </critical>
    """
    required = {
        "JWT_AI_SERVICE_SECRET": "аутентификация запросов от backend — сервис небезопасен без неё",
        "ANTHROPIC_API_KEY": "все вызовы Claude",
        "DATABASE_URL": "поиск по материалам и сохранение саммари",
    }
    optional = {
        "VOYAGE_API_KEY": "embeddings и реранкинг — RAG не работает без него",
        "EXA_API_KEY": "семантический веб-поиск (есть фолбэк на web_search Anthropic)",
    }

    for name, why in required.items():
        if not os.getenv(name):
            logger.error("КРИТИЧНО: переменная %s не задана — %s", name, why)
    for name, why in optional.items():
        if not os.getenv(name):
            logger.warning("Переменная %s не задана — %s", name, why)

    logger.info("ai-service запущен. Модель: %s", os.getenv("ANTHROPIC_MODEL", "claude-sonnet-5"))

    yield
    # Ничего закрывать не нужно: httpx-клиенты создаются на запрос, а
    # соединения psycopg2 закрываются в finally своих функций.


app = FastAPI(
    title="TutorsMD AI Service",
    version="0.2.0",
    docs_url="/docs",
    openapi_url="/openapi.json",
    # lifespan вместо @app.on_event("startup") — тот вариант объявлен
    # устаревшим и печатает DeprecationWarning при каждом запуске.
    lifespan=lifespan,
)

# ── CORS ────────────────────────────────────────────────────────────────────
#
# Напоминание, почему это НЕ механизм контроля доступа: CORS проверяет браузер,
# а не сервер. Любой клиент, который не браузер (curl, скрипт, другой сервер),
# просто не присылает заголовок Origin и на эти правила не натыкается.
# Реальная защита эндпоинтов — verify_jwt плюс сверка user_id с requester_id
# внутри каждого роутера.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("CLIENT_URL", "https://tutorsmd.net")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Метрики ─────────────────────────────────────────────────────────────────
REQUEST_COUNT = Counter(
    "ai_service_requests_total",
    "Запросы к ai-service",
    ["method", "endpoint", "status"],
)
REQUEST_LATENCY = Histogram(
    "ai_service_request_duration_seconds",
    "Длительность запроса",
    ["endpoint"],
    # Корзины подобраны под профиль этого сервиса: вызовы Claude идут секунды,
    # а не миллисекунды, и дефолтные корзины prometheus (до 10 c) складывали бы
    # почти всё в +Inf. Цикл инструментов доходит до 30 c.
    buckets=(0.1, 0.5, 1, 2, 5, 10, 20, 30, 60),
)


@app.middleware("http")
async def track_metrics(request: Request, call_next):
    # route.path (шаблон), а не request.url.path: иначе каждый lesson_id в URL
    # породил бы отдельную серию метрик и взорвал кардинальность.
    started = time.perf_counter()
    response = await call_next(request)
    route = request.scope.get("route")
    endpoint = getattr(route, "path", request.url.path)

    REQUEST_COUNT.labels(request.method, endpoint, response.status_code).inc()
    REQUEST_LATENCY.labels(endpoint).observe(time.perf_counter() - started)
    return response


@app.get("/metrics", include_in_schema=False)
async def metrics():
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)


# ── Роутеры ─────────────────────────────────────────────────────────────────
app.include_router(chat.router, prefix="/chat", tags=["chat"])
app.include_router(rag.router, prefix="/rag", tags=["rag"])
app.include_router(vision.router, prefix="/vision", tags=["vision"])
app.include_router(calendar.router, prefix="/calendar", tags=["calendar"])
app.include_router(summary.router, prefix="/summary", tags=["summary"])


@app.get("/health")
async def health():
    return {"status": "ok"}


if __name__ == "__main__":
    # Порт 8000: он зашит в Dockerfile (EXPOSE 8000), в docker-compose
    # (expose: "8000") и в nginx (proxy_pass http://tutors-ai:8000).
    # Прежний файл поднимался на 8080 — то есть даже успешный старт не был бы
    # виден снаружи.
    import uvicorn

    # <critical>
    # Передаётся ОБЪЕКТ app, а не строка "main:app".
    #
    # При `python main.py` этот файл уже загружен под именем __main__. Строка
    # "main:app" заставила бы uvicorn импортировать его ВТОРОЙ раз, теперь под
    # именем main — то есть весь модуль выполнился бы дважды в одном процессе.
    # Counter/Histogram на верхнем уровне при этом регистрируются в глобальном
    # CollectorRegistry повторно, и prometheus_client падает с
    # DuplicateTimeseries ещё до старта сервера.
    #
    # Объект передавать можно, потому что reload=False и workers=1: обе эти
    # опции требуют строку (им нужно импортировать приложение в дочернем
    # процессе). Если когда-нибудь понадобится reload или несколько воркеров —
    # запускать надо не `python main.py`, а `uvicorn main:app --reload`, тогда
    # двойного импорта в одном процессе не возникает.
    # </critical>
    uvicorn.run(app, host="0.0.0.0", port=8000)
