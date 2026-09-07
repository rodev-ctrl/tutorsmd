"""
db_tools.py — справочные запросы в Postgres, доступные Claude как инструменты.

<critical>
ГЛАВНОЕ АРХИТЕКТУРНОЕ ПРАВИЛО ЭТОГО МОДУЛЯ.

Ни одна из этих функций не принимает идентификатор пользователя ОТ МОДЕЛИ.
profile_id всегда приходит из ToolContext, который собирается в роутере из
проверенного JWT (см. registry.build_toolset). В JSON-Schema инструмента,
которую видит модель, поля user_id/profile_id/lesson_id просто НЕТ — значит,
модель физически не может его подставить.

Почему так, а не «передадим id и проверим»: инструмент — это ещё одна
поверхность IDOR, причём худшая, чем HTTP-эндпоинт. Аргументы инструмента
модель формирует из текста пользователя, а текст пользователя может содержать
«кстати, мой user_id = <чужой uuid>». Проверка «совпадает ли id из аргумента
с id из JWT» работает, но проще и надёжнее не давать модели такого аргумента
вообще: то, чего нет в схеме, нельзя подделать.
</critical>
"""

import os
from typing import Any

import psycopg2
import psycopg2.extras

DATABASE_URL = os.getenv("DATABASE_URL")


def _conn():
    return psycopg2.connect(DATABASE_URL)


def resolve_user_timezone(profile_id: str) -> dict:
    """Часовой пояс и язык владельца профиля (clients.id или tutors.id).

    requester_id на этой платформе — это id профиля (client.id / tutor.id),
    а не users.id, поэтому нужен JOIN. Профиль ровно одного из двух типов,
    поэтому UNION ALL + LIMIT 1 корректен и дешевле, чем два запроса.
    """
    if not profile_id:
        return {
            "status": "error",
            "error": "No profile bound to this request.",
            "hint": "Fall back to get_current_datetime with 'UTC' and ask the user for their timezone.",
        }

    conn = _conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    try:
        cur.execute(
            """
            SELECT u.timezone, u.language_code, 'client' AS profile_kind
              FROM clients c JOIN users u ON u.id = c.user_id
             WHERE c.id = %s
            UNION ALL
            SELECT u.timezone, u.language_code, 'tutor'
              FROM tutors t JOIN users u ON u.id = t.user_id
             WHERE t.id = %s
             LIMIT 1
            """,
            (profile_id, profile_id),
        )
        row = cur.fetchone()
    finally:
        cur.close()
        conn.close()

    if not row:
        return {
            "status": "empty",
            "hint": (
                "No profile found for the current request. Use get_current_datetime with 'UTC' "
                "and explicitly ask the user which timezone they are in before booking anything."
            ),
        }

    return {
        "status": "ok",
        "timezone": row["timezone"] or "UTC",
        "language_code": row["language_code"],
        "profile_kind": row["profile_kind"],
        "note": (
            "This is the timezone stored in the user's own profile. It is the default; "
            "if the user names a different one in their message, that one wins."
        ),
    }


def resolve_tutor_calendar_context(lesson_id: str, requester_id: str) -> dict:
    """Данные урока, нужные для записи в календарь, — только если requester участник.

    Проверка участия (client_id или tutor_id) стоит прямо в WHERE, а не после
    выборки: так «нет доступа» и «нет такого урока» неразличимы для вызывающего,
    и урок нельзя проверить на существование перебором id.
    """
    if not lesson_id or not requester_id:
        return {"status": "empty", "hint": "No lesson bound to this request."}

    conn = _conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    try:
        cur.execute(
            """
            SELECT l.id,
                   l.scheduled_at,
                   l.duration_minutes,
                   l.status,
                   s.name_de       AS subject_de,
                   ut.timezone     AS tutor_timezone,
                   uc.timezone     AS client_timezone
              FROM lessons l
              JOIN subjects s ON s.id = l.subject_id
              JOIN tutors  t  ON t.id = l.tutor_id
              JOIN users   ut ON ut.id = t.user_id
              JOIN clients c  ON c.id = l.client_id
              JOIN users   uc ON uc.id = c.user_id
             WHERE l.id = %s
               AND (l.client_id = %s OR l.tutor_id = %s)
            """,
            (lesson_id, requester_id, requester_id),
        )
        row = cur.fetchone()
    finally:
        cur.close()
        conn.close()

    if not row:
        return {
            "status": "empty",
            "hint": (
                "No lesson is bound to this request, or the requester is not a participant. "
                "Ask the user for the date and time explicitly instead of inferring it."
            ),
        }

    return {
        "status": "ok",
        "lesson_id": str(row["id"]),
        "scheduled_at": row["scheduled_at"].isoformat() if row["scheduled_at"] else None,
        "duration_minutes": row["duration_minutes"],
        "lesson_status": row["status"],
        "subject": row["subject_de"],
        "tutor_timezone": row["tutor_timezone"] or "UTC",
        "client_timezone": row["client_timezone"] or "UTC",
    }


def search_own_materials(
    query: str,
    requester_id: str,
    lesson_id: str | None = None,
    top_k: int = 3,
) -> dict:
    """Поиск по собственным учебным материалам — RAG, обёрнутый в инструмент.

    Импорт retrieval внутри функции, а не наверху модуля: retrieval импортирует
    embeddings, embeddings при импорте создаёт voyageai.Client(), а тот требует
    VOYAGE_API_KEY. Ленивый импорт означает, что сервис поднимается и остальные
    инструменты работают даже без ключа Voyage.
    """
    from services.retrieval import search_similar_chunks

    try:
        chunks = search_similar_chunks(
            query=query,
            requester_id=requester_id,
            # Инструмент вызывается уже за проверенной границей: роутер сверил
            # JWT с requester_id до сборки toolset. Здесь та же величина
            # передаётся в обе позиции сознательно, чтобы не ослаблять
            # сигнатуру search_similar_chunks ради вызова из инструмента.
            authenticated_user_id=requester_id,
            lesson_id=lesson_id,
            top_k=top_k,
        )
    except PermissionError as e:
        return {"status": "error", "error": str(e), "hint": "Do not retry this tool."}
    except Exception as e:  # noqa: BLE001 — модели полезнее текст ошибки, чем стектрейс
        return {
            "status": "error",
            "error": f"{type(e).__name__}: {e}",
            "hint": "The materials index is unavailable. Try exa_search instead, and say the answer is not from the user's materials.",
        }

    if not chunks:
        return {
            "status": "empty",
            "results": [],
            "hint": (
                "Nothing in the user's own materials matched. Either rephrase the query with "
                "different subject terms and search once more, or switch to exa_search and "
                "state clearly that the answer does not come from their materials."
            ),
        }

    return {
        "status": "ok",
        "results": [
            {
                "content": c["content"],
                "lesson_id": str(c["lesson_id"]),
                "material_id": str(c["material_id"]),
                "relevance": round(float(c["similarity"]), 3),
            }
            for c in chunks
        ],
    }
