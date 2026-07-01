# OCR - текст с фотографии в исправляемый текст
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
import httpx
import base64
from services.anthropic import explain_image
from auth import verify_jwt 

router = APIRouter()

class ExplainImageRequest(BaseModel):
    image_url: str  # presigned URL из R2

@router.post("/explain")
async def explain(
    body: ExplainImageRequest,
    user = Depends(verify_jwt),
):
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(body.image_url)
            response.raise_for_status()

        image_data = base64.b64encode(response.content).decode()
        mime_type  = response.headers.get("content-type", "image/jpeg")

        explanation = await explain_image(image_data, mime_type)
        return {"explanation": explanation}

    except httpx.HTTPError as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch image: {e}")