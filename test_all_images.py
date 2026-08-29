import sys
import os
from pathlib import Path
import json

# Add app directory to path
app_dir = Path(__file__).parent / "artifacts" / "api-server" / "app"
sys.path.insert(0, str(app_dir))

from main import app
from fastapi.testclient import TestClient

client = TestClient(app)

# Test images
test_images = [
    ("clean.png", "CLEAN / SHARP IMAGE"),
    ("blur.png", "BLURRY IMAGE"),
    ("underexposure.png", "UNDEREXPOSED IMAGE"),
    ("overexposure.png", "OVEREXPOSED IMAGE"),
    ("noise.png", "NOISY IMAGE"),
    ("corruption.png", "SEVERELY DEGRADED / CORRUPTED IMAGE"),
]

print("=" * 80)
print("TESTING 6 IMAGE CONDITIONS")
print("=" * 80)

for filename, description in test_images:
    image_path = Path(__file__).parent / "samples" / filename
    
    if not image_path.exists():
        print(f"\n[SKIP] {description}: {filename} not found")
        continue
        
    with open(image_path, 'rb') as f:
        response = client.post('/api/analyze', files={'file': (filename, f, 'image/png')})
    
    if response.status_code != 200:
        print(f"\n[ERROR] {description}: Status {response.status_code}")
        continue
    
    result = response.json()
    metrics = result.get('metrics', {})
    
    print(f"\n{description}")
    print(f"  File: {filename}")
    print(f"  Dimensions: {metrics.get('width')} × {metrics.get('height')} px")
    print(f"  Quality Score: {result.get('quality_score')}/100")
    print(f"  Quality Label: {result.get('quality_label')}")
    print(f"  Issues Detected: {len(result.get('issues', []))}")
    
    # Print detected issues
    for issue in result.get('issues', []):
        print(f"    - {issue['type']}: {issue['severity'].upper()} (confidence: {issue['confidence']})")
    
    # Print key metrics
    print(f"  Key Metrics:")
    print(f"    - Sharpness: {metrics.get('sharpness')}")
    print(f"    - Brightness: {metrics.get('brightness')}")
    print(f"    - Contrast: {metrics.get('contrast')}")
    print(f"    - Noise: {metrics.get('noise')}")

print("\n" + "=" * 80)
