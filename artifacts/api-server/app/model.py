from __future__ import annotations

import io
import json
from pathlib import Path
from typing import Any

import cv2
import joblib
import numpy as np
from PIL import Image, ImageDraw
from sklearn.ensemble import RandomForestClassifier

try:
    from .features import FEATURE_NAMES, extract_features, vectorize
except ImportError:
    from features import FEATURE_NAMES, extract_features, vectorize

MODEL_VERSION = "rf-quality-v2"  # Updated model with more training data and improved feature extraction
ROOT = Path(__file__).resolve().parents[3]
MODEL_PATH = ROOT / "models" / "quality_model.joblib"
EVALUATION_PATH = ROOT / "evaluation" / "metrics.json"
CLASSES = ("clean", "blur", "underexposure", "overexposure", "noise", "corruption", "defect")

ISSUE_COPY = {
    "blur": ("Blur / insufficient sharpness", "The image has soft edges and reduced high-frequency detail."),
    "underexposure": ("Underexposure", "Dark tonal values may hide important visual detail."),
    "overexposure": ("Overexposure", "Bright tonal values are close to clipping and may lose detail."),
    "noise": ("Image noise", "Pixel-level variation is elevated relative to the image structure."),
    "corruption": ("Severe degradation", "Compression or structural artifacts may compromise inspection reliability."),
    "defect": ("Potential visual defect", "The model detected an unusual visual pattern worth reviewing."),
}


def _base_image(seed: int = 42) -> np.ndarray:
    rng = np.random.default_rng(seed)
    canvas = np.zeros((256, 384, 3), dtype=np.uint8)
    for x in range(canvas.shape[1]):
        canvas[:, x, 0] = np.clip(26 + x * 0.2, 0, 255)
        canvas[:, x, 1] = np.clip(64 + x * 0.25, 0, 255)
        canvas[:, x, 2] = np.clip(116 + x * 0.28, 0, 255)
    cv2.rectangle(canvas, (45, 58), (178, 204), (232, 176, 62), -1)
    cv2.circle(canvas, (284, 122), 60, (48, 188, 174), -1)
    cv2.line(canvas, (20, 226), (350, 28), (240, 240, 238), 4)
    cv2.putText(canvas, "QUALITY", (98, 242), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (248, 248, 248), 2)
    canvas = cv2.detailEnhance(canvas, sigma_s=10, sigma_r=0.15)
    return np.clip(canvas + rng.normal(0, 1.2, canvas.shape), 0, 255).astype(np.uint8)


def _variants(image: np.ndarray, seed: int) -> dict[str, np.ndarray]:
    rng = np.random.default_rng(seed)
    dark = np.clip(image.astype(np.float32) * 0.38, 0, 255).astype(np.uint8)
    bright = np.clip(image.astype(np.float32) * 1.65 + 30, 0, 255).astype(np.uint8)
    noisy = np.clip(image.astype(np.float32) + rng.normal(0, 30, image.shape), 0, 255).astype(np.uint8)
    compressed = cv2.imencode(".jpg", image, [cv2.IMWRITE_JPEG_QUALITY, 8])[1]
    degraded = cv2.imdecode(compressed, cv2.IMREAD_COLOR)
    if degraded is None:
        degraded = image.copy()
    defect = image.copy()
    cv2.rectangle(defect, (232, 76), (318, 108), (12, 16, 22), -1)
    cv2.line(defect, (226, 68), (325, 116), (250, 246, 238), 5)
    return {
        "clean": image,
        "blur": cv2.GaussianBlur(image, (25, 25), 0),
        "underexposure": dark,
        "overexposure": bright,
        "noise": noisy,
        "corruption": degraded,
        "defect": defect,
    }


def _load_sample_images() -> list[np.ndarray]:
    sample_dir = ROOT / "samples"
    images: list[np.ndarray] = []
    for path in sorted(sample_dir.glob("clean*.png")):
        decoded = cv2.imread(str(path), cv2.IMREAD_COLOR)
        if decoded is not None:
            images.append(decoded)
    return images or [_base_image()]


def train_model() -> dict[str, Any]:
    from sklearn.metrics import accuracy_score, confusion_matrix, f1_score, precision_score, recall_score
    from sklearn.model_selection import train_test_split

    feature_rows: list[list[float]] = []
    labels: list[str] = []
    for image_index, image in enumerate(_load_sample_images()):
        for variant_index in range(24):
            for label, variant in _variants(image, image_index * 1000 + variant_index).items():
                feature_rows.append(vectorize(extract_features(variant)))
                labels.append(label)

    x = np.asarray(feature_rows, dtype=np.float64)
    y = np.asarray(labels)
    x_train, x_test, y_train, y_test = train_test_split(
        x, y, test_size=0.25, random_state=42, stratify=y
    )
    classifier = RandomForestClassifier(
        n_estimators=120, max_depth=12, random_state=42, class_weight="balanced", n_jobs=-1
    )
    classifier.fit(x_train, y_train)
    predictions = classifier.predict(x_test)
    metrics = {
        "accuracy": round(float(accuracy_score(y_test, predictions)), 4),
        "precision_weighted": round(float(precision_score(y_test, predictions, average="weighted", zero_division=0)), 4),
        "recall_weighted": round(float(recall_score(y_test, predictions, average="weighted", zero_division=0)), 4),
        "f1_weighted": round(float(f1_score(y_test, predictions, average="weighted", zero_division=0)), 4),
        "labels": list(classifier.classes_),
        "confusion_matrix": confusion_matrix(y_test, predictions, labels=classifier.classes_).tolist(),
        "sample_count": int(len(y)),
        "feature_names": list(FEATURE_NAMES),
    }
    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    EVALUATION_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump({"model": classifier, "version": MODEL_VERSION, "features": FEATURE_NAMES}, MODEL_PATH)
    EVALUATION_PATH.write_text(json.dumps(metrics, indent=2), encoding="utf-8")
    return metrics


