import asyncio
import json
import os

import psycopg2
import psycopg2.extras

from services.anthropic_client import MODEL, generate_summary, summary_to_markdown
from services.embeddings import get_embedding

DATABASE_URL = os.getenv("DATABASE_URL")


def _get_conn():
    return psycopg2.connect(DATABASE_URL)


async def generate_and_save_summary(lesson_id: str) -> dict:
    """
    Besitzt die komplette Summary-Logik: prüft ob schon vorhanden, holt die
    Nachrichten der Lektion, ruft Claude auf und persistiert das Ergebnis.
    Node.js löst diese Funktion nur noch per HTTP-Trigger aus.

    Neu: Claude liefert die Summary strukturiert (SUMMARY_SCHEMA), das Markdown
    für die DB wird daraus deterministisch erzeugt. Gespeichert wird weiterhin
    exakt dasselbe Markdown-Format wie vorher — LessonSummaryCard.tsx im
    Frontend parst es von Hand und bleibt dadurch unverändert. Der Gewinn liegt
    darin, dass das Modell die Abschnitte nicht mehr umbenennen, weglassen oder
    um einen "Homework: keine" -Eintrag ergänzen kann.
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

        structured = await generate_summary(transcript)
        content = summary_to_markdown(structured)

        if not content.strip():
            # Kann passieren, wenn das Modell alle Abschnitte leer lässt — dann
            # lieber gar nichts speichern als eine leere Karte im Frontend.
            return {"status": "no_content", "lesson_id": lesson_id}

        try:
            embedding = await asyncio.to_thread(get_embedding, content, "document")
        except Exception:
            # Der Voyage-Aufruf ist von der Claude-Zusammenfassung unabhängig —
            # ein Fehler hier darf die bereits generierte Summary nicht verwerfen.
            embedding = None

        cur.execute(
            """
            INSERT INTO lesson_summaries (id, lesson_id, content, model, embedding, created_at)
            VALUES (gen_random_uuid(), %s, %s, %s, %s::vector, now())
            """,
            (
                lesson_id,
                content,
                MODEL,
                json.dumps(embedding) if embedding is not None else None,
            ),
        )
        conn.commit()

        return {
            "status": "created",
            "lesson_id": lesson_id,
            "language": structured.get("language"),
            "subject": structured.get("subject"),
            "has_homework": bool(structured.get("homework")),
            "usage": structured.get("_usage"),
        }

    except Exception:
        conn.rollback()
        raise
    finally:
        cur.close()
        conn.close()
