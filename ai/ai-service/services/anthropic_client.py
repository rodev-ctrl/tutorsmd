import anthropic
import os

api_key=os.getenv("ANTHROPIC_API_KEY")

client = anthropic.Anthropic(api_key=api_key)

async def generate_summary(transcript: str) -> str:
    response = await client.messages.create(
        model="claude-sonnet-5",
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
    response = await client.messages.create(
        model="claude-sonnet-5",
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
    response = await client.messages.create(
        model="claude-sonnet-5",
        max_tokens=1000,
        system=f"""Du bist ein Lernassistent für TutorsMD.
Beantworte Fragen basierend auf dem folgenden Kontext aus den Unterrichtsmaterialien.
Wenn der Kontext nicht ausreicht, sage es ehrlich.

Kontext:
{context}""",
        messages=[{"role": "user", "content": question}],
    )
    return response.content[0].text

async def answer_with_web_search(question: str) -> dict:
    """
    Fallback wenn keine relevanten Unterrichtsmaterialien gefunden wurden.
    Anthropic führt die Suche server-seitig aus (kein eigener Agent-Loop nötig).
    """
    response = await client.messages.create(
        model="claude-sonnet-5",
        max_tokens=1000,
        tools=[{"type": "web_search_20260209", "name": "web_search"}],
        system="""Du bist ein Lernassistent für TutorsMD.
Für diese Frage wurden keine passenden Unterrichtsmaterialien gefunden.
Nutze die Websuche, um eine sachlich korrekte, kurze Antwort zu geben.
Weise am Ende darauf hin, dass die Antwort nicht aus den Unterrichtsmaterialien stammt.""",
        messages=[{"role": "user", "content": question}],
    )

    answer_text = "".join(
        block.text for block in response.content if block.type == "text"
    )
    citations = [
        block.input.get("query")
        for block in response.content
        if block.type == "server_tool_use" and block.name == "web_search"
    ]

    return {"answer": answer_text, "queries": citations}