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

    requester_id muss dem user_id-Claim des verifizierten JWT entsprechen —
    sonst könnte ein blanker Service-Token (ohne persönliche Bindung) im Namen
    eines beliebigen Nutzers Termine anfragen. Hinweis: tutor_calendar_id
    selbst wird hier NICHT gegen eine echte Tutor-Zuordnung geprüft — dafür
    gibt es aktuell keine Spalte im Prisma-Schema (kein Tutor.googleCalendarId
    o.ä.). Das ist ein separates, größeres Thema (Schema + backend muss diese
    ID serverseitig auflösen statt sie vom Client zu übernehmen), nicht Teil
    dieses Fixes.
    """
    authenticated_user_id = user.get("user_id")
    if not authenticated_user_id or authenticated_user_id != body.requester_id:
        raise HTTPException(
            status_code=403,
            detail=f"JWT identity ({authenticated_user_id}) does not match requester_id ({body.requester_id})",
        )

    try:
        # requester_id идёт дальше не как «данные», а как серверный контекст:
        # инструменты resolve_user_timezone и get_lesson_context берут личность
        # только оттуда, поэтому модель не может подставить чужой профиль.
        result = await book_lesson(
            request_text=body.request_text,
            tutor_calendar_id=body.tutor_calendar_id,
            requester_id=authenticated_user_id,
            lesson_id=body.lesson_id,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
