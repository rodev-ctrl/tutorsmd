"""
retrieval.py — гибридный поиск по учебным материалам.

КОНВЕЙЕР
────────

    запрос
      ├─► voyage-3 → pgvector  <=>          ── векторная ветка, top 60
      └─► websearch_to_tsquery → GIN        ── лексическая ветка, top 60
                    │
            BM25 по корпусной статистике (services/bm25.py)
                    │
            RRF (k=60), дедуп по id  →  ~100 кандидатов
                    │
            Voyage rerank-2.5-lite (cross-encoder)
                    │
                 top_k в промпт

ПОЧЕМУ ИМЕННО В ТАКОМ ПОРЯДКЕ

Слияние стоит ДО реранкера, а не после. Реранкер — cross-encoder: он прогоняет
пару (запрос, документ) через модель для КАЖДОГО кандидата, то есть стоит
линейно от их числа. Пустить его по всему корпусу невозможно, по 100 кандидатам
— один вызов API. При этом он самый точный из имеющихся ранжировщиков, поэтому
он должен видеть ОБЪЕДИНЁННЫЙ пул: задача слияния — набрать полноту (чтобы
нужный кусок вообще попал в сотню), задача реранкера — точность (расставить
эту сотню правильно). Если реранкить ветки по отдельности и сливать потом,
теряется единственное место, где баллы действительно сопоставимы — общая шкала
одного cross-encoder'а на одном запросе.

ЧТО ДАЁТ КАЖДАЯ ВЕТКА

Векторная находит по смыслу и переживает переформулировку, но систематически
промахивается по точным токенам: «Aufgabe 14b», «H2O», «Satz des Pythagoras»,
номера параграфов. Лексическая ловит ровно это и ничего не знает о смысле.
Порознь каждая имеет слепую зону, которой у другой нет.

ПОРОГ ОТСЕЧЕНИЯ

similarity > 0.7 применяется в обеих ветках векторного поиска. Раньше порог
стоял только в ветке «искать по всем урокам», а при конкретном lesson_id
отсутствовал — то есть на вопрос не по теме урока модель гарантированно
получала три самых нерелевантных куска этого урока и отвечала по ним.
"""

import json
import re
import os
from typing import List, Optional

import psycopg2
import psycopg2.extras

from services.bm25 import CorpusStats, parse_tsvector, rank_by_bm25, rrf_fuse
from services.embeddings import chunk_text, get_embedding, get_embeddings, rerank

DATABASE_URL = os.getenv("DATABASE_URL")

# Кандидатов на ветку. 60 — с запасом 5–10x к финальным 3–8, как рекомендуется
# для двухступенчатых схем. Для поиска в пределах одного урока корпус и так
# маленький; 60 берётся ради кросс-урочного поиска.
CANDIDATES_PER_BRANCH = 60

# Сколько кандидатов уходит в реранкер после слияния. Ограничение
# rerank-2.5-lite — 1000 документов и 32k токенов на запрос, так что 100 это
# выбор по цене и задержке, а не по лимиту API.
RERANK_POOL = 100

# Ниже этого косинусного сходства чанк считается нерелевантным и выбрасывается
# до слияния. 0.7 для voyage-3 — эмпирический порог «про то же самое».
SIMILARITY_THRESHOLD = 0.7

# Конфигурация FTS. ДОЛЖНА совпадать с той, что зашита в generated column
# content_tsv (см. миграцию 20260906120000_hybrid_search_bm25). Разойдутся —
# лексемы запроса перестанут совпадать с индексом, и лексическая ветка молча
# вернёт ноль строк.
FTS_CONFIG = "simple"

_SELECT_FIELDS = """
    lmc.id::text        AS id,
    lmc.content         AS content,
    lmc.lesson_id       AS lesson_id,
    lmc.material_id     AS material_id,
    lmc.chunk_index     AS chunk_index,
    lmc.metadata        AS metadata,
    lmc.content_tsv::text AS tsv
"""


def get_conn():
    conn = psycopg2.connect(DATABASE_URL)
    psycopg2.extras.register_uuid(conn)
    return conn


def _check_identity(authenticated_user_id: str, requester_id: str) -> None:
    if not authenticated_user_id or authenticated_user_id != requester_id:
        raise PermissionError(
            f"JWT identity ({authenticated_user_id}) does not match requester_id ({requester_id})"
        )


# ═══════════════════════════════════════════════════════════════════════════
#  Индексация
# ═══════════════════════════════════════════════════════════════════════════

