# AI Image Quality Inspector

An offline, local-first image inspection tool designed for software internship
technical assessments and QA workflows.

The application allows users to upload an image and receive:

- A quality score from 0–100
- An `ACCEPTABLE`, `DEGRADED`, or `POTENTIALLY_DEFECTIVE` label
- Detected image-quality issues
- Issue severity and model confidence
- Measurable image statistics
- Random Forest feature-based explanations
- Persistent analysis history

No external AI or computer-vision APIs are required, and no API key is needed.

## Architecture

```text
React + Vite Dashboard
        │
        │ Multipart Upload / JSON Requests
        ▼
FastAPI Service
        │
        ├── OpenCV / NumPy Feature Extraction
        ├── Scikit-learn Random Forest Inference
        └── SQLite Analysis History
                │
                ├── models/quality_model.joblib
                ├── evaluation/metrics.json
                └── samples/*.png

The frontend is the main web artifact.

The backend exposes the FastAPI service under the /api path so that the same
API routing can be used in local preview and Docker Compose environments.

Features
Upload validation for PNG, JPEG, WebP, BMP, and TIFF images
Validation for empty, corrupt, unsupported, and oversized files
Image decoding validation
Blur detection
Underexposure detection
Overexposure detection
Image-noise detection
Severe degradation detection
Unusual visual-pattern detection
Quality score from 0–100
Quality classification
Issue severity and confidence
Random Forest explainability
Feature importance visualization
Measurable image statistics
SQLite-backed analysis history
Analysis detail routes
Dashboard summary statistics
Health and model-readiness endpoint
Reproducible synthetic training data
Generated sample images
Persisted machine-learning model
Docker Compose support
Technology Stack
Frontend
React
Vite
TypeScript
Tailwind CSS
Backend
Python
FastAPI
Uvicorn
Computer Vision
OpenCV
Pillow
NumPy
Machine Learning
scikit-learn
RandomForestClassifier
joblib
Database
SQLite
Development and Packaging
pnpm workspace
Docker
Docker Compose
How the Computer-Vision Features Work

Each uploaded image is decoded into a BGR image and converted into grayscale
and HSV representations.

The machine-learning model uses deterministic engineered features extracted
from the image.

1. Sharpness

Sharpness is measured using the variance of the grayscale Laplacian.

Higher-frequency image details generally decrease when an image is blurred.

2. Brightness

Brightness is calculated from the mean grayscale intensity.

This helps identify very dark or excessively bright images.

3. Contrast

Contrast is represented by the standard deviation of grayscale intensity.

Low contrast can indicate flat or degraded images.

4. Noise

Noise is estimated from the residual after applying a small Gaussian blur.

The resulting value is normalized to a 0–1 scale.

5. Saturation

Mean HSV saturation is used as an additional image-quality feature.

6. Edge Density

Canny edge detection is used to calculate the proportion of pixels that belong
to detected edges.

7. Texture Entropy

A normalized entropy value is calculated from a 32-bin grayscale histogram.

8. Histogram Features

Eight normalized grayscale histogram features are included in the feature
vector.

Together, these features provide a compact representation of image quality
without requiring a large neural-network model.

Why Random Forest?

Random Forest is well suited for this project because the model operates on a
small tabular feature vector rather than raw image tensors.

It can learn nonlinear relationships between:

Sharpness
Brightness
Contrast
Noise
Saturation
Edge density
Texture
Histogram distribution

Additional advantages include:

Fast local training
Low inference overhead
Reproducible training
Robustness to differently scaled features
Good performance on small structured datasets
Built-in feature_importances_ support for explainability

This makes Random Forest a practical choice for an offline image-quality
inspection system.

Dataset and Training Methodology

The project includes generated, non-copyrighted sample images in the
samples/ directory.

The dataset-generation pipeline creates a clean inspection image along with
controlled quality-degradation variants.

Generated Samples
blur.png — Gaussian-blurred image
underexposure.png — darkened image
overexposure.png — brightened and clipped image
noise.png — Gaussian pixel noise
corruption.png — low-quality JPEG recompression
defect.png — synthetic occlusion and scratch

The training pipeline creates controlled variants using a fixed random seed of
42.

The same feature-extraction logic is used during training and inference.

The training pipeline:

Generates the dataset
Extracts image features
Creates labeled examples
Performs a stratified train/test split
Trains a 120-tree Random Forest
Evaluates the model
Saves the trained model to:
models/quality_model.joblib

If the persisted model is missing when the API starts, the service can train
the model from the available samples.

Evaluation Results

The following results were produced by running the project's training and
evaluation pipeline.

Metric	Result
Accuracy	0.8810
Weighted Precision	0.8829
Weighted Recall	0.8810
Weighted F1	0.8765
Training Examples	1,176

The complete evaluation information, including the confusion matrix and feature
information, is stored in:

evaluation/metrics.json
Training Commands

Run the following commands from the repository root:

python ml/generate_dataset.py
python ml/train.py
python ml/evaluate.py

The generated model is saved as:

models/quality_model.joblib

The evaluation results are saved as:

evaluation/metrics.json

To force a fresh model and evaluation, remove the existing model and metrics
files and run the training commands again.

API

The FastAPI service is mounted under the /api path.

Health Check
GET /api/healthz

or

GET /api/health

Returns the service and machine-learning model status.

Example:

{
  "status": "ok",
  "model_status": "ready",
  "model_version": "rf-quality-v2"
}
Analyze Image
POST /api/analyze

Uploads an image for quality analysis.

The image must be sent as multipart form data using the file field.

Example:

curl -X POST http://localhost:80/api/analyze \
  -F "file=@samples/noise.png"

Example response:

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
Analysis History
GET /api/history?limit=20

Returns the most recent image analyses.

The limit parameter is constrained to values between 1 and 100.

Analysis Details
GET /api/history/{id}

Returns a specific persisted analysis.

If the analysis does not exist, the service returns HTTP 404 with an error
message.

Dashboard Summary
GET /api/summary

Returns dashboard-level statistics including:

Total analyses
Counts by quality label
Average quality score
Model status
Database

SQLite is used to persist analysis history.

The default database location is:

data/analyses.db

The database path can be changed using the SQLITE_PATH environment variable.

The analyses table stores:

Analysis ID
Filename
Timestamp
Quality score
Quality label
Detected issues
Image metrics
Explainability information
Model version

Uploaded image bytes are processed in memory and are not stored in the
database.

Local Setup

The Replit environment provides the required Python runtime and dependencies.

For a regular local Python environment, install the Python dependencies with:

python -m pip install -r requirements.txt

The project contains separate frontend and backend services.

Start the API
pnpm --filter @workspace/api-server run dev
Start the Frontend

In another terminal:

pnpm --filter @workspace/image-quality-inspector run dev

The exact local development setup may depend on the operating system and
workspace environment.

The managed Replit preview has the frontend and API workflows configured.

Docker Compose

The complete application can also be run using Docker Compose.

docker compose up --build

The Docker Compose configuration runs the frontend and backend together.

The dashboard is available at:

http://localhost:4173

The API is available at:

http://localhost:5000

The inspector-data volume keeps SQLite data between container restarts.

Model Loading and Inference

When the FastAPI application starts:

The SQLite database schema is initialized.
The persisted Random Forest model is loaded.
If the model is missing, the training pipeline can generate it.
Uploaded images are decoded using OpenCV.
The deterministic CV features are extracted.
The Random Forest generates a prediction and class probabilities.
Quality signals and model probabilities are combined into the final quality
score.
The system determines the quality label.
Detected issues and confidence values are generated.
Feature importance information is used for explainability.
The analysis is persisted in SQLite.
Quality Labels

The system returns one of three primary quality labels.

ACCEPTABLE

The image satisfies the expected quality conditions.

DEGRADED

The image contains common quality problems such as blur, noise,
underexposure, overexposure, or reduced image quality.

POTENTIALLY_DEFECTIVE

The image contains stronger degradation or patterns that require additional
review.

The labels are model-backed and should be interpreted as inspection signals
rather than absolute ground truth.

Limitations

This project has several important limitations.

The classifier uses engineered computer-vision features rather than a large
production-scale image dataset.
The model is trained using controlled synthetic examples.
Results are most reliable for image-quality problems similar to the training
examples.
The synthetic defect class represents a review signal and does not identify
or localize real-world manufacturing defects.
Extremely unusual image formats, unsupported encodings, massive files, and
corrupted images may be rejected.
Borderline predictions may require human review.
The model should not be considered a replacement for domain-specific
inspection systems or human quality assurance.
Tests

The project includes API tests covering:

Health endpoint
Invalid uploads
Valid image analysis
Analysis history

Run the tests with:

pytest artifacts/api-server/tests -q
Project Structure
AI-Image-Quality-Inspector/
│
├── artifacts/
│   ├── api-server/
│   │   ├── app/
│   │   └── tests/
│   │
│   └── image-quality-inspector/
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
│
├── docker-compose.yml
├── Dockerfile
├── requirements.txt
├── package.json
├── pnpm-workspace.yaml
└── README.md
Project Highlights
Offline-first architecture
No external AI API dependency
Deterministic computer-vision feature extraction
Machine-learning-based image classification
Persisted Random Forest model
Explainable predictions
REST API using FastAPI
React-based dashboard
SQLite analysis history
Automated validation and testing
Docker Compose support
Reproducible model training and evaluation
Conclusion

AI Image Quality Inspector combines classical computer vision, machine
learning, and a full-stack web interface to provide an offline image-quality
inspection workflow.

The system demonstrates an end-to-end pipeline covering image upload,
validation, feature extraction, machine-learning inference, explainability,
persistence, API integration, dashboard visualization, testing, and
containerized deployment.
