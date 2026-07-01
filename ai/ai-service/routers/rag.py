"""
RAG = RETRIEVAL + AUGMENTED + GENERATION
RETRIEVAL - достать нужную информацию (вот тут векторный поиск)
AUGMENTED - добавить её в контекст модели
GENERATION - LLM генерирует ответ на основе этого контекста

Но RETRIEVAL можно делать по-разному:

    1) Обычный SQL поиск (точное совпадение слов):
        SELECT * FROM materials WHERE content LIKE '%квадратное уравнение%'
        

    2) Векторный поиск (по смыслу, находит семантически похожее):
        SELECT * FROM materials ORDER BY embedding <=> query_embedding LIMIT 3

    3) Гибридный (SQL фильтр + векторный поиск вместе)
"""

from fastapi import APIRouter, Depends, HTTPException
from schemas.requests import IngestDocumentRequest, AskRequest
from services.retrieval import ingest_document, search_similar_chunks
from services.anthropic_client import answer_with_context
from auth import verify_jwt

router = APIRouter()

@router.post("/ingest")
async def ingest(
    body: IngestDocumentRequest,
    user: dict = Depends(verify_jwt),
):
    """
    Индексирует текст учебного материала
    Вызывается из Node.js после загрузки PDF/конспекта
    """
    try:
        if user:
            count = ingest_document(
                lesson_id=body.lesson_id,
                material_id=body.material_id,
                text=body.text,
                metadata=body.metadata,
            )
            return {"chunks_indexed": count, "material_id": body.material_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/ask")
async def ask(
    body: AskRequest,
    user: dict = Depends(verify_jwt),
):
    
    # RAG endpoint: вопрос -> поиск -> Claude отвечает с контекстом
    try:
        if user:
            # 1. Находим релевантные чанки
            chunks = search_similar_chunks(
                query=body.question,
                lesson_id=body.lesson_id,
                top_k=body.top_k,
            )

            if not chunks:
                return {
                    "answer":  "Keine relevanten Materialien gefunden",
                    "sources": [],
                }

            # 2. Собираем контекст из чанков
            context = "\n\n---\n\n".join([
                f"[Ähnlichkeit: {c['similarity']:.2f}]\n{c['content']}"
                for c in chunks
            ])

        # 3. Claude отвечает с контекстом
        answer = await answer_with_context(body.question, context)

        return {
            "answer":  answer,
            "sources": [
                {
                    "lesson_id":   c["lesson_id"],
                    "material_id": c["material_id"],
                    "similarity":  round(float(c["similarity"]), 3),
                    "excerpt":     c["content"][:200] + "...",
                }
                for c in chunks
            ],
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))