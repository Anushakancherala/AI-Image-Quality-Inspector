# AI Image Quality Inspector

An offline, local-first image inspection tool for software internship technical assessments and QA workflows.

Upload an image to receive:

- A 0–100 quality score
- An `ACCEPTABLE`, `DEGRADED`, or `POTENTIALLY_DEFECTIVE` label
- Issue severity and confidence
- Measurable image statistics
- Explainability based on a persisted **Random Forest** model

No external AI or computer vision APIs are used. No API key is required.

## Architecture

```text
                    ┌─────────────────────────┐
                    │     React + Vite        │
                    │      Dashboard          │
                    └────────────┬────────────┘
                                 │
                          Image Upload
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │       FastAPI           │
                    │        Backend          │
                    └────────────┬────────────┘
                                 │
             ┌───────────────────┼───────────────────┐
             │                   │                   │
             ▼                   ▼                   ▼
      ┌─────────────┐     ┌──────────────┐    ┌─────────────┐
      │ OpenCV /    │     │ RandomForest │    │   SQLite    │
      │ NumPy /     │     │   Inference  │    │  Database   │
      │ Pillow      │     └──────────────┘    └─────────────┘
      └─────────────┘
             │
             ▼
      Engineered Features
             │
             ▼
      Quality Score + Label
```

The React + Vite dashboard accepts the image upload. FastAPI handles the request and coordinates computer-vision feature extraction, Random Forest inference, and SQLite history persistence. OpenCV, NumPy, and Pillow generate deterministic image features that are passed to the trained model. The system returns a quality score, quality label, issue information, measurable metrics, and explainability information.

## Project Structure

```text
AI-Image-Quality-Inspector/
│
├── artifacts/
│   ├── api-server/
│   │   ├── app/
│   │   │   └── model.py
│   │   └── tests/
│   │
│   └── image-quality-inspector/
│       ├── src/
│       ├── public/
│       ├── index.html
│       └── vite.config.ts
│
├── evaluation/
│   └── metrics.json
│
├── lib/
│
├── ml/
│   ├── generate_dataset.py
│   ├── train.py
│   └── evaluate.py
│
├── models/
│   └── quality_model.joblib
│
├── samples/
│   ├── blur.png
│   ├── underexposure.png
│   ├── overexposure.png
│   ├── noise.png
│   ├── corruption.png
│   └── defect.png
│
├── scripts/
│
├── main.py
├── run_api.py
├── start_server.py
├── test_api.py
├── test_all_images.py
├── requirements.txt
├── docker-compose.yml
├── Dockerfile
├── package.json
├── pnpm-workspace.yaml
└── README.md
```

- **`artifacts/api-server/`** — the FastAPI backend application, including the model-loading logic (`app/model.py`) and its test suite.
- **`artifacts/image-quality-inspector/`** — the React + Vite frontend dashboard.
- **`evaluation/`** — stores `metrics.json`, the output of the evaluation pipeline.
- **`ml/`** — scripts for generating the training dataset, training the model, and evaluating it.
- **`models/`** — the persisted `quality_model.joblib` Random Forest model.
- **`samples/`** — generated sample images used for local testing and demonstration.
- **`main.py` / `run_api.py` / `start_server.py`** — entry points for running the backend service.
- **`test_api.py` / `test_all_images.py`** — top-level test scripts.
- **`docker-compose.yml` / `Dockerfile`** — containerization configuration.
- **`package.json` / `pnpm-workspace.yaml`** — pnpm workspace configuration for the frontend and backend packages.

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React |
| Build Tool | Vite |
| Language | TypeScript |
| Styling | CSS |
| Backend | Python |
| API Framework | FastAPI |
| Server | Uvicorn |
| Computer Vision | OpenCV |
| Image Processing | Pillow |
| Numerical Computing | NumPy |
| Machine Learning | Scikit-learn |
| ML Model | Random Forest Classifier |
| Model Persistence | Joblib |
| Database | SQLite |
| Package Manager | pnpm |
| Containerization | Docker / Docker Compose |

## Features

- Upload validation for PNG, JPEG, WebP, BMP, and TIFF files
- Decode validation for invalid or corrupt images
- Useful errors for empty, corrupt, unsupported, oversized, or undecodable files
- Detection of blur
- Underexposure detection
- Overexposure detection
- Image noise analysis
- Severe degradation detection
- Unusual visual pattern detection
- Quality score generation
- Quality label classification
- Issue severity and confidence
- Measurable image statistics
- Random Forest explainability
- Feature importance visualization
- SQLite-backed analysis history
- Analysis detail routes
- Dashboard summary statistics
- Reproducible synthetic training data
- Generated sample images
- Health endpoint reporting service and model readiness
- Local-first/offline processing

## How Image Quality Analysis Works

Every uploaded image is decoded into a BGR array and converted into grayscale and HSV representations. From these representations, the model receives a set of deterministic engineered computer-vision features.

