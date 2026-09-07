"""
bm25.py — настоящий Okapi BM25 и Reciprocal Rank Fusion, реализованные вручную.

═══════════════════════════════════════════════════════════════════════════
ОТВЕТ НА ВОПРОС «BM25 УЖЕ ЕСТЬ В АРХИТЕКТУРЕ RAG ИЛИ ЭТО НАДО ПИСАТЬ САМОМУ?»
═══════════════════════════════════════════════════════════════════════════

Надо самому. Ни один слой этого проекта BM25 не даёт:

  pgvector      — ТОЛЬКО векторные расстояния (<=>, <->, <#>). Никакой
                  лексической, ключевой или BM25-функциональности в нём нет
                  вообще. VectorIndex и BM25Index — это действительно разные
                  вещи, и разные они не по реализации, а по природе: первый
                  индексирует точки в 1024-мерном пространстве смыслов,
                  второй — обратный список «слово → документы».

  Postgres FTS  — есть (to_tsvector / ts_rank / ts_rank_cd), но это НЕ BM25.
                  ts_rank считает частоту и близость термов, взвешенные по
                  A/B/C/D-меткам; в нём нет ни IDF (насколько термин редок во
                  всём корпусе), ни насыщения tf, ни нормировки на среднюю
                  длину документа — то есть отсутствуют ровно те три вещи,
                  которые и делают BM25 работающим.

  расширения    — настоящий BM25 в Postgres дают pg_search (ParadeDB) и
                  VectorChord-bm25, но оба требуют своего образа Postgres.
                  Для этого проекта это смена базового образа в
                  docker-compose ради одной функции — несоразмерно.

Поэтому: кандидатов достаёт Postgres (быстро, по GIN-индексу), а ранжирует их
BM25, посчитанный здесь.

═══════════════════════════════════════════════════════════════════════════
ФОРМУЛА
═══════════════════════════════════════════════════════════════════════════

    score(D, Q) = Σ  IDF(qᵢ) · ─────── f(qᵢ,D) · (k₁ + 1) ───────
                  qᵢ∈Q          f(qᵢ,D) + k₁·(1 − b + b·|D|/avgdl)

    IDF(qᵢ) = ln( 1 + (N − n(qᵢ) + 0.5) / (n(qᵢ) + 0.5) )

  f(qᵢ,D)  сколько раз терм qᵢ встречается в документе D
  |D|      длина D в токенах
  avgdl    средняя длина документа по КОРПУСУ
  N        число документов в корпусе
  n(qᵢ)    в скольких документах корпуса встречается qᵢ (document frequency)
  k₁=1.2   насыщение частоты: десятое вхождение слова добавляет почти ничего
  b=0.75   сила нормировки по длине

<critical>
Внешняя «1 +» в IDF обязательна (вариант Lucene). Классическая форма
ln((N − n + 0.5)/(n + 0.5)) уходит в МИНУС, когда терм встречается больше чем
в половине документов, и тогда документ, где слово встречается ЧАЩЕ, получает
балл НИЖЕ — ранжирование переворачивается. См. self-test внизу файла.
</critical>

═══════════════════════════════════════════════════════════════════════════
ПОЧЕМУ df БЕРЁТСЯ ИЗ КОРПУСА, А НЕ ИЗ ПУЛА КАНДИДАТОВ
═══════════════════════════════════════════════════════════════════════════

Соблазнительно посчитать df прямо по тем 60 строкам, что вернул Postgres.
Это тихо ломает всю идею BM25, и вот почему.

Пул кандидатов — не случайная выборка из корпуса. Он ОТОБРАН ЭТИМ ЖЕ
ЗАПРОСОМ, поэтому почти каждый документ в пуле содержит почти каждый терм
запроса: n_pool(qᵢ) ≈ N_pool. Подставляем:

    IDF_pool ≈ ln(1 + 0.5/N_pool) ≈ 0     — и это одинаково для ВСЕХ термов.

То есть IDF перестаёт различать редкие и частые слова, и BM25 вырождается в
«tf с нормировкой по длине» — примерно то же, что уже даёт ts_rank.
На числах (корпус 1 млн документов):

    «Zellatmung» (df=1000, 0.1%):  корпусный IDF ≈ 6.91, пуловый ≈ 0.11
    «Zelle»      (df=500k, 50%):   корпусный IDF ≈ 0.69, пуловый ≈ 0.06
    отношение редкий:частый        было 10:1        стало 2:1

Поэтому N, df и avgdl приходят сюда из материализованных представлений
`lexeme_df` и `corpus_stats` (см. миграцию add_fts_bm25). Это ровно то же
решение, что `dfs_query_then_fetch` в Elasticsearch.

Если представлений в базе ещё нет (миграция не накатана), CorpusStats.fallback
честно считает df по пулу и ставит флаг degraded=True — работать будет,
качество лексической ветки будет ниже, и это видно в логах, а не молча.

═══════════════════════════════════════════════════════════════════════════
ТОКЕНИЗАЦИЯ
═══════════════════════════════════════════════════════════════════════════

Токенизируем не мы — токенизирует Postgres. Из базы приходит уже готовый
`content_tsv::text`, здесь он только разбирается. Это даёт точное совпадение
токенов запроса и документа: свой Python-токенизатор неизбежно разошёлся бы
с парсером Postgres на дефисах, URL и составных словах, df перестал бы
находиться, и IDF молча обнулился бы.
"""

