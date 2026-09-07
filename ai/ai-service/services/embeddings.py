import re
import statistics
from typing import List, Literal

import voyageai

# ВАЖНО: Voyage AI — отдельная компания/API, не проксируется через Anthropic SDK.
# Прежняя реализация (anthropic.Anthropic(api_key=VOYAGE_API_KEY).embeddings.create(...))
# использовала несуществующий метод — такого namespace у Anthropic SDK нет вообще
# (сверено с документацией: ни embeddings, ни rerank там не упоминаются). Баг был
# незамечен, потому что ai-service ни разу не запускался успешно до сих пор.
vo = voyageai.Client()  # читает VOYAGE_API_KEY из окружения сам

EMBEDDING_MODEL = "voyage-3"   # 1024 измерения — совпадает с vector(1024) в схеме БД.
                                # Не менять на voyage-4/voyage-3-large не пересоздав
                                # столбец и не переиндексировав все существующие чанки.
EMBEDDING_DIM   = 1024
RERANK_MODEL    = "rerank-2.5-lite"

InputType = Literal["query", "document"]


def get_embedding(text: str, input_type: InputType = "document") -> List[float]:
    """
    Превращает текст в вектор.

    input_type различает запрос и документ — Voyage тренирует эти два типа
    ассимметрично (asymmetric retrieval), это заметно повышает точность поиска
    по сравнению с одним и тем же типом для обоих. Используй "query" для
    вопроса пользователя, "document" для чанков/саммари, которые кладутся в БД.
    """
    result = vo.embed([text], model=EMBEDDING_MODEL, input_type=input_type)
    return result.embeddings[0]


def get_embeddings(texts: List[str], input_type: InputType = "document") -> List[List[float]]:
    if not texts:
        return []
    result = vo.embed(texts, model=EMBEDDING_MODEL, input_type=input_type)
    return result.embeddings


def rerank(query: str, documents: List[str], top_k: int = 3) -> List[dict]:
    """
    Cross-encoder реранкинг: пересортировывает уже найденные векторным поиском
    кандидаты по реальной релевантности запросу. Векторный поиск быстрый, но
    сравнивает запрос и документ независимо (bi-encoder) — реранкер смотрит на
    пару целиком и заметно точнее на верхних позициях.

    Возвращает список {"index": исходный индекс в documents, "content": текст,
    "relevance_score": float}, отсортированный по убыванию релевантности.
    Пустой список на пустом input — не гоняем API ради нуля кандидатов.
    """
    if not documents:
        return []

    result = vo.rerank(query=query, documents=documents, model=RERANK_MODEL, top_k=top_k)
    return [
        {
            "index": r.index,
            "content": r.document,
            "relevance_score": r.relevance_score,
        }
        for r in result.results
    ]


def _cosine_distance(a: List[float], b: List[float]) -> float:
    dot     = sum(x * y for x, y in zip(a, b))
    norm_a  = sum(x * x for x in a) ** 0.5
    norm_b  = sum(x * x for x in b) ** 0.5
    if norm_a == 0 or norm_b == 0:
        return 1.0
    return 1 - dot / (norm_a * norm_b)


def chunk_text(text: str) -> List[str]:
    """
    Semantic chunking: режет текст не по фиксированному размеру, а там, где
    смысл реально меняется.

    1. Делим на предложения.
    2. Считаем embedding каждого предложения (отдельные вызовы Voyage —
       дороже, чем было, но именно этого просили в TODO вместо word-split).
    3. Считаем косинусное расстояние между соседними предложениями.
    4. Точка разрыва — там, где расстояние выше адаптивного порога
       (среднее + 1.5 стандартных отклонения). Ниже порога — предложения
       остаются в одном чанке.

    Старая версия считала chunk_size/overlap в ПРЕДЛОЖЕНИЯХ при значении 500 —
    реальная стенограмма урока (50-100 предложений) никогда не набирала 500,
    так что функция почти всегда возвращала один чанк на весь текст, а overlap
    не использовался ни разу. Эта версия режет по смыслу независимо от длины.
    """
    sentences = [s.strip() for s in re.split(r'(?<=[.!?])\s+', text) if s.strip()]

    if len(sentences) <= 2:
        return [text.strip()] if text.strip() else []

    embeddings = get_embeddings(sentences, input_type="document")

    distances = [
        _cosine_distance(embeddings[i], embeddings[i + 1])
        for i in range(len(embeddings) - 1)
    ]

    # Меньше 2 расстояний — статистика (mean/stdev) не имеет смысла, весь текст
    # в один чанк.
    if len(distances) < 2:
        return [" ".join(sentences)]

    mean_dist  = statistics.mean(distances)
    stdev_dist = statistics.pstdev(distances)
    threshold  = mean_dist + 1.5 * stdev_dist

    chunks  = []
    current = [sentences[0]]
    for i, dist in enumerate(distances):
        if dist > threshold:
            chunks.append(" ".join(current))
            current = [sentences[i + 1]]
        else:
            current.append(sentences[i + 1])
    chunks.append(" ".join(current))

    return chunks
