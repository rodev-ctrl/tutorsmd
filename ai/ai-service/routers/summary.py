from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from services.summary import generate_and_save_summary
from auth import verify_jwt

router = APIRouter()

class GenerateSummaryRequest(BaseModel):
    lesson_id: str

@router.post("/generate")
async def generate(
    body: GenerateSummaryRequest,
    user: dict = Depends(verify_jwt),
):
    try:
        return await generate_and_save_summary(body.lesson_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
