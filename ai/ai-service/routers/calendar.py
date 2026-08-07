from fastapi import APIRouter, Depends, HTTPException
from schemas.requests import BookLessonRequest
from services.calendar_assistant import book_lesson
from auth import verify_jwt

router = APIRouter()

@router.post("/book")
async def book(
    body: BookLessonRequest,
    user: dict = Depends(verify_jwt),
):
    """
    Bucht/prüft einen Unterrichtstermin im Google Kalender des Tutors via MCP.
    """
    try:
        result = await book_lesson(
            request_text=body.request_text,
            tutor_calendar_id=body.tutor_calendar_id,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
