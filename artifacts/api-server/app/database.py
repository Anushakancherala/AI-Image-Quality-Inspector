from __future__ import annotations

import json
import os
import sqlite3
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[3]
DB_PATH = Path(os.getenv("SQLITE_PATH", str(ROOT / "data" / "analyses.db")))


def connect() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def initialize() -> None:
    with connect() as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS analyses (
              id TEXT PRIMARY KEY,
              filename TEXT NOT NULL,
              timestamp TEXT NOT NULL,
              quality_score INTEGER NOT NULL,
              quality_label TEXT NOT NULL,
              issues TEXT NOT NULL,
              metrics TEXT NOT NULL,
              explainability TEXT NOT NULL,
              model_version TEXT NOT NULL
            )
            """
        )


def insert_analysis(analysis: dict[str, Any]) -> None:
    with connect() as connection:
        connection.execute(
            """
            INSERT INTO analyses
              (id, filename, timestamp, quality_score, quality_label, issues, metrics, explainability, model_version)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                analysis["id"],
                analysis["filename"],
                analysis["timestamp"],
                analysis["quality_score"],
                analysis["quality_label"],
                json.dumps(analysis["issues"]),
                json.dumps(analysis["metrics"]),
                json.dumps(analysis["explainability"]),
                analysis["explainability"]["model_version"],
            ),
        )


def _decode(row: sqlite3.Row) -> dict[str, Any]:
    result = dict(row)
    result["issues"] = json.loads(result["issues"])
    result["metrics"] = json.loads(result["metrics"])
    result["explainability"] = json.loads(result["explainability"])
    return result


def list_analyses(limit: int = 20) -> list[dict[str, Any]]:
    with connect() as connection:
        rows = connection.execute(
            "SELECT * FROM analyses ORDER BY timestamp DESC LIMIT ?", (max(1, min(limit, 100)),)
        ).fetchall()
    return [_decode(row) for row in rows]


def get_analysis(analysis_id: str) -> dict[str, Any] | None:
    with connect() as connection:
        row = connection.execute("SELECT * FROM analyses WHERE id = ?", (analysis_id,)).fetchone()
    return _decode(row) if row else None


def summary(model_status: str, model_version: str) -> dict[str, Any]:
    with connect() as connection:
        row = connection.execute(
            """
            SELECT COUNT(*) AS total,
              SUM(CASE WHEN quality_label = 'ACCEPTABLE' THEN 1 ELSE 0 END) AS acceptable,
              SUM(CASE WHEN quality_label = 'DEGRADED' THEN 1 ELSE 0 END) AS degraded,
              SUM(CASE WHEN quality_label = 'POTENTIALLY_DEFECTIVE' THEN 1 ELSE 0 END) AS potentially_defective,
              COALESCE(AVG(quality_score), 0) AS average_score
            FROM analyses
            """
        ).fetchone()
    return {
        "total": int(row["total"] or 0),
        "acceptable": int(row["acceptable"] or 0),
        "degraded": int(row["degraded"] or 0),
        "potentially_defective": int(row["potentially_defective"] or 0),
        "average_score": round(float(row["average_score"] or 0), 1),
        "model_status": model_status,
        "model_version": model_version,
    }