def ingest_document(
    requester_id: str,
    authenticated_user_id: str,
    lesson_id: str,
    material_id: str,
    text: str,
    metadata: Optional[dict] = None,
) -> int:
    """Режет материал на смысловые чанки, считает embeddings, пишет в БД.
    """
    _check_identity(authenticated_user_id, requester_id)

    conn = get_conn()
    cur = conn.cursor()
    try:
        cur.execute(
            "SELECT 1 FROM lessons WHERE id = %s AND tutor_id = %s",
            (lesson_id, requester_id),
        )
        if not cur.fetchone():
            raise PermissionError(f"requester {requester_id} is not the tutor of lesson {lesson_id}")

        chunks = chunk_text(text)
        if not chunks:
            return 0
        embeddings = get_embeddings(chunks, input_type="document")

        cur.execute("DELETE FROM lesson_material_chunks WHERE material_id = %s", (material_id,))

        for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
            cur.execute(
                """
                INSERT INTO lesson_material_chunks
                    (lesson_id, material_id, chunk_index, content, embedding, metadata)
                VALUES (%s, %s, %s, %s, %s::vector, %s)
                """,
                (lesson_id, material_id, i, chunk, json.dumps(embedding), json.dumps(metadata or {})),
            )

        conn.commit()
        return len(chunks)

    except Exception:
        conn.rollback()
        raise
    finally:
        cur.close()
        conn.close()


# ═══════════════════════════════════════════════════════════════════════════
#  Две ветки поиска
# ═══════════════════════════════════════════════════════════════════════════

def _vector_candidates(cur, query: str, requester_id: str, lesson_id: Optional[str]) -> list[dict]:
    """Векторная ветка: pgvector, косинусное расстояние, с порогом."""
    embedding_json = json.dumps(get_embedding(query, input_type="query"))

    scope = "AND lmc.lesson_id = %s" if lesson_id else ""
    params: list = [embedding_json, requester_id, requester_id]
    if lesson_id:
        params.append(lesson_id)
    params += [embedding_json, SIMILARITY_THRESHOLD, embedding_json, CANDIDATES_PER_BRANCH]

    cur.execute(
        f"""
        SELECT {_SELECT_FIELDS},
               1 - (lmc.embedding <=> %s::vector) AS similarity
        FROM lesson_material_chunks lmc
        JOIN lessons l ON l.id = lmc.lesson_id
        WHERE (l.client_id = %s OR l.tutor_id = %s)
          {scope}
          AND lmc.embedding IS NOT NULL
          AND 1 - (lmc.embedding <=> %s::vector) > %s
        ORDER BY lmc.embedding <=> %s::vector
        LIMIT %s
        """,
        params,
    )
    return [dict(row) for row in cur.fetchall()]


def _lexical_candidates(cur, query: str, requester_id: str, lesson_id: Optional[str]) -> list[dict]:
    """Лексическая ветка: полнотекстовый поиск Postgres по GIN-индексу.

    websearch_to_tsquery, а не plainto_tsquery: он понимает кавычки для точных
    фраз, OR и минус для исключения — то, как люди на самом деле пишут запросы.
    И он не падает на произвольном вводе, а возвращает пустой tsquery, который
    просто ничего не находит.

    ts_rank_cd используется ТОЛЬКО для отбора кандидатов и порядка внутри
    ветки. Итоговый лексический балл считает BM25 — ts_rank это не BM25:
    в нём нет ни IDF, ни насыщения частоты, ни нормировки на среднюю длину.
    """
    scope = "AND lmc.lesson_id = %s" if lesson_id else ""
    params: list = [FTS_CONFIG, query, requester_id, requester_id]
    if lesson_id:
        params.append(lesson_id)
    params.append(CANDIDATES_PER_BRANCH)

    cur.execute(
        f"""
        WITH q AS (SELECT websearch_to_tsquery(%s::regconfig, %s) AS tsq)
        SELECT {_SELECT_FIELDS},
               ts_rank_cd(lmc.content_tsv, q.tsq, 32) AS lex_rank
        FROM lesson_material_chunks lmc
        JOIN lessons l ON l.id = lmc.lesson_id
        CROSS JOIN q
        WHERE lmc.content_tsv @@ q.tsq
          AND (l.client_id = %s OR l.tutor_id = %s)
          {scope}
        ORDER BY lex_rank DESC
        LIMIT %s
        """,
        params,
    )
    return [dict(row) for row in cur.fetchall()]


def _query_lexemes(cur, query: str) -> list[str]:
    """Лексемы запроса — по версии самого Postgres.

    Токенизировать запрос на стороне Python нельзя: свой токенизатор разойдётся
    с парсером Postgres на дефисах, URL, числах и составных словах, лексемы
    перестанут совпадать с теми, что лежат в content_tsv и в rag_lexeme_df,
    df не найдётся, и IDF молча обнулится для всех термов.
    """
    cur.execute(
        "SELECT lexeme FROM unnest(to_tsvector(%s::regconfig, %s)) AS t(lexeme, positions, weights)",
        (FTS_CONFIG, query),
    )
    return [row["lexeme"] for row in cur.fetchall()]


