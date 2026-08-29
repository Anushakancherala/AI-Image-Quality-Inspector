from __future__ import annotations

from typing import Final

import cv2
import numpy as np

FEATURE_NAMES: Final[tuple[str, ...]] = (
    "sharpness",
    "brightness",
    "contrast",
    "noise",
    "saturation",
    "edge_density",
    "texture_entropy",
    "hist_0",
    "hist_1",
    "hist_2",
    "hist_3",
       "hist_4",
    "hist_5",
    "hist_6",
    "hist_7",
)


def _entropy(gray: np.ndarray) -> float:
    histogram = cv2.calcHist([gray], [0], None, [32], [0, 256]).ravel()
    probabilities = histogram / max(float(histogram.sum()), 1.0)
    probabilities = probabilities[probabilities > 0]
    return float(-(probabilities * np.log2(probabilities)).sum() / 5.0)


def extract_features(image: np.ndarray) -> dict[str, float]:
    """Extract deterministic, interpretable quality features from a BGR image."""
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)

    blurred = cv2.GaussianBlur(gray, (3, 3), 0)
    residual = gray.astype(np.float32) - blurred.astype(np.float32)
    edges = cv2.Canny(gray, 100, 200)
    histogram = cv2.calcHist([gray], [0], None, [8], [0, 256]).ravel()
    histogram = histogram / max(float(histogram.sum()), 1.0)

    values: dict[str, float] = {
        "sharpness": float(cv2.Laplacian(gray, cv2.CV_64F).var()),
        "brightness": float(gray.mean()),
        "contrast": float(gray.std()),
        "noise": float(np.clip(residual.std() / 32.0, 0.0, 1.0)),
        "saturation": float(hsv[:, :, 1].mean() / 255.0),
        "edge_density": float(edges.mean() / 255.0),
        "texture_entropy": _entropy(gray),
    }
    values.update({f"hist_{index}": float(value) for index, value in enumerate(histogram)})
    return values


def vectorize(features: dict[str, float]) -> list[float]:
    return [features[name] for name in FEATURE_NAMES]