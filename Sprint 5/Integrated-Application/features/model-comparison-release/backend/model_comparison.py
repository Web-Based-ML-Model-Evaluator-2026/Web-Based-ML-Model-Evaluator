"""Validated model comparison and task-aware ranking utilities."""
from __future__ import annotations
from math import isfinite
from typing import Any

CLASSIFICATION_METRICS = {"accuracy", "precision", "recall", "f1_score"}
REGRESSION_METRICS = {"mae", "mse", "rmse", "r2_score"}
LOWER_IS_BETTER = {"mae", "mse", "rmse"}

class ComparisonValidationError(ValueError):
    """Raised when comparison input is malformed or not comparable."""

def compare_models(task_type: str, models: list[dict[str, Any]], primary_metric: str | None = None) -> dict[str, Any]:
    if task_type not in ("classification", "regression"):
        raise ComparisonValidationError("task_type must be classification or regression")
    if not isinstance(models, list) or len(models) < 2:
        raise ComparisonValidationError("Provide at least two model evaluation records")
    supported = CLASSIFICATION_METRICS if task_type == "classification" else REGRESSION_METRICS
    metric = primary_metric or ("f1_score" if task_type == "classification" else "rmse")
    if metric not in supported:
        raise ComparisonValidationError(f"Unsupported primary metric '{metric}' for {task_type}")
    direction = "minimize" if metric in LOWER_IS_BETTER else "maximize"
    seen = set()
    normalized = []
    for index, record in enumerate(models):
        if not isinstance(record, dict):
            raise ComparisonValidationError(f"models[{index}] must be an object")
        name = record.get("name")
        metrics = record.get("metrics")
        if not isinstance(name, str) or not name.strip():
            raise ComparisonValidationError(f"models[{index}].name is required")
        if name.strip() in seen:
            raise ComparisonValidationError(f"Duplicate model name: {name.strip()}")
        seen.add(name.strip())
        if not isinstance(metrics, dict):
            raise ComparisonValidationError(f"models[{index}].metrics must be an object")
        clean = {}
        for key in supported:
            if key not in metrics:
                continue
            value = metrics[key]
            if isinstance(value, bool) or not isinstance(value, (int, float)) or not isfinite(value):
                raise ComparisonValidationError(f"{name}: metric {key} must be a finite number")
            if task_type == "classification" and not 0 <= value <= 1:
                raise ComparisonValidationError(f"{name}: classification metric {key} must be between 0 and 1")
            if key in LOWER_IS_BETTER and value < 0:
                raise ComparisonValidationError(f"{name}: error metric {key} cannot be negative")
            clean[key] = float(value)
        if metric not in clean:
            raise ComparisonValidationError(f"{name}: primary metric '{metric}' is missing")
        normalized.append({"name": name.strip(), "metrics": clean})
    normalized.sort(key=lambda item: (item["metrics"][metric] if direction == "maximize" else -item["metrics"][metric]), reverse=True)
    for rank, record in enumerate(normalized, start=1):
        record["rank"] = rank
    return {"task_type": task_type, "primary_metric": metric, "direction": direction,
            "models": normalized, "best_model": normalized[0]["name"]}
