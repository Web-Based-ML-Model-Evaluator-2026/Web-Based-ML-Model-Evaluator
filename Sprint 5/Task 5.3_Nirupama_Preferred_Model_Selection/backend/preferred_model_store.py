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

