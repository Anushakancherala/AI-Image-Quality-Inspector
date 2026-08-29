from __future__ import annotations

import uuid
from datetime import datetime, timezone

import cv2
import numpy as np
from fastapi import FastAPI, File, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .database import get_analysis, initialize, insert_analysis, list_analyses, summary
from .model import MODEL_VERSION, analyse, ensure_model, load_bundle

app = FastAPI(title="AI Image Quality Inspector", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

initialize()
_evaluation = ensure_model()
_bundle = load_bundle()


@app.get("/api/healthz")
@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok", "model_status": "ready", "model_version": MODEL_VERSION}


@app.post("/api/analyze")
async def analyze_image(file: UploadFile = File(...)):
    allowed_types = {"image/jpeg", "image/png", "image/webp", "image/bmp", "image/tiff"}
    if file.content_type not in allowed_types:
        return JSONResponse(status_code=400, content={"error": "Upload a PNG, JPEG, WebP, BMP, or TIFF image."})
    content = await file.read()
    if not content or len(content) > 15 * 1024 * 1024:
        return JSONResponse(status_code=400, content={"error": "The image is empty or larger than 15 MB."})
    buffer = np.frombuffer(content, dtype=np.uint8)
    image = cv2.imdecode(buffer, cv2.IMREAD_COLOR)
    if image is None or image.size == 0:
        return JSONResponse(status_code=400, content={"error": "This file could not be decoded as a valid image."})
    result = analyse(image, _bundle)
    result.update(
        {
            "id": str(uuid.uuid4()),
            "filename": file.filename or "untitled-image",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
    )
    insert_analysis(result)
    return result


@app.get("/api/history")
def history(limit: int = Query(default=20, ge=1, le=100)) -> list[dict]:
    return list_analyses(limit)


@app.get("/api/history/{analysis_id}")
def history_detail(analysis_id: str):
    result = get_analysis(analysis_id)
    return result or JSONResponse(status_code=404, content={"error": "Analysis not found."})


@app.get("/api/summary")
def analysis_summary() -> dict:
    return summary("ready", MODEL_VERSION)