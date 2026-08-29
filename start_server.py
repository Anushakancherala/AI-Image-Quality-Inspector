#!/usr/bin/env python
"""Run the FastAPI app with proper path setup."""
import sys
import os
from pathlib import Path

# Add the app directory to Python path FIRST, so it takes precedence
app_dir = Path(__file__).parent / "artifacts" / "api-server" / "app"
sys.path.insert(0, str(app_dir))

# Also add the project root for access to models, samples, etc.
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

# Import the app from the app module, not the root main.py
import importlib.util
spec = importlib.util.spec_from_file_location("app_main", app_dir / "main.py")
app_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(app_module)
app = app_module.app

async def run():
    import uvicorn
    config = uvicorn.Config(app, host="127.0.0.1", port=5000, log_level="info")
    server = uvicorn.Server(config)
    print("Server starting on http://127.0.0.1:5000")
    await server.serve()

if __name__ == "__main__":
    import asyncio
    try:
        asyncio.run(run())
    except KeyboardInterrupt:
        print("\nServer stopped")