import math
import re
from dataclasses import dataclass, field

K1 = 1.2
B = 0.75

# Формат tsvector в текстовом виде: 'lexeme':1,4,17 'other':2A
# Внутри лексемы одинарная кавычка удваивается ('it''s'), позиции могут нести
# метку веса A–D (для 'simple' без setweight их не будет, но парсер терпимый).
_TSV_ENTRY = re.compile(r"'((?:[^']|'')*)'(?::((?:\d+[A-Da-d]?)(?:,\d+[A-Da-d]?)*))?")


def parse_tsvector(tsv_text: str) -> tuple[dict[str, int], int]:
    """`content_tsv::text` → ({лексема: частота}, длина документа в токенах).

    Длина — это сумма позиций, а не число различных лексем: |D| в формуле
    BM25 означает именно количество токенов. length(tsvector) в SQL вернул бы
    число различных лексем и занизил бы |D| у документов с повторами —
    то есть ровно у тех, кого нормировка по длине и должна штрафовать.
    """
    tf: dict[str, int] = {}
    total = 0
    if not tsv_text:
        return tf, 0

    for match in _TSV_ENTRY.finditer(tsv_text):
        lexeme = match.group(1).replace("''", "'")
        positions = match.group(2)
        count = len(positions.split(",")) if positions else 1
        tf[lexeme] = tf.get(lexeme, 0) + count
        total += count

    return tf, total


@dataclass
class CorpusStats:
    """Корпусная статистика для IDF. Единственный источник — БД."""

    n_docs: int
    avgdl: float
    df: dict[str, int] = field(default_factory=dict)
    degraded: bool = False  # True → df посчитан по пулу, качество ниже

    @classmethod
    def fallback_from_pool(cls, docs_tf: list[dict[str, int]], doc_lens: list[int]) -> "CorpusStats":
        """Аварийный режим: матвью нет, считаем по тому, что есть.

        Осознанно хуже (см. блок про пуловый df в шапке модуля) — но лучше,
        чем упасть, и degraded=True делает деградацию видимой в логах.
        """
        df: dict[str, int] = {}
        for tf in docs_tf:
            for lexeme in tf:
                df[lexeme] = df.get(lexeme, 0) + 1
        n = max(len(docs_tf), 1)
        return cls(
            n_docs=n,
            avgdl=(sum(doc_lens) / n) if doc_lens else 1.0,
            df=df,
            degraded=True,
        )


def idf(lexeme: str, stats: CorpusStats) -> float:
    """Сглаженный неотрицательный IDF (вариант Lucene/Elasticsearch)."""
    n = stats.df.get(lexeme, 0)
    return math.log(1.0 + (stats.n_docs - n + 0.5) / (n + 0.5))


def bm25_score(
    query_lexemes: list[str],
    doc_tf: dict[str, int],
    doc_len: int,
    stats: CorpusStats,
    k1: float = K1,
    b: float = B,
) -> float:
    """BM25 одного документа относительно запроса."""
    if not query_lexemes or doc_len <= 0:
        return 0.0

    avgdl = stats.avgdl if stats.avgdl > 0 else float(doc_len)
    norm = k1 * (1.0 - b + b * (doc_len / avgdl))

    total = 0.0
    for lexeme in query_lexemes:
        f = doc_tf.get(lexeme, 0)
        if f == 0:
            continue
        total += idf(lexeme, stats) * (f * (k1 + 1.0)) / (f + norm)
    return total


def rank_by_bm25(
    query_lexemes: list[str],
    docs: list[dict],
    stats: CorpusStats,
    tsv_key: str = "tsv",
) -> list[tuple[int, float]]:
    """Считает BM25 для всех документов, возвращает [(индекс, балл)] по убыванию.

    docs — строки из Postgres, у каждой ожидается ключ tsv_key со значением
    `content_tsv::text`.
    """
    scored: list[tuple[int, float]] = []
    for i, doc in enumerate(docs):
        tf, length = parse_tsvector(doc.get(tsv_key) or "")
        scored.append((i, bm25_score(query_lexemes, tf, length, stats)))
    scored.sort(key=lambda pair: pair[1], reverse=True)
    return scored


# ═══════════════════════════════════════════════════════════════════════════
#  Reciprocal Rank Fusion
# ═══════════════════════════════════════════════════════════════════════════

RRF_K = 60


