"""
=============================================================================
TASK 5.3: PREFERRED MODEL STORE
=============================================================================
Module: preferred_model_store.py
Purpose:
  Persists the model a user marks as "preferred" together with the results
  (evaluation metrics, hyperparameters) it had at the time of selection.

  One preference is stored per (project_id, task_type). Saving again for the
  same pair replaces the previous preference (upsert). Storage is a small
  SQLite file from the Python standard library, so no new dependency is needed
  and concurrent requests cannot corrupt the data.
=============================================================================
"""

import json
import math
import os
import sqlite3
from contextlib import closing
from datetime import datetime, timezone

VALID_TASK_TYPES = ("classification", "regression")
MAX_ID_LENGTH = 100


class ValidationError(ValueError):
    """Raised when a preferred-model payload is malformed."""


def _clean_text(value, field):
    if not isinstance(value, str) or not value.strip():
        raise ValidationError(f"'{field}' is required and must be a non-empty string.")
    value = value.strip()
    if len(value) > MAX_ID_LENGTH:
        raise ValidationError(f"'{field}' must be at most {MAX_ID_LENGTH} characters.")
    return value


def clean_key(project_id, task_type):
    """Validates and normalises the (project_id, task_type) lookup key."""
    project_id = _clean_text(project_id, "project_id")
    task_type = _clean_text(task_type, "task_type").lower()
    if task_type not in VALID_TASK_TYPES:
        raise ValidationError("'task_type' must be 'classification' or 'regression'.")
    return project_id, task_type


def clean_metrics(metrics):
    """Metrics must be a non-empty {name: finite number} mapping."""
    if not isinstance(metrics, dict) or not metrics:
        raise ValidationError("'metrics' must be a non-empty object of metric name to value.")
    cleaned = {}
    for name, value in metrics.items():
        if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value):
            raise ValidationError(f"Metric '{name}' must be a finite number.")
        cleaned[str(name)] = value
    return cleaned


def clean_hyperparameters(hyperparameters):
    if hyperparameters is None:
        return {}
    if not isinstance(hyperparameters, dict):
        raise ValidationError("'hyperparameters' must be an object.")
    return hyperparameters


class PreferredModelStore:
    def __init__(self, db_path=os.path.join("data", "preferred_models.db")):
        self.db_path = db_path
        directory = os.path.dirname(db_path)
        if directory:
            os.makedirs(directory, exist_ok=True)
        with closing(self._connect()) as conn, conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS preferred_models (
                    project_id      TEXT NOT NULL,
                    task_type       TEXT NOT NULL,
                    model_name      TEXT NOT NULL,
                    hyperparameters TEXT NOT NULL,
                    metrics         TEXT NOT NULL,
                    saved_at        TEXT NOT NULL,
                    PRIMARY KEY (project_id, task_type)
                )
                """
            )

    def _connect(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    @staticmethod
    def _to_record(row):
        return {
            "project_id": row["project_id"],
            "task_type": row["task_type"],
            "model_name": row["model_name"],
            "hyperparameters": json.loads(row["hyperparameters"]),
            "metrics": json.loads(row["metrics"]),
            "saved_at": row["saved_at"],
        }

    def save(self, project_id, task_type, model_name, metrics, hyperparameters=None):
        """Validates and upserts the preferred model. Returns the stored record."""
        project_id, task_type = clean_key(project_id, task_type)
        model_name = _clean_text(model_name, "model_name")
        metrics = clean_metrics(metrics)
        hyperparameters = clean_hyperparameters(hyperparameters)
        saved_at = datetime.now(timezone.utc).isoformat(timespec="seconds")

        with closing(self._connect()) as conn, conn:
            conn.execute(
                """
                INSERT INTO preferred_models
                    (project_id, task_type, model_name, hyperparameters, metrics, saved_at)
                VALUES (?, ?, ?, ?, ?, ?)
                ON CONFLICT(project_id, task_type) DO UPDATE SET
                    model_name = excluded.model_name,
                    hyperparameters = excluded.hyperparameters,
                    metrics = excluded.metrics,
                    saved_at = excluded.saved_at
                """,
                (project_id, task_type, model_name,
                 json.dumps(hyperparameters), json.dumps(metrics), saved_at),
            )
        return self.get(project_id, task_type)

    def get(self, project_id, task_type):
        """Returns the saved record, or None if no preference has been saved."""
        project_id, task_type = clean_key(project_id, task_type)
        with closing(self._connect()) as conn:
            row = conn.execute(
                "SELECT * FROM preferred_models WHERE project_id = ? AND task_type = ?",
                (project_id, task_type),
            ).fetchone()
        return self._to_record(row) if row else None

    def delete(self, project_id, task_type):
        """Removes the saved preference. Returns True if one existed."""
        project_id, task_type = clean_key(project_id, task_type)
        with closing(self._connect()) as conn, conn:
            cursor = conn.execute(
                "DELETE FROM preferred_models WHERE project_id = ? AND task_type = ?",
                (project_id, task_type),
            )
        return cursor.rowcount > 0
