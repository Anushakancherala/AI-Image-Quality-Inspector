# AI Image Quality Inspector

An offline dashboard that scores uploaded images, detects common quality defects, and explains the result with a local Random Forest model.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the FastAPI analysis service
- `pnpm --filter @workspace/image-quality-inspector run dev` — run the React dashboard
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `python ml/generate_dataset.py && python ml/train.py` — regenerate samples and train the local model
- `pytest artifacts/api-server/tests -q` — run backend API tests
- Required env: `SQLITE_PATH` is optional and defaults to `data/analyses.db`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: FastAPI + Uvicorn
- CV/ML: OpenCV, Pillow, NumPy, scikit-learn, joblib
- DB: SQLite
- API contract: OpenAPI + Orval-generated React Query hooks
- Frontend: React + Vite + Tailwind CSS

## Where things live

- `artifacts/api-server/app/` — FastAPI routes, feature extraction, Random Forest loading, and SQLite persistence
- `artifacts/image-quality-inspector/src/` — dashboard UI
- `lib/api-spec/openapi.yaml` — source-of-truth API contract
- `ml/` — reproducible sample generation, training, and evaluation commands
- `samples/`, `models/`, `evaluation/` — generated inspection fixtures, persisted model, and real metrics

## Architecture decisions

- The analyzer is intentionally offline and stores image bytes only in memory; SQLite stores the structured result.
- The API service keeps the requested FastAPI/SQLite stack while remaining reachable through the workspace's shared `/api` route.
- A missing model is a recoverable first-run state: startup trains from deterministic generated samples instead of silently returning fake results.

## Product

Users upload an image, review a quality score and label, inspect detected issues and evidence, and revisit persisted analyses from history.

## User preferences

The project must not depend on external AI or vision APIs and must not require API keys.

## Gotchas

- Run `python ml/generate_dataset.py` before `python ml/train.py` when rebuilding sample fixtures from scratch.
- The API workflow runs the Python FastAPI service; the legacy TypeScript scaffold is retained only for workspace compatibility.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
