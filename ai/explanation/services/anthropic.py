import anthropic
import os

api_key=os.getenv("ANTHROPIC_API_KEY")

client = anthropic.Anthropic(api_key)

async def generate_summary(transcript: str) -> str:
    response = client.messages.create(
        model="claude-opus-4-8",
        max_tokens=1024,
        system="""You are an educational assistant. 
Summarize tutoring lesson chat transcripts.
Output in the same language as the transcript.
Format: markdown with sections: 
## Topics Covered, ## Key Points, ## Homework (if any).""",
        messages=[{"role": "user", "content": transcript}],
    )
    return response.content[0].text

async def explain_image(base64_image: str, mime_type: str = "image/jpeg") -> str:
    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1000,
        messages=[{
            "role": "user",
            "content": [
                {
                    "type": "image",
                    "source": {
                        "type": "base64",
                        "media_type": mime_type,
                        "data": base64_image,
                    },
                },
                {
                    "type": "text",
                    "text": "Erkläre diese Aufgabe Schritt für Schritt auf Deutsch.",
                },
            ],
        }],
    )
    return response.content[0].text

async def chat_with_rag(question: str, context: str) -> str:
    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1000,
        system=f"""Du bist ein Lernassistent für TutorsMD.
Beantworte Fragen basierend auf dem folgenden Kontext aus den Unterrichtsmaterialien.
Wenn der Kontext nicht ausreicht, sage es ehrlich.

Kontext:
{context}""",
        messages=[{"role": "user", "content": question}],
    )
    return response.content[0].text