WEIGHT_MIN = 0.5
WEIGHT_MAX = 1.5
N_SHORT = 3   # запросов такой длины и короче — считаем «точным термином»
N_LONG = 8    # такой длины и длиннее — считаем «естественным вопросом»

_EXACT_TOKEN = re.compile(r"\d")  # цифры в токене — «Aufgabe 14b», «H2O»


def branch_weights(query: str) -> list[float]:
    """Веса веток при слиянии: [векторная, лексическая].

    RRF по умолчанию считает обе ветки равноправными. Но их сильные стороны
    зависят от того, КАК сформулирован запрос:

      «Aufgabe 14b», «H2O», «Satz des Pythagoras»
          — короткий, из точных терминов. Векторная ветка на таких запросах
            плывёт (эмбеддинг трёх слов почти не несёт смысла), лексическая
            попадает точно.

      «объясни, почему дискриминант определяет количество корней»
          — длинный вопрос обычными словами. Лексическая ветка вытащит по
            стоп-словам («почему», «количество») случайный мусор, потому что
            конфигурация 'simple' их не отсеивает; векторная поймёт смысл.

    Длина запроса используется как непрерывный признак: до N_SHORT слов вес
    целиком на стороне лексики, от N_LONG — на стороне вектора, между ними
    линейная интерполяция. Разрыв здесь был бы хуже плавного перехода: запрос
    из 4 слов не отличается по природе от запроса из 5.

    Диапазон 0.5–1.5 (то есть максимум 3:1) выбран сознательно узким. RRF
    работает с РАНГАМИ, а не с баллами, поэтому перекос вроде 10:1 не
    «усиливает» ветку, а просто выключает вторую: её первое место окажется
    ниже десятого места первой.
    """
    words = query.split()
    n = len(words)

    if n <= N_SHORT:
        t = 0.0
    elif n >= N_LONG:
        t = 1.0
    else:
        t = (n - N_SHORT) / (N_LONG - N_SHORT)  # линейная интерполяция между порогами

    w_lexical = WEIGHT_MAX - t * (WEIGHT_MAX - WEIGHT_MIN)
    w_vector = WEIGHT_MIN + t * (WEIGHT_MAX - WEIGHT_MIN)

    # цифро-буквенные токены — сильный сигнал «точный термин» независимо от длины
    if any(_EXACT_TOKEN.search(w) for w in words):
        w_lexical = max(w_lexical, WEIGHT_MAX)
        w_vector = min(w_vector, WEIGHT_MIN)

    return [w_vector, w_lexical]



def _corpus_stats(cur, lexemes: list[str], pool: list[dict]) -> CorpusStats:
    """N, avgdl и df — из материализованных представлений.

    <critical>
    Это единственный корректный источник. Считать df по пулу кандидатов нельзя:
    пул отобран этим же запросом, поэтому почти каждый документ в нём содержит
    почти каждый терм, n≈N, и IDF схлопывается в ноль ОДИНАКОВО для всех
    термов — BM25 перестаёт отличать редкое слово от частого. Подробный разбор
    с числами — в шапке services/bm25.py.
    </critical>

    Если миграция не накатана, представлений нет — тогда честный откат на
    пуловый df с флагом degraded, а не молчаливая деградация качества.
    """
    try:
        cur.execute("SELECT n_docs, avgdl FROM rag_corpus_stats LIMIT 1")
        row = cur.fetchone()
        if not row or not row["n_docs"]:
            raise LookupError("rag_corpus_stats is empty")

        df: dict[str, int] = {}
        if lexemes:
            cur.execute(
                "SELECT lexeme, ndoc FROM rag_lexeme_df WHERE lexeme = ANY(%s::text[])",
                (lexemes,),
            )
            df = {r["lexeme"]: r["ndoc"] for r in cur.fetchall()}

        return CorpusStats(n_docs=int(row["n_docs"]), avgdl=float(row["avgdl"] or 1.0), df=df)
       
    except (psycopg2.Error, LookupError):
        # Представления ещё не созданы или пусты — откатываемся на пул.
        # Транзакция после ошибки Postgres в неопределённом состоянии, поэтому
        # откатываем её явно, иначе следующий запрос упадёт с InFailedSqlTransaction.
        try:
            cur.connection.rollback()
        except psycopg2.Error:
            pass
        parsed = [parse_tsvector(row.get("tsv") or "") for row in pool]
        return CorpusStats.fallback_from_pool(
            [tf for tf, _ in parsed], [length for _, length in parsed]
        )


# ═══════════════════════════════════════════════════════════════════════════
#  Основной поиск
# ═══════════════════════════════════════════════════════════════════════════

