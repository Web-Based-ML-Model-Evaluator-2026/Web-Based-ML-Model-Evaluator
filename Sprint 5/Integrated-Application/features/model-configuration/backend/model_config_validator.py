"""Allowlist-based validation for Sprint 4 Task 4.2 model configuration.

This module validates the Task 4.2 JSON contract before it reaches Task 4.3.
It intentionally does not train models or load user-supplied Python objects.
"""
from __future__ import annotations

from copy import deepcopy
from numbers import Real
from typing import Any


# Each model has an explicit parameter allowlist and basic type/range checks.
SCHEMAS: dict[str, dict[str, dict[str, Any]]] = {
    "classification": {
        "Logistic Regression": {
            "C": ("number", 1e-6, None),
            "max_iter": ("int", 1, None),
            "solver": ("choice", ["lbfgs", "liblinear", "newton-cg", "sag", "saga"]),
            "random_state": ("int", 0, None),
        },
        "Decision Tree": {
            "criterion": ("choice", ["gini", "entropy", "log_loss"]),
            "max_depth": ("optional_int", 1, None),
            "min_samples_split": ("int", 2, None),
            "min_samples_leaf": ("int", 1, None),
            "random_state": ("int", 0, None),
        },
        "Random Forest": {
            "n_estimators": ("int", 1, None),
            "criterion": ("choice", ["gini", "entropy", "log_loss"]),
            "max_depth": ("optional_int", 1, None),
            "min_samples_split": ("int", 2, None),
            "min_samples_leaf": ("int", 1, None),
            "random_state": ("int", 0, None),
        },
        "SVM": {
            "C": ("number", 1e-6, None),
            "kernel": ("choice", ["linear", "poly", "rbf", "sigmoid"]),
            "gamma": ("choice", ["scale", "auto"]),
            "random_state": ("int", 0, None),
        },
        "k-NN": {
            "n_neighbors": ("int", 1, None),
            "weights": ("choice", ["uniform", "distance"]),
            "p": ("choice_int", [1, 2]),
        },
        "Naive Bayes": {
            "var_smoothing": ("number", 0, None),
        },
    },
    "regression": {
        "Linear Regression": {
            "fit_intercept": ("bool",),
        },
        "Ridge": {
            "alpha": ("number", 0, None),
            "fit_intercept": ("bool",),
            "random_state": ("int", 0, None),
        },
        "Lasso": {
            "alpha": ("number", 0, None),
            "max_iter": ("int", 1, None),
            "fit_intercept": ("bool",),
            "random_state": ("int", 0, None),
        },
        "Decision Tree Regressor": {
            "criterion": ("choice", ["squared_error", "friedman_mse", "absolute_error", "poisson"]),
            "max_depth": ("optional_int", 1, None),
            "min_samples_split": ("int", 2, None),
            "min_samples_leaf": ("int", 1, None),
            "random_state": ("int", 0, None),
        },
        "Random Forest Regressor": {
            "n_estimators": ("int", 1, None),
            "criterion": ("choice", ["squared_error", "absolute_error", "friedman_mse", "poisson"]),
            "max_depth": ("optional_int", 1, None),
            "min_samples_split": ("int", 2, None),
            "min_samples_leaf": ("int", 1, None),
            "random_state": ("int", 0, None),
        },
    },
}


def _is_number(value: Any) -> bool:
    return isinstance(value, Real) and not isinstance(value, bool)


def validate_model_configuration(payload: Any) -> dict[str, Any]:
    """Validate and return a normalized Task 4.3-compatible configuration.

    Raises:
        ValueError: when required fields, model names, or parameter values are invalid.
    """
    if not isinstance(payload, dict):
        raise ValueError("Request body must be a JSON object.")

    task_type = payload.get("task_type")
    model_name = payload.get("model_name")
    hyperparameters = payload.get("hyperparameters", {})

    if task_type not in SCHEMAS:
        raise ValueError("task_type must be 'classification' or 'regression'.")
    if not isinstance(model_name, str) or model_name not in SCHEMAS[task_type]:
        raise ValueError(f"Unsupported model '{model_name}' for task '{task_type}'.")
    if not isinstance(hyperparameters, dict):
        raise ValueError("hyperparameters must be a JSON object.")

    schema = SCHEMAS[task_type][model_name]
    unknown = set(hyperparameters) - set(schema)
    if unknown:
        raise ValueError(f"Unsupported hyperparameter(s): {', '.join(sorted(unknown))}.")

    normalized: dict[str, Any] = {}
    for name, value in hyperparameters.items():
        rule = schema[name]
        kind = rule[0]

        if kind == "bool":
            if not isinstance(value, bool):
                raise ValueError(f"{name} must be true or false.")
            normalized[name] = value
        elif kind == "choice":
            if value not in rule[1]:
                raise ValueError(f"{name} must be one of: {', '.join(rule[1])}.")
            normalized[name] = value
        elif kind == "choice_int":
            if isinstance(value, bool) or not isinstance(value, int) or value not in rule[1]:
                raise ValueError(f"{name} must be one of: {rule[1]}.")
            normalized[name] = value
        elif kind == "optional_int":
            if value is None:
                normalized[name] = None
            elif isinstance(value, bool) or not isinstance(value, int) or value < rule[1]:
                raise ValueError(f"{name} must be null or an integer >= {rule[1]}.")
            else:
                normalized[name] = value
        elif kind == "int":
            if isinstance(value, bool) or not isinstance(value, int) or value < rule[1]:
                raise ValueError(f"{name} must be an integer >= {rule[1]}.")
            normalized[name] = value
        elif kind == "number":
            if not _is_number(value) or value < rule[1]:
                relation = "greater than zero" if rule[1] > 0 else "non-negative"
                raise ValueError(f"{name} must be a {relation} number.")
            normalized[name] = value
        else:
            raise ValueError(f"Internal validation rule is not supported for {name}.")

    # Ensure reproducibility for model classes that support random_state.
    if "random_state" in schema:
        normalized.setdefault("random_state", 42)

    return {
        "task_type": task_type,
        "model_name": model_name,
        "hyperparameters": normalized,
    }
