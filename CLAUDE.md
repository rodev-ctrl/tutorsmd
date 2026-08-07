# TutorsMD — Claude Code Workspace

## Архитектура

Монорепо с тремя сервисами:

```
tutors2/
├── frontend/          React SPA (CRA), порт 3000
├── backend/           Node.js + Express + Prisma, порт 4000
│   └── infrastructure/
│       ├── ai/        ClaudeSummaryService.ts — интеграция с Python AI
│       ├── database/  Prisma схемы (PostgreSQL + pgvector)
│       ├── queue/     BullMQ воркер + джобы
│       ├── security/  AES-256-GCM шифрование
│       └── websocket/ Realtime чат
├── ai/                Python FastAPI сервис, порт 8000
│   ├── ai-service/    RAG, embeddings, Anthropic SDK
│   └── explanation/   Сервис объяснений
└── nginx/             Reverse proxy
```

**Стек:** React · Node/Express · Prisma · PostgreSQL · pgvector · BullMQ · Redis · Python FastAPI · Anthropic Claude · Voyage AI embeddings · Docker Compose

## Ключевые команды

```bash
# Dev (все сервисы)
docker compose up --build

# Backend только
cd backend && npm run dev

# Frontend только
cd frontend && npm start

# AI сервис только
cd ai && uvicorn main:app --reload --port 8000

# Prisma миграции
cd backend && npx prisma migrate dev
cd backend && npx prisma generate

# Тесты
npm test  # в корне - jest
```

## База данных

- PostgreSQL с расширением **pgvector** (1024-мерные векторы, модель voyage-3)
- Схемы: `backend/infrastructure/database/prisma/schema/`
- Таблица RAG: `lesson_material_chunks` - чанки + embeddings учебных материалов
- Таблица саммари: `lesson_summaries` - embeddings саммари уроков

## AI-слой (Python FastAPI)

- **RAG endpoints:** `POST /rag/ingest`, `POST /rag/ask`
- **Embeddings:** Voyage AI `voyage-3` через Anthropic SDK
- **Chunking:** `ai/explanation/services/embeddings.py` — сейчас по словам (TODO: semantic)
- **Retrieval:** cosine similarity через pgvector `<=>` оператор
- **LLM:** Anthropic Claude (модель в `.env`)

## Переменные окружения

Файл `.env` в корне (не коммитить). Ключевые:
- `DATABASE_URL` — Postgres connection string
- `ANTHROPIC_API_KEY` — для Claude
- `VOYAGE_API_KEY` — для embeddings (передаётся в Python как `VOYAGE_API_KEY`)
- `JWT_AI_SERVICE_SECRET` — аутентификация между сервисами
- `REDIS_URL` — BullMQ

## Активные TODO / технический долг

- [ ] Semantic chunking вместо word-split в `ai/explanation/services/embeddings.py`
- [ ] Similarity threshold в retrieval (отсекать нерелевантные чанки < 0.7)
- [ ] Reranking после векторного поиска (Voyage rerank-2 или Cohere)
- [ ] Eval harness для RAG (`tests/eval/rag_eval.py`)

## Соглашения

- **Backend:** TypeScript, именование camelCase, Prisma для всех DB операций
- **Frontend:** TypeScript, функциональные компоненты, i18n через `frontend/src/shared/config/i18n.js`
- **Python:** snake_case, type hints везде, FastAPI dependency injection для auth
- **Коммиты:** `feat:`, `fix:`, `ci:`, `refactor:` префиксы
- **Не мокать БД** в тестах — использовать реальный PostgreSQL (был прецедент, когда моки не поймали баг в миграции)

## Безопасность

- JWT между сервисами: `ai/auth/jwt.py` проверяет каждый запрос
- Никогда не логировать `ANTHROPIC_API_KEY`, `VOYAGE_API_KEY`, `JWT_AI_SERVICE_SECRET`
