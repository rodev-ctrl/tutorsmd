import os
import psycopg2
import psycopg2.extras

from services.anthropic_client import generate_summary

DATABASE_URL = os.getenv("DATABASE_URL")


def _get_conn():
    return psycopg2.connect(DATABASE_URL)


async def generate_and_save_summary(lesson_id: str) -> dict:
    """
    Besitzt die komplette Summary-Logik: prüft ob schon vorhanden, holt die
    Nachrichten der Lektion, ruft Claude auf und persistiert das Ergebnis.
    Node.js löst diese Funktion nur noch per HTTP-Trigger aus.
    """
    conn = _get_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    try:
        cur.execute(
            "SELECT id FROM lesson_summaries WHERE lesson_id = %s",
            (lesson_id,),
        )
        if cur.fetchone():
            return {"status": "already_exists", "lesson_id": lesson_id}

        cur.execute(
            """
            SELECT sender_role, text
            FROM lesson_messages
            WHERE lesson_id = %s
            ORDER BY created_at ASC
            """,
            (lesson_id,),
        )
        messages = cur.fetchall()

        if not messages:
            return {"status": "no_messages", "lesson_id": lesson_id}

        transcript = "\n".join(
            f"{m['sender_role']}: {m['text']}" for m in messages if m["text"]
        )
        if not transcript.strip():
            return {"status": "no_messages", "lesson_id": lesson_id}

        content = await generate_summary(transcript)

        cur.execute(
            """
            INSERT INTO lesson_summaries (id, lesson_id, content, model, created_at)
            VALUES (gen_random_uuid(), %s, %s, %s, now())
            """,
            (lesson_id, content, "claude-sonnet-5"),
        )
        conn.commit()

        return {"status": "created", "lesson_id": lesson_id}

    except Exception:
        conn.rollback()
        raise
    finally:
        cur.close()
        conn.close()
