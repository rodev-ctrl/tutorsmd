from pydantic import BaseModel, field_validator
from typing import Optional, List

# ── Vision ────────────────────────────────────────────────────────
class ExplainImageRequest(BaseModel):
    image_url: str
    language:  str = "de"
    context:   Optional[str] = None

    @field_validator("language")
    @classmethod
    def validate_language(cls, v: str) -> str:
        allowed = {"de", "ru", "en"}
        if v not in allowed:
            raise ValueError(f"Language must be one of {allowed}")
        return v

# ── Summary ───────────────────────────────────────────────────────
class SummaryRequest(BaseModel):
    lesson_id:  str
    transcript: str

    @field_validator("transcript")
    @classmethod
    def transcript_not_empty(cls, v: str) -> str:
        if len(v.strip()) < 10:
            raise ValueError("Transcript too short")
        return v.strip()

# ── RAG ───────────────────────────────────────────────────────────
class IngestDocumentRequest(BaseModel):
    lesson_id:   str
    material_id: str
    text:        str        # уже извлечённый текст из PDF/конспекта
    metadata:    Optional[dict] = None

class AskRequest(BaseModel):
    question:  str
    lesson_id: Optional[str] = None  # None = ищем по всем урокам юзера
    top_k:     int = 3               # сколько чанков брать

    @field_validator("question")
    @classmethod
    def question_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Question cannot be empty")
        return v.strip()

    @field_validator("top_k")
    @classmethod
    def top_k_range(cls, v: int) -> int:
        if not 1 <= v <= 10:
            raise ValueError("top_k must be between 1 and 10")
        return v

# ── Chat ──────────────────────────────────────────────────────────
class ChatMessage(BaseModel):
    role:    str   # "user" | "assistant"
    content: str

class ChatRequest(BaseModel):
    message:  str
    history:  List[ChatMessage] = []
    lesson_id: Optional[str] = None
    use_rag:   bool = True  # использовать ли RAG для контекста

    @field_validator("message")
    @classmethod
    def message_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Message cannot be empty")
        return v.strip()