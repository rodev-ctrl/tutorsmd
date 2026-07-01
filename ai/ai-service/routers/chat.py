from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from schemas.requests import ChatRequest, ChatMessage
from services.retrieval import search_lesson_summaries, search_similar_chunks
from auth import verify_jwt
import anthropic
import os
import json

router  = APIRouter()
client  = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

SYSTEM_PROMPT = """Du bist ein freundlicher Lernassistent für die TutorsMD-Plattform.
Du hilfst Schülern und Lehrern bei Lernfragen.
Antworte immer in der Sprache des Nutzers (Deutsch, Russisch oder Englisch).
Wenn du RAG-Kontext erhältst, nutze ihn als primäre Informationsquelle.
Wenn du etwas nicht weißt, sage es ehrlich."""

@router.post("/message")
async def chat(
    body: ChatRequest,
    user: dict = Depends(verify_jwt),
):
    """
    AI чат с поддержкой истории и опциональным RAG контекстом.
    """
    try:
        system = SYSTEM_PROMPT

        # RAG: добавляем контекст если use_rag=True
        if body.use_rag:
            chunks = search_similar_chunks(
                query=body.message,
                lesson_id=body.lesson_id,
                top_k=3,
            )

            if not chunks:
                # Если нет материалов — ищем по саммари
                summaries = search_lesson_summaries(body.message, top_k=3)
                chunks    = summaries

            if chunks:
                context = "\n\n---\n\n".join([c["content"] for c in chunks])
                system += f"\n\n=== Relevanter Kontext ===\n{context}\n=== Ende ==="

        # Собираем историю сообщений
        messages = [
            {"role": m.role, "content": m.content}
            for m in body.history
        ]
        messages.append({"role": "user", "content": body.message})

        response = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=1000,
            system=system,
            messages=messages,
        )

        answer = response.content[0].text

        return {
            "answer":        answer,
            "input_tokens":  response.usage.input_tokens,
            "output_tokens": response.usage.output_tokens,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/stream")
async def chat_stream(
    body: ChatRequest,
    user: dict = Depends(verify_jwt),
):
    """
    Стриминг ответа — для плавного UI как в ChatGPT.
    """
    async def generate():
        messages = [
            {"role": m.role, "content": m.content}
            for m in body.history
        ]
        messages.append({"role": "user", "content": body.message})

        with client.messages.stream(
            model="claude-sonnet-4-6",
            max_tokens=1000,
            system=SYSTEM_PROMPT,
            messages=messages,
        ) as stream:
            for text in stream.text_stream:
                # Server-Sent Events формат
                yield f"data: {json.dumps({'text': text})}\n\n"

        yield "data: [DONE]\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control":               "no-cache",
            "X-Accel-Buffering":           "no",  # отключаю буферизацию nginx
        },
    )