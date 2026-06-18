from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import chat, rag, vision
import os

app = FastAPI(title="TutorsMD AI Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("CLIENT_URL", "https://tutorsmd.net")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router, prefix="/chat", tags=["chat"])
app.include_router(rag.router, prefix="/rag", tags=["rag"])
app.include_router(vision.router, prefix="/vision", tags=["vision"])

@app.get("/health")
async def health():
    return {"status": "ok"}