### 1. Sharpness

Sharpness is calculated using the variance of the grayscale Laplacian.

A blurry image generally contains fewer high-frequency details, resulting in lower sharpness.

### 2. Brightness

Brightness is calculated from the mean grayscale intensity.

It helps identify:

- Dark images
- Normal exposure
- Very bright images
- Clipped captures

### 3. Contrast

Contrast is calculated using grayscale standard deviation.

Low contrast can indicate:

- Flat images
- Poor lighting
- Degraded captures

### 4. Noise

Noise is estimated from the residual between the original image and a Gaussian-blurred version.

Higher residual variation indicates increased image noise.

### 5. Saturation

Mean HSV saturation is used to understand the overall color intensity of the image.

### 6. Edge Density

Canny edge detection is used to estimate the proportion of pixels containing meaningful edges.

This helps characterize image structure and detail.

### 7. Texture Entropy

A normalized grayscale histogram is used to calculate texture entropy.

This provides information about the distribution and diversity of image intensities.

### 8. Histogram Features

The system also extracts normalized grayscale histogram bins.

These features help the model understand the overall distribution of pixel intensities.

The complete feature vector contains these deterministic engineered image-quality features, and the same feature extraction pipeline is used consistently during training, evaluation, and inference.

## Machine Learning Model

The project uses:

**RandomForestClassifier**

Random Forest was selected because the project uses a relatively small tabular feature vector rather than raw image pixels.

### Why Random Forest?

- Works well with tabular features
- Captures nonlinear relationships
- Requires relatively little preprocessing
- Fast to train locally
- Reproducible
- Robust to different feature scales
- Provides `feature_importances_`
- Suitable for engineered computer-vision features

The model predicts a quality class and class probabilities, which are combined with measured quality signals to produce the final analysis.

## Dataset and Training Methodology

The project uses generated, non-copyrighted sample images.

| Class | Description |
|---|---|
| Clean | Normal high-quality image |
| Blur | Gaussian-blurred image |
| Underexposure | Darkened image |
| Overexposure | Brightened/clipped image |
| Noise | Image with Gaussian pixel noise |
| Corruption | Low-quality JPEG recompression |
| Defect | Synthetic occlusion and scratch |

Additional details:

- Fixed random seed: **42**
- Controlled image variants are generated for training
- The same feature extraction pipeline is used during training, evaluation, and inference
- Train/test splitting is stratified
- **120** Random Forest trees
- The trained model is persisted to `models/quality_model.joblib`
- If the model is missing when the API starts, the service can perform a reproducible training pass using the available samples

## Evaluation Results

The following are actual results produced by running the project's evaluation pipeline, not estimated figures.

| Metric | Result |
|---|---|
| Accuracy | 0.8810 |
| Weighted Precision | 0.8829 |
| Weighted Recall | 0.8810 |
| Weighted F1 | 0.8765 |
| Training Examples | 1,176 |

The complete evaluation information, including the labeled confusion matrix and feature information, is stored in:

```text
evaluation/metrics.json
```

## Quality Classification

The system assigns one of three primary quality labels.

### ACCEPTABLE

The image meets expected quality requirements.

Typical characteristics:

- Good sharpness
- Reasonable brightness
- Good contrast
- Low noise
- Normal image structure

### DEGRADED

The image contains noticeable quality problems.

Examples:

- Blur
- Excessive noise
- Poor exposure
- Reduced contrast

### POTENTIALLY_DEFECTIVE

The image contains stronger signals that may require review.

This can include:

- Severe degradation
- Synthetic defects
- Corruption
- Unusual visual patterns

**Important note:** The defect classification is a review signal and does not prove the presence of a real-world manufacturing defect.

## Explainability

The application provides model explainability using Random Forest feature importance. The dashboard can show important features used by the model and measured values for the analyzed image.

Relevant features include:

- Sharpness
- Brightness
- Contrast
- Noise
- Saturation
- Edge density
- Texture entropy
- Histogram features

This makes the prediction easier to interpret instead of returning only a label.

## API

The backend is implemented using **FastAPI** and is mounted under:

```text
/api
```

### Health Check

```text
GET /api/healthz
GET /api/health
```

Example response:

```json
{
  "status": "ok",
  "model_status": "ready",
  "model_version": "rf-quality-v2"
}
```

### Analyze Image

```text
POST /api/analyze
```

The image is sent using multipart form data with the field:

```text
file
```

Example request:

```bash
curl -X POST http://localhost:80/api/analyze \
  -F "file=@samples/noise.png"
```

### Example Response

