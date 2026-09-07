"""
vision.py — Aufgaben von Foto oder PDF erklären.

Zwei Endpunkte, weil die beiden Wege sich in einem API-Detail unterscheiden,
das man nicht überbrücken kann:

  POST /vision/explain           Bild  → JSON nach EXPLANATION_SCHEMA,
                                 inklusive erzwungener Gegenprobe beim Zählen.
                                 Keine Citations — die API kann (noch) nicht
                                 aus Bildern zitieren.

  POST /vision/explain-document  PDF   → Fließtext MIT Seitenzitaten.
                                 Kein JSON-Schema: citations und
                                 output_config.format zusammen sind ein 400.
"""

import base64

import httpx
from fastapi import APIRouter, Depends, HTTPException

from auth import verify_jwt
from schemas.requests import ExplainDocumentRequest, ExplainImageRequest
from services.anthropic_client import explain_document, explain_image

router = APIRouter()

# Grenzen der Claude-API: 32 MB pro Request. Wir kappen deutlich früher —
# ein 20-MB-Scan kostet ohne Mehrwert Tokens und Zeit, und die Datei liegt
# dann meist ohnehin als Bildscan ohne Textebene vor.
MAX_DOCUMENT_BYTES = 12 * 1024 * 1024
MAX_IMAGE_BYTES = 8 * 1024 * 1024

_ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}
_ALLOWED_DOC_TYPES = {"application/pdf", "text/plain"}


def _require_own_identity(user: dict, requester_id: str) -> None:
    """requester_id muss dem user_id-Claim des verifizierten JWT entsprechen.

    Ohne diese Prüfung könnte ein blankes Service-Token (das keinen
    Personenbezug hat) im Namen eines beliebigen Nutzers Inhalte auswerten
    lassen. Sie prüft NICHT, ob die URL wirklich diesem Nutzer gehört — dafür
    fehlt hier die Verknüpfung zu lesson/material; das ist Aufgabe des
    Backends, das die URL signiert.
    """
    authenticated_user_id = user.get("user_id")
    if not authenticated_user_id or authenticated_user_id != requester_id:
        raise HTTPException(
            status_code=403,
            detail=f"JWT identity ({authenticated_user_id}) does not match requester_id ({requester_id})",
        )


async def _download(url: str, limit: int) -> tuple[bytes, str]:
    """Datei holen und dabei die Größe hart begrenzen.

    Gestreamt statt response.content, damit eine 500-MB-Datei nicht erst
    vollständig in den Speicher geladen und danach abgelehnt wird.
    """
    async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
        async with client.stream("GET", url) as response:
            response.raise_for_status()
            media_type = (response.headers.get("content-type") or "").split(";")[0].strip()

            chunks: list[bytes] = []
            total = 0
            async for chunk in response.aiter_bytes():
                total += len(chunk)
                if total > limit:
                    raise HTTPException(
                        status_code=413,
                        detail=f"File exceeds the {limit // (1024 * 1024)} MB limit.",
                    )
                chunks.append(chunk)

    return b"".join(chunks), media_type


@router.post("/explain")
async def explain(
    body: ExplainImageRequest,
    user: dict = Depends(verify_jwt),
):
    """Foto einer Aufgabe → nummerierte Erklärungsschritte + Gegenprobe."""
    _require_own_identity(user, body.requester_id)

    try:
        data, media_type = await _download(body.image_url, MAX_IMAGE_BYTES)
    except HTTPException:
        raise
    except httpx.HTTPError as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch image: {e}")

    if media_type not in _ALLOWED_IMAGE_TYPES:
        # PDFs landen hier häufig versehentlich — mit einem klaren Hinweis
        # statt eines API-Fehlers aus der Tiefe.
        if media_type in _ALLOWED_DOC_TYPES:
            raise HTTPException(
                status_code=400,
                detail=f"{media_type} is a document, not an image. Use POST /vision/explain-document.",
            )
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported image type {media_type!r}. Allowed: {sorted(_ALLOWED_IMAGE_TYPES)}.",
        )

    try:
        explanation = await explain_image(
            base64.b64encode(data).decode(),
            media_type,
            user_note=body.question or body.context or "",
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Vision model call failed: {e}")

    return {"explanation": explanation}


@router.post("/explain-document")
async def explain_doc(
    body: ExplainDocumentRequest,
    user: dict = Depends(verify_jwt),
):
    """PDF/Textdatei → Erklärung mit Zitaten und Seitenzahlen.

    Die Zitate sind der eigentliche Mehrwert gegenüber "PDF-Text extrahieren
    und in den Chat kippen": jede Aussage der Antwort trägt die Seite, auf der
    sie steht, sodass der Schüler im Original nachschlagen kann.
    """
    _require_own_identity(user, body.requester_id)

    try:
        data, media_type = await _download(body.document_url, MAX_DOCUMENT_BYTES)
    except HTTPException:
        raise
    except httpx.HTTPError as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch document: {e}")

    if media_type not in _ALLOWED_DOC_TYPES:
        # Aus der Dateiendung nachziehen: manche Storage-Backends liefern
        # application/octet-stream für alles.
        if body.filename.lower().endswith(".pdf"):
            media_type = "application/pdf"
        elif body.filename.lower().endswith((".txt", ".md", ".csv")):
            media_type = "text/plain"
        else:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Unsupported document type {media_type!r}. Allowed: PDF and plain text. "
                    "DOCX/XLSX must be converted first."
                ),
            )

    try:
        result = await explain_document(
            data,
            question=body.question or "",
            filename=body.filename,
            media_type=media_type,
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Document model call failed: {e}")

    if not result["citations"]:
        # Häufigste Ursache: gescanntes PDF ohne Textebene. Die API kann daraus
        # keine Zitate erzeugen, liest den Inhalt aber trotzdem.
        result["note"] = (
            "Keine Zitate verfügbar — vermutlich ein Scan ohne Textebene. "
            "Der Inhalt wurde trotzdem ausgewertet, aber ohne Seitenangaben."
        )

    return result
