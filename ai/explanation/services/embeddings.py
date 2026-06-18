import anthropic
import os
import httpx
from typing import List


API_KEY = os.getenv('VOYAGE_API_KEY')
client = anthropic.Anthropic(api_key=API_KEY)

# Voyage-3 через Anthropic SDK — лучшее качество для multilingual
EMBEDDING_MODEL = "voyage-3"
EMBEDDING_DIM   = 1024  # размерность voyage-3

def get_embedding(text: str) -> List[float]:
    """Превращает текст в вектор."""
    response = client.embeddings.create(
        model="voyage-3",
        input=text,
    )
    # Используем voyage через httpx напрямую
    
    return response.embeddings[0].embedding

def get_embeddings(texts: List[str]) -> List[List[float]]:
    
    response = client.embeddings.create(
        model="voyage-3",
        input=texts,
    )
    return [e.embedding for e in sorted(response.embeddings, key=lambda x: x.index)]

def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> List[str]:
    """
    Разбивает текст на чанки
    
    chunk_size = 500 токенов (примерно 400 слов)
    overlap    = 50  токенов - перекрытие чтобы не терять контекст на границах
    
    Пример:
    [----chunk1----]
                [--overlap--]
                [----chunk2----]
    """
    words  = text.split()
    chunks = []
    start  = 0

    while start < len(words):
        end   = min(start + chunk_size, len(words))
        chunk = " ".join(words[start:end])
        chunks.append(chunk)

        if end == len(words):
            break

        start = end - overlap  # сдвигаемся с перекрытием

    return chunks