```json
{
  "id": "9c9c2be1-2bd4-4fdd-bf44-cf9e4f5cb564",
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

### Analysis History

```text
GET /api/history?limit=20
```

Returns the most recent persisted analyses. The `limit` is restricted to 1–100.

### Analysis Details

```text
GET /api/history/{id}
```

Returns a specific persisted analysis. Returns HTTP 404 if the analysis does not exist.

### Dashboard Summary

```text
GET /api/summary
```

Returns:

- Total analyses
- Counts by quality label
- Average quality score
- Model status

## Database

The application uses **SQLite** for analysis history.

Default database:

```text
data/analyses.db
```

Configuration:

```text
SQLITE_PATH
```

The database stores:

- Analysis ID
- Filename
- Timestamp
- Quality score
- Quality label
- Issues
- Image metrics
- Explainability information
- Model version

**Uploaded image bytes are analyzed in memory and are NOT permanently stored by the analysis pipeline.**

## Training

Training scripts are located in:

```text
ml/
```

### Generate Dataset

```bash
python ml/generate_dataset.py
```

### Train Model

```bash
python ml/train.py
```

### Evaluate Model

```bash
python ml/evaluate.py
```

Model output:

```text
models/quality_model.joblib
```

Evaluation output:

```text
evaluation/metrics.json
```

### Force Model Retraining

To create a fresh model, remove:

```text
models/quality_model.joblib
evaluation/metrics.json
```

Then run:

```bash
python ml/generate_dataset.py
python ml/train.py
python ml/evaluate.py
```

## Local Setup

### Python Environment

```bash
python -m pip install -r requirements.txt
```

### Start Backend

```bash
pnpm --filter @workspace/api-server run dev
```

### Start Frontend

```bash
pnpm --filter @workspace/image-quality-inspector run dev
```

The frontend is powered by **React + Vite**.

The managed Replit environment provisions the runtime and dependencies, and the API/frontend workflows are configured there.

## Docker Compose

```bash
docker compose up --build
```

| Service | URL |
|---|---|
| Frontend | http://localhost:4173 |
| Backend | http://localhost:5000 |

Docker Compose uses persistent storage for SQLite data.

## Model Loading and Inference

1. SQLite schema is initialized.
2. The persisted Random Forest model is loaded.
3. If the model does not exist, the training pipeline can create it.
4. Uploaded images are decoded using OpenCV.
5. Computer-vision features are extracted.
6. The Random Forest predicts the image quality class.
7. Class probabilities are calculated.
8. A quality score is generated.
9. Potential issues are detected.
10. Explainability information is generated.
11. The analysis is stored in SQLite.

## Error Handling

The application validates uploaded files before analysis.

It can reject:

- Empty files
- Corrupt images
- Unsupported formats
- Oversized uploads
- Invalid image data
- Undecodable images

Supported formats:

- PNG
- JPEG
- WebP
- BMP
- TIFF

Invalid uploads return useful API error messages instead of crashing the service.

## Tests

The project includes API tests covering:

- Health endpoint
- Invalid image upload
- Valid image analysis
- History endpoint

Run:

```bash
pytest artifacts/api-server/tests -q
```

## Limitations

- This project uses engineered computer-vision features and a Random Forest classifier rather than a large neural network trained on a production-scale image dataset.
- Results are most reliable for quality problems similar to the generated training examples.
- Synthetic defect detection is a review signal.
- The system does not identify real-world manufacturing defects.
- Extremely unusual image formats may be rejected.
- Very large files may be rejected.
- Borderline predictions may require human review.
- The system should not be considered a replacement for domain-specific inspection systems.

## Privacy

- The application is designed to work locally.
- No external AI or computer-vision API is required.
- Uploaded images are processed in memory.
- Uploaded images are not permanently stored by the analysis pipeline.
- Analysis metadata is stored locally in SQLite.

## Project Highlights

### Computer Vision

- OpenCV
- Pillow
- NumPy
- Image statistics
- Blur detection
- Noise analysis
- Exposure analysis
- Edge detection
- Histogram analysis
- Texture entropy

### Machine Learning

- Scikit-learn
- Random Forest
- Feature importance
- Model persistence with Joblib
- Reproducible training
- Evaluation metrics

### Backend

- FastAPI
- REST API
- Uvicorn
- SQLite
- Input validation
- Health monitoring

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- Image upload interface
- Quality dashboard
- Analysis history
- Explainability interface

### Deployment

- Docker
- Docker Compose
- pnpm workspace

## Repository

**GitHub Repository:** AI Image Quality Inspector

https://github.com/Anushakancherala/AI-Image-Quality-Inspector

## Conclusion

**AI Image Quality Inspector** combines Computer Vision, Machine Learning, FastAPI, React, SQLite, and Docker to provide an offline image-quality inspection workflow.

The system extracts measurable visual features, applies a persisted Random Forest model, generates a quality score and classification, identifies potential image-quality issues, provides model explainability, and stores analysis history locally.

It demonstrates practical integration of:

**Computer Vision + Machine Learning + FastAPI + React + SQLite + Docker**
