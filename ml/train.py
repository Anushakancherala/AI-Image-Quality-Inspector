from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "artifacts" / "api-server"))

from app.model import train_model  # noqa: E402


if __name__ == "__main__":
    print(train_model())