def ensure_model() -> dict[str, Any]:
    if not MODEL_PATH.exists():
        return train_model()
    return json.loads(EVALUATION_PATH.read_text(encoding="utf-8")) if EVALUATION_PATH.exists() else {}


def load_bundle() -> dict[str, Any]:
    ensure_model()
    return joblib.load(MODEL_PATH)


def analyse(image: np.ndarray, bundle: dict[str, Any]) -> dict[str, Any]:
    features = extract_features(image)
    vector = np.asarray([vectorize(features)])
    model: RandomForestClassifier = bundle["model"]
    probabilities = model.predict_proba(vector)[0]
    probability_map = {str(label): float(probability) for label, probability in zip(model.classes_, probabilities)}
    predicted = str(model.predict(vector)[0])

    sharpness_quality = min(features["sharpness"] / 700.0, 1.0)
    brightness_quality = max(0.0, 1.0 - abs(features["brightness"] - 128.0) / 128.0)
    contrast_quality = min(features["contrast"] / 65.0, 1.0)
    noise_quality = max(0.0, 1.0 - features["noise"])
    metric_score = 100.0 * (
        0.30 * sharpness_quality
        + 0.25 * brightness_quality
        + 0.20 * contrast_quality
        + 0.20 * noise_quality
        + 0.05 * min(features["edge_density"] / 0.22, 1.0)
    )
    class_penalty = {
        "clean": 0,
        "blur": 12,
        "underexposure": 16,
        "overexposure": 16,
        "noise": 14,
        "corruption": 28,
        "defect": 24,
    }.get(predicted, 20)
    quality_score = int(np.clip(round(metric_score - class_penalty * max(probability_map.get(predicted, 0.5), 0.45)), 0, 100))
    if predicted in {"corruption", "defect"} or quality_score < 45:
        quality_label = "POTENTIALLY_DEFECTIVE"
    elif predicted == "clean" and quality_score >= 72:
        quality_label = "ACCEPTABLE"
    else:
        quality_label = "DEGRADED"

    issues: list[dict[str, Any]] = []
    candidate_labels = [label for label in CLASSES if label != "clean" and probability_map.get(label, 0) >= 0.14]
    if predicted != "clean" and predicted not in candidate_labels:
        candidate_labels.insert(0, predicted)
    for label in sorted(candidate_labels, key=lambda item: probability_map.get(item, 0), reverse=True)[:4]:
        confidence = float(np.clip(probability_map.get(label, 0.0), 0.0, 1.0))
        if confidence < 0.18 and label != predicted:
            continue
        if label in {"corruption", "defect"}:
            severity = "critical" if confidence >= 0.78 else "high"
        elif confidence >= 0.78:
            severity = "high"
        elif confidence >= 0.48:
            severity = "medium"
        else:
            severity = "low"
        title, description = ISSUE_COPY[label]
        issues.append({"type": title, "severity": severity, "confidence": round(confidence, 2), "description": description})

    metric_output = {
        "sharpness": round(features["sharpness"], 2),
        "brightness": round(features["brightness"], 2),
        "contrast": round(features["contrast"], 2),
        "noise": round(features["noise"], 3),
        "saturation": round(features["saturation"], 3),
        "edge_density": round(features["edge_density"], 3),
        "width": int(image.shape[1]),
        "height": int(image.shape[0]),
    }
    importance = dict(zip(FEATURE_NAMES, model.feature_importances_))
    top_factors = []
    for name in sorted(FEATURE_NAMES, key=lambda item: importance[item], reverse=True)[:5]:
        value = float(features[name])
        readable = {
            "sharpness": "Sharpness",
            "brightness": "Brightness",
            "contrast": "Contrast",
            "noise": "Noise",
            "saturation": "Saturation",
            "edge_density": "Edge density",
            "texture_entropy": "Texture entropy",
        }.get(name, name.replace("_", " ").title())
        interpretation = "supports a reliable capture" if name in {"sharpness", "contrast", "edge_density"} and value > 0.2 else "influenced the quality decision"
        top_factors.append({
            "feature": readable,
            "importance": round(float(importance[name]), 3),
            "value": round(value, 3),
            "interpretation": interpretation,
        })
    return {
        "quality_score": quality_score,
        "quality_label": quality_label,
        "issues": issues,
        "metrics": metric_output,
        "explainability": {"top_factors": top_factors, "model_version": bundle.get("version", MODEL_VERSION)},
    }