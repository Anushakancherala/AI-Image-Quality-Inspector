#!/usr/bin/env python
import sys
import os

# Set up path for imports
project_root = os.path.dirname(os.path.abspath(__file__))
app_dir = os.path.join(project_root, "artifacts", "api-server", "app")

# Add app directory to path so it's treated as a package root
sys.path.insert(0, app_dir)

# Now we can import and run
if __name__ == "__main__":
    import uvicorn
    
    # Run uvicorn from the app directory
    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=5000,
        reload=False,
        log_level="info"
    )

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=5000)
