from __future__ import annotations

import io

from fastapi.testclient import TestClient
from PIL import Image

from app.main import app

client = TestClient(app)


def test_health_endpoint() -> None:
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_invalid_upload() -> None:
    response = client.post(
        "/api/analyze",
        files={"file": ("not-image.txt", b"not an image", "text/plain")},
    )
    assert response.status_code == 400
    assert "error" in response.json()


def test_valid_image_analysis() -> None:
    image = Image.new("RGB", (80, 60), (80, 140, 210))
    payload = io.BytesIO()
    image.save(payload, format="PNG")
    response = client.post(
        "/api/analyze",
        files={"file": ("sample.png", payload.getvalue(), "image/png")},
    )
    assert response.status_code == 200
    body = response.json()
    assert 0 <= body["quality_score"] <= 100
    assert "metrics" in body
    assert "top_factors" in body["explainability"]


def test_history_endpoint() -> None:
    response = client.get("/api/history")
    assert response.status_code == 200
    assert isinstance(response.json(), list)