def search_similar_chunks(
    query: str,
    requester_id: str,
    authenticated_user_id: str,
    lesson_id: Optional[str] = None,
    top_k: int = 3,
) -> List[dict]:
    """Гибридный поиск: вектор + BM25 → RRF → реранкинг.

    Обе ветки ограничены уроками, где requester_id — клиент или тьютор
    (JOIN на lessons), а authenticated_user_id из проверенного JWT обязан
    совпадать с requester_id.
    """
    _check_identity(authenticated_user_id, requester_id)

    conn = get_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    try:
        vector_rows = _vector_candidates(cur, query, requester_id, lesson_id)

        # Лексическая ветка требует колонки content_tsv из миграции
        # hybrid_search_bm25. Если её нет — работаем в чисто векторном режиме
        try:
            lexical_rows = _lexical_candidates(cur, query, requester_id, lesson_id)
            lexemes = _query_lexemes(cur, query)
        except psycopg2.Error as e:
            conn.rollback()
            print(
                "[retrieval] lexical branch unavailable, falling back to vector-only search. "
                f"Run migration 20260906120000_hybrid_search_bm25. Cause: {type(e).__name__}: {e}"
            )
            lexical_rows, lexemes = [], []

        if not vector_rows and not lexical_rows:
            return []

        # ── Слияние ────────────────────────────────────────────────────────
        by_id: dict[str, dict] = {}
        for row in vector_rows + lexical_rows:
            by_id.setdefault(row["id"], row)

        vector_order = [r["id"] for r in vector_rows]

        if lexical_rows and lexemes:
            stats = _corpus_stats(cur, lexemes, lexical_rows)
            if stats.degraded:
                print(
                    "[retrieval] BM25 running on pool-local document frequencies — IDF is "
                    "flattened and lexical ranking is degraded. Run SELECT rag_refresh_corpus_stats()."
                )
            bm25_ranked = rank_by_bm25(lexemes, lexical_rows, stats)
            # Ноль означает, что ни один терм запроса не встретился, — такой
            # документ попал в выдачу только из-за особенностей tsquery и в
            # слиянии участвовать не должен.
            lexical_order = [lexical_rows[i]["id"] for i, score in bm25_ranked if score > 0]
        else:
            lexical_order = []

        if lexical_order:
            fused = rrf_fuse([vector_order, lexical_order], weights=branch_weights(query))
        else:
            fused = [(doc_id, 1.0 / (60 + i)) for i, doc_id in enumerate(vector_order, start=1)]

        candidates = [by_id[doc_id] for doc_id, _ in fused[:RERANK_POOL] if doc_id in by_id]
        if not candidates:
            return []

        # ── Реранкинг ──────────────────────────────────────────────────────
        # Cross-encoder видит запрос и документ вместе, поэтому ловит то, чего
        # не видит ни одна из веток: например, что чанк упоминает нужный термин,
        # но отвечает на другой вопрос.
        reranked = rerank(query, [c["content"] for c in candidates], top_k=top_k)

        results = []
        for item in reranked:
            row = dict(candidates[item["index"]])
            row["similarity"] = item["relevance_score"]
            row.pop("tsv", None)  # служебное поле наружу не отдаём
            results.append(row)
        return results

    finally:
        cur.close()
        conn.close()


def search_lesson_summaries(
    query: str,
    requester_id: str,
    authenticated_user_id: str,
    top_k: int = 3,
) -> List[dict]:
    """Поиск по саммари прошедших уроков — «что мы вообще проходили?».

    Здесь только векторная ветка и без реранкинга, и это осознанно: саммари
    на пользователя десятки, а не тысячи, они уже сжаты, и различать их по
    точным токенам нечем — лексическая ветка на таком корпусе даёт шум, а
    реранкинг стоит вызова API ради переупорядочивания пяти строк.
    Порог 0.7 применяется — иначе на вопрос не по теме вернутся три
    произвольных саммари, и модель ответит по ним.
    """
    _check_identity(authenticated_user_id, requester_id)

    embedding_json = json.dumps(get_embedding(query, input_type="query"))

    conn = get_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    try:
        cur.execute(
            """
            SELECT ls.content,
                   ls.lesson_id,
                   ls.created_at,
                   1 - (ls.embedding <=> %s::vector) AS similarity
            FROM lesson_summaries ls
            JOIN lessons l ON l.id = ls.lesson_id
            WHERE ls.embedding IS NOT NULL
              AND (l.client_id = %s OR l.tutor_id = %s)
              AND 1 - (ls.embedding <=> %s::vector) > %s
            ORDER BY ls.embedding <=> %s::vector
            LIMIT %s
            """,
            (embedding_json, requester_id, requester_id,
             embedding_json, SIMILARITY_THRESHOLD, embedding_json, top_k),
        )
        return [dict(row) for row in cur.fetchall()]
    finally:
        cur.close()
        conn.close()
