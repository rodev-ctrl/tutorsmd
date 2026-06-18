import psycopg2   # подключение к базе данных
import psycopg2.extras
import os
import json
from typing import List, Optional
from services.embeddings import get_embedding, get_embeddings_batch, chunk_text

DATABASE_URL = os.getenv("DATABASE_URL")

def get_conn():
    # подключение к базе данных
    conn = psycopg2.connect(DATABASE_URL)

    # Регистрирую pgvector тип
    psycopg2.extras.register_uuid(conn)

    return conn

def ingest_document(
    lesson_id:   str,
    material_id: str,
    text:        str,
    metadata:    Optional[dict] = None,
) -> int:
    """
    Разбивает текст на чанки, получает embeddings, сохраняет в БД
    Возвращает количество сохранённых чанков
    """
    chunks     = chunk_text(text)
    embeddings = get_embeddings_batch(chunks)

    conn = get_conn()
    cur  = conn.cursor()

    try:
        # Удаляем старые чанки для этого материала
        cur.execute(
            "DELETE FROM lesson_material_chunks WHERE material_id = %s",
            (material_id,)
        )

        # Вставляем новые
        for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
            cur.execute(
                """
                INSERT INTO lesson_material_chunks
                    (lesson_id, material_id, chunk_index, content, embedding, metadata)
                VALUES (%s, %s, %s, %s, %s::vector, %s)
                """,
                (
                    lesson_id,
                    material_id,
                    i,
                    chunk,
                    json.dumps(embedding),
                    json.dumps(metadata or {}),
                ),
            )

        conn.commit()
        return len(chunks)

    except Exception as e:
        conn.rollback()
        raise e
    finally:
        cur.close()
        conn.close()

def search_similar_chunks(
    query:     str,
    lesson_id: Optional[str] = None,
    top_k:     int = 3,
) -> List[dict]:
    """
    Vectorный поиск по чанкам.
    
    Cosine distance: чем меньше — тем похожее.
    <=> оператор в pgvector = cosine distance
    """
    query_embedding = get_embedding(query)
    embedding_json  = json.dumps(query_embedding)

    conn = get_conn()
    cur  = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    try:
        if lesson_id:
            # Ищем только по конкретному уроку
            cur.execute(
                """
                SELECT
                    content,
                    lesson_id,
                    material_id,
                    chunk_index,
                    metadata,
                    1 - (embedding <=> %s::vector) AS similarity
                FROM lesson_material_chunks
                WHERE lesson_id = %s
                ORDER BY embedding <=> %s::vector
                LIMIT %s
                """,
                (embedding_json, lesson_id, embedding_json, top_k),
            )
        else:
            # Ищем по всем материалам
            cur.execute(
                """
                SELECT
                    content,
                    lesson_id,
                    material_id,
                    chunk_index,
                    metadata,
                    1 - (embedding <=> %s::vector) AS similarity
                FROM lesson_material_chunks
                WHERE 1 - (embedding <=> %s::vector) > 0.7
                ORDER BY embedding <=> %s::vector
                LIMIT %s
                """,
                (embedding_json, embedding_json, top_k),
            )

        rows = cur.fetchall()
        return [dict(row) for row in rows]

    finally:
        cur.close()
        conn.close()

def search_lesson_summaries(
    query:     str,
    top_k:     int = 3,
) -> List[dict]:
    """
    Поиск по саммари уроков.
    Используется в чате когда спрашивают 'что мы проходили?'
    """
    query_embedding = get_embedding(query)
    embedding_json  = json.dumps(query_embedding)

    conn = get_conn()
    cur  = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    try:
        cur.execute(
            """
            SELECT
                ls.content,
                ls.lesson_id,
                ls.created_at,
                1 - (ls.embedding <=> %s::vector) AS similarity
            FROM lesson_summaries ls
            WHERE ls.embedding IS NOT NULL
            ORDER BY ls.embedding <=> %s::vector
            LIMIT %s
            """,
            (embedding_json, embedding_json, top_k),
        )
        return [dict(row) for row in cur.fetchall()]
    finally:
        cur.close()
        conn.close()