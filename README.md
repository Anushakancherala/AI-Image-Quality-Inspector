# AI Image Quality Inspector

An offline, local-first image inspection tool for software internship technical
assessments and QA workflows. Upload an image to receive a 0–100 quality score,
an `ACCEPTABLE`, `DEGRADED`, or `POTENTIALLY_DEFECTIVE` label, issue severity and
confidence, measurable image statistics, and an explanation based on a
persisted Random Forest model.

No external AI or vision APIs are used and no API key is required.

## Architecture

```text
React + Vite dashboard
        │ multipart upload / JSON queries
        ▼
FastAPI service (Python)
        ├── OpenCV / NumPy feature extraction
        ├── scikit-learn RandomForest inference
        └── SQLite analysis history
        │
        ├── models/quality_model.joblib
        ├── evaluation/metrics.json
        └── samples/*.png
```

The frontend is the root web artifact. The existing API service runs the
FastAPI app on the `/api` path so the same routing works in local preview and
Docker Compose.

## Features

- Upload validation for PNG, JPEG, WebP, BMP, and TIFF files.
- Decode validation and useful errors for empty, corrupt, unsupported, or
  oversized files.
- Detection of blur, underexposure, overexposure, image noise, severe
  degradation, and unusual visual patterns that may be defects.
- Quality score and label with issue severity and model confidence.
- Explainability view showing the Random Forest's most important features and
  the measured value for the analyzed image.
- SQLite-backed history list and analysis detail routes.
- Reproducible synthetic training data and generated sample images.
- Health endpoint reporting service and model readiness.

## Technology stack

- Frontend: React, Vite, TypeScript, Tailwind CSS
- Backend: Python, FastAPI, Uvicorn
- Computer vision: OpenCV, Pillow, NumPy
- Machine learning: scikit-learn `RandomForestClassifier`
- Model persistence: joblib
- Database: SQLite
- Packaging: pnpm workspace and Docker Compose

## How the CV features work

Every image is decoded to a BGR array and converted to grayscale and HSV
representations. The model receives these deterministic engineered features:

- **Sharpness** — variance of the grayscale Laplacian; high-frequency detail
  drops when an image is blurred.
- **Brightness** — mean grayscale intensity; helps separate dark and clipped
  captures.
- **Contrast** — grayscale standard deviation; low contrast often accompanies
  flat or degraded images.
- **Noise** — standard deviation of the residual after a small Gaussian blur,
  normalized to a 0–1 scale.
- **Saturation** — mean HSV saturation.
- **Edge density** — proportion of pixels detected by Canny edge detection.
- **Texture entropy** — normalized entropy of a 32-bin grayscale histogram.
- **Histogram bins** — eight normalized grayscale distribution features.

The score combines the model's predicted class probability with the measured
quality signals. The label decision is model-backed: clean predictions can be
acceptable, common capture problems are degraded, and corruption or defect
predictions are potentially defective.

## Why Random Forest

Random Forest works well for this small, tabular feature vector because it can
learn nonlinear interactions between sharpness, brightness, contrast, noise,
edges, and histogram shape without requiring a large neural-network dataset.
It is fast to train locally, reproducible with a fixed seed, robust to features
with different scales, and exposes `feature_importances_` for the explanation
shown in the dashboard.

## Dataset and training methodology

The checked-in `samples/` directory contains generated, non-copyrighted sample
images. `ml/generate_dataset.py` creates a clean inspection card plus:

- `blur.png` — Gaussian-blurred clean image
- `underexposure.png` — darkened image
- `overexposure.png` — brightened and clipped image
- `noise.png` — Gaussian pixel noise
- `corruption.png` — low-quality JPEG recompression
- `defect.png` — synthetic occlusion and scratch

The training pipeline starts from those clean images and creates 24 controlled
variants per class using a fixed seed of `42`. It extracts the same 15 features
used at inference, stratifies the train/test split, trains a 120-tree Random
Forest, and saves the model to `models/quality_model.joblib`. If the model is
missing when the API starts, the service trains it automatically from the
available samples.

## Actual evaluation results

These results were produced by running the training pipeline in this project,
not estimated:

| Metric | Result |
| --- | ---: |
| Accuracy | 0.8810 |
| Weighted precision | 0.8829 |
| Weighted recall | 0.8810 |
| Weighted F1 | 0.8765 |
| Training examples | 1,176 |

The full labeled confusion matrix and feature list are stored in
`evaluation/metrics.json` and can be regenerated at any time.

## Training commands

From the repository root:

```bash
python ml/generate_dataset.py
python ml/train.py
python ml/evaluate.py
```

The generated model and evaluation file are reusable by the API. To force a
fresh model, remove `models/quality_model.joblib` and
`evaluation/metrics.json`, then run the commands above.

## API

The service is mounted under `/api` in the workspace preview.

### `GET /api/healthz` or `GET /api/health`

Returns service and model status:

```json
{
  "status": "ok",
  "model_status": "ready",
  "model_version": "rf-quality-v2"
}
```

### `POST /api/analyze`

Send an image as multipart form data under the `file` field:

```bash
curl -X POST http://localhost:80/api/analyze \
  -F "file=@samples/noise.png"
```

Example response shape:

```json
{
  "id": "9c9c2be1-2bd2-4fdd-bf44-cf9e4f5cb564",
  "filename": "noise.png",
  "timestamp": "2026-08-29T12:00:00+00:00",
  "quality_score": 57,
  "quality_label": "DEGRADED",
  "issues": [
    {
      "type": "Image noise",
      "severity": "high",
      "confidence": 0.96,
      "description": "Pixel-level variation is elevated relative to the image structure."
    }
  ],
  "metrics": {
    "sharpness": 171.2,
    "brightness": 121.7,
    "contrast": 71.4,
    "noise": 0.81,
    "saturation": 0.49,
    "edge_density": 0.22,
    "width": 384,
    "height": 256
  },
  "explainability": {
    "top_factors": [],
    "model_version": "rf-quality-v2"
  }
}
```

### `GET /api/history?limit=20`

Returns the most recent persisted analyses. `limit` is constrained to 1–100.

### `GET /api/history/{id}`

Returns one persisted analysis or HTTP 404 with an `error` message.

### `GET /api/summary`

Returns total analyses, counts by quality label, average score, and model
status for the dashboard overview.

## Database

SQLite is stored at `data/analyses.db` by default, configurable with
`SQLITE_PATH`. The `analyses` table stores the id, filename, timestamp, score,
label, JSON-encoded issues and metrics, explainability data, and model version.
Uploaded image bytes are analyzed in memory and are not stored.

## Local setup

The Replit environment provisions the Python runtime and dependencies. For a
regular local Python environment, install the pinned runtime dependencies with:

```bash
python -m pip install -r requirements.txt
```

Then start the service and dashboard in separate terminals:

```bash
pnpm --filter @workspace/api-server run dev
pnpm --filter @workspace/image-quality-inspector run dev
```

In the managed preview, the API and frontend workflows are already configured.
The first API start creates the SQLite database and trains the model only if a
persisted model is not present.

## Docker Compose

Run both services together:

```bash
docker compose up --build
```

The dashboard is available at `http://localhost:4173` and the API at
`http://localhost:5000`. The `inspector-data` volume keeps the SQLite database
between container restarts.

## Model loading and inference

At import time, FastAPI initializes the SQLite schema and loads the persisted
joblib bundle. If no bundle exists, a reproducible training pass runs first.
Each request is decoded with OpenCV, feature values are extracted, and the
Random Forest returns a class and class probabilities. The response combines
those probabilities, a quality score, the issue list, and feature-importance
explanations before writing one history row.

## Limitations and failure cases

- This is an engineered-feature classifier, not a neural network trained on a
  large production image corpus. Results are most trustworthy for capture
  quality issues similar to the generated training examples.
- The synthetic defect class indicates a review signal; it does not locate or
  identify a real-world manufacturing defect.
- Extremely unusual image formats, massive files, unsupported encodings, and
  undecodable corruption are rejected with HTTP 400.
- The current model is not a substitute for domain-specific inspection rules
  or human review of borderline images.

## Tests

Basic API coverage includes health, invalid upload, valid image analysis, and
history:

```bash
pytest artifacts/api-server/tests -q



```
