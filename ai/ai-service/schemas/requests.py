from pydantic import BaseModel, field_validator
from typing import Optional, List

# ── Vision ────────────────────────────────────────────────────────
class ExplainImageRequest(BaseModel):
    requester_id: str   # muss authenticated_user_id aus dem JWT entsprechen
    image_url:    str
    language:     str = "de"
    context:      Optional[str] = None
    question:     Optional[str] = None  # konkrete Rückfrage zum Bild, statt "erklär alles"

    @field_validator("language")
    @classmethod
    def validate_language(cls, v: str) -> str:
        allowed = {"de", "ru", "en"}
        if v not in allowed:
            raise ValueError(f"Language must be one of {allowed}")
        return v


# ── Dokumente (PDF / Text) ────────────────────────────────────────
# Getrennt von ExplainImageRequest, weil der Antwortweg ein anderer ist:
# Dokumente laufen mit citations (Seitenzahlen im Ergebnis) und deshalb OHNE
# JSON-Schema — beides zusammen gibt einen 400. Bilder umgekehrt: Schema, keine
# Citations (Bildzitate unterstützt die API nicht).
class ExplainDocumentRequest(BaseModel):
    requester_id: str
    document_url: str                     # vom Backend signierte URL zur Datei
    question:     Optional[str] = None    # None = "fasse das Dokument zusammen"
    filename:     str = "document.pdf"    # wird als Zitat-Titel angezeigt

    @field_validator("document_url")
    @classmethod
    def url_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("document_url cannot be empty")
        return v.strip()

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
# requester_id: client_id oder tutor_id des Nutzers, für den backend diese
# Anfrage stellt — backend hat die Ownership bereits über Prisma geprüft,
# ai-service erzwingt sie hier zusätzlich per JOIN gegen lessons (defense in depth).
class IngestDocumentRequest(BaseModel):
    requester_id: str        # muss tutor_id des Lessons sein — nur der Tutor lädt Material hoch
    lesson_id:    str
    material_id:  str
    text:         str        # уже извлечённый текст из PDF/конспекта
    metadata:     Optional[dict] = None

class AskRequest(BaseModel):
    requester_id: str                 # client_id oder tutor_id — Pflicht, kein Scoping ohne Identität
    question:     str
    lesson_id:    Optional[str] = None  # None = ищем по всем урокам ЭТОГО requester_id (не всех юзеров)
    top_k:        int = 3               # сколько чанков брать

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
    requester_id: str                 # client_id oder tutor_id — Pflicht für RAG-Scoping
    message:      str
    history:      List[ChatMessage] = []
    lesson_id:    Optional[str] = None
    use_rag:      bool = True  # использовать ли RAG для контекста

    @field_validator("message")
    @classmethod
    def message_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Message cannot be empty")
        return v.strip()

# ── Calendar ──────────────────────────────────────────────────────
class BookLessonRequest(BaseModel):
    requester_id:       str   # muss authenticated_user_id aus dem JWT entsprechen
    request_text:       str   # z.B. "Buche eine Stunde für Donnerstag 16 Uhr"
    tutor_calendar_id:  str   # aus der DB, nicht vom Client frei wählbar
    # Optionaler Lektionsbezug: erlaubt dem Assistenten, über get_lesson_context
    # den bereits gebuchten Termin, die Dauer und die Zeitzonen beider Seiten
    # zu lesen, statt den Nutzer nach Daten zu fragen, die das System kennt.
    lesson_id:          Optional[str] = None

    @field_validator("request_text")
    @classmethod
    def request_text_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("request_text cannot be empty")
        return v.strip()