def rrf_fuse(rankings: list[list[str]], k: int = RRF_K, weights: list[float] | None = None) -> list[tuple[str, float]]:
    """Сливает несколько ранжированных списков id в один.

        RRF(d) = Σ  1 / (k + rank_i(d))          rank считается с 1

    Почему именно RRF, а не «нормализовать баллы и сложить»:
    у двух веток баллы принципиально несопоставимы. Косинусная близость живёт
    в [0, 1] и у хороших совпадений жмётся к 0.8–0.95; BM25 не ограничен сверху
    и зависит от длины запроса — при трёх термах вместо одного он просто втрое
    больше. Min-max нормировка внутри выдачи это не чинит: она растягивает на
    [0,1] и десять отличных результатов, и десять одинаково плохих, так что
    у ветки, которая вообще ничего не нашла, лучший мусор получит 1.0.

    RRF смотрит только на ПОРЯДОК и потому не нуждается в общей шкале.
    Константа k = 60 — из статьи Cormack, Clarke & Buettcher (SIGIR 2009), где
    она подобрана эмпирически; её роль — сгладить разницу между верхними
    позициями, чтобы первое место в одной ветке не забивало собой второе-третье
    место в другой.

    weights позволяет усилить одну ветку (например, векторную при коротких
    расплывчатых запросах). По умолчанию ветки равноправны.
    """
    if weights is None:
        weights = [1.0] * len(rankings)

    scores: dict[str, float] = {}
    for ranking, weight in zip(rankings, weights):
        for position, doc_id in enumerate(ranking, start=1):
            scores[doc_id] = scores.get(doc_id, 0.0) + weight / (k + position)

    return sorted(scores.items(), key=lambda pair: pair[1], reverse=True)


# ═══════════════════════════════════════════════════════════════════════════
#  Self-test: python -m services.bm25
# ═══════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    # Корпус из статьи-примера: N = 2, запрос из одного терма "vektor".
    #   D1 = "vektor vektor datenbank"        |D1| = 3, f = 2
    #   D2 = "vektor datenbank index suche"   |D2| = 4, f = 1
    #   n(vektor) = 2, avgdl = 3.5
    stats = CorpusStats(n_docs=2, avgdl=3.5, df={"vektor": 2})

    assert abs(idf("vektor", stats) - 0.18232155679395463) < 1e-12, idf("vektor", stats)

    # Эталоны пересчитаны здесь же по формуле, а не взяты из статьи:
    #   idf   = ln(1.2)                                    = 0.1823215567939546
    #   D1: norm = 1.2·(0.25 + 0.75·3/3.5) = 1.0714285714285714
    #       s1   = idf · (2·2.2)/(2 + norm) = 0.2611862301978513
    #   D2: norm = 1.2·(0.25 + 0.75·4/3.5) = 1.3285714285714285
    #       s2   = idf · (1·2.2)/(1 + norm) = 0.17225472236974856
    s1 = bm25_score(["vektor"], {"vektor": 2, "datenbank": 1}, 3, stats)
    s2 = bm25_score(["vektor"], {"vektor": 1, "datenbank": 1, "index": 1, "suche": 1}, 4, stats)
    assert abs(s1 - 0.2611862301978513) < 1e-12, s1
    assert abs(s2 - 0.17225472236974856) < 1e-12, s2
    assert s1 > s2, "документ с большей частотой терма обязан быть выше"

    # Насыщение: при |D| = avgdl множитель tf стремится к k1 + 1 = 2.2, но не превышает его.
    flat = CorpusStats(n_docs=2, avgdl=1000.0, df={"x": 1})
    saturated = bm25_score(["x"], {"x": 1000}, 1000, flat) / idf("x", flat)
    assert saturated < 2.2 and saturated > 2.19, saturated

    # Парсер tsvector: позиции считаются как частота, длина = сумма позиций.
    tf, dl = parse_tsvector("'datenbank':3 'vektor':1,2")
    assert tf == {"datenbank": 1, "vektor": 2}, tf
    assert dl == 3, dl
    # Экранированная кавычка внутри лексемы не должна ломать разбор.
    tf2, _ = parse_tsvector("'it''s':1")
    assert tf2 == {"it's": 1}, tf2

    # RRF: документ, стоящий вторым в обоих списках, обязан обойти документа,
    # который в одном списке первый, а в другом отсутствует.
    fused = dict(rrf_fuse([["a", "b", "c"], ["x", "b", "y"]]))
    assert fused["b"] > fused["a"], fused
    assert abs(fused["b"] - (1 / 62 + 1 / 62)) < 1e-12

    # Классический (несглаженный) IDF на этих же данных переворачивает порядок —
    # тот самый баг, ради предотвращения которого стоит внешняя «1 +».
    classic = math.log((2 - 2 + 0.5) / (2 + 0.5))
    assert classic < 0, "проверка самой ловушки: классический IDF здесь отрицателен"

    print("bm25 self-test: OK")
