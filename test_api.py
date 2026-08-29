import sys
import os
from pathlib import Path

# Add app directory to path
app_dir = Path(__file__).parent / "artifacts" / "api-server" / "app"
sys.path.insert(0, str(app_dir))

from main import app
from fastapi.testclient import TestClient

client = TestClient(app)

# Test with a clean image
clean_path = Path(__file__).parent / "samples" / "clean.png"
with open(clean_path, 'rb') as f:
    response = client.post('/api/analyze', files={'file': ('clean.png', f, 'image/png')})
    
print('Status:', response.status_code)
result = response.json()
print('ID:', result.get('id'))
print('Filename:', result.get('filename'))
print('Quality Score:', result.get('quality_score'))
print('Quality Label:', result.get('quality_label'))
metrics = result.get('metrics', {})
print('Dimensions:', str(metrics.get('width')) + ' x ' + str(metrics.get('height')))
print('Issues:', len(result.get('issues', [])))
print('Metrics:', metrics)
