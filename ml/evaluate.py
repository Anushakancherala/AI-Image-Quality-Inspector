from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
evaluation_path = ROOT / "evaluation" / "metrics.json"
if evaluation_path.exists():
    print(json.dumps(json.loads(evaluation_path.read_text(encoding="utf-8")), indent=2))
else:
    print("No evaluation exists yet. Run python ml/generate_dataset.py && python ml/train.py.")