from __future__ import annotations

import sys
from pathlib import Path

import cv2

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "artifacts" / "api-server"))

from app.model import _base_image, _variants  # noqa: E402


def main() -> None:
    sample_dir = ROOT / "samples"
    sample_dir.mkdir(parents=True, exist_ok=True)
    base = _base_image()
    cv2.imwrite(str(sample_dir / "clean.png"), base)
    variants = _variants(base, 42)
    for label, image in variants.items():
        cv2.imwrite(str(sample_dir / f"{label}.png"), image)
    print(f"Generated {len(variants)} reproducible sample images in {sample_dir}.")


if __name__ == "__main__":
    main()