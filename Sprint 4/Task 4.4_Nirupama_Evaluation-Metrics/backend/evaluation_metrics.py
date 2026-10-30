"""
=============================================================================
TASK 4.4: EVALUATION METRICS ENGINE
=============================================================================
Module: evaluation_metrics.py
Purpose:
  Reads the predictions written by Task 4.3 (results/predictions.csv, with
  columns `actual` and `predicted`) and computes:
    * Classification metrics: accuracy, precision, recall, F1 (macro and
      weighted, plus binary when there are exactly two classes), confusion
      matrix and a per-class report.
    * Regression metrics: MAE, MSE, RMSE, R2, median absolute error,
      max error, and residuals (for plotting).
=============================================================================
"""

import math
import os

import numpy as np
import pandas as pd
from sklearn.metrics import (
    accuracy_score,
    confusion_matrix,
    precision_recall_fscore_support,
    mean_absolute_error,
    mean_squared_error,
    median_absolute_error,
    max_error,
    r2_score,
)

MAX_SCATTER_POINTS = 500  # cap payload size for the frontend chart


def _clean(value):
    """Convert numpy scalars to JSON-safe floats (NaN/inf -> None)."""
    value = float(value)
    return None if (math.isnan(value) or math.isinf(value)) else round(value, 6)


class EvaluationEngine:
    def __init__(self, results_dir="results"):
        self.results_dir = results_dir

    # ------------------------------------------------------------------ I/O
    def _load_predictions(self):
        path = os.path.join(self.results_dir, "predictions.csv")
        if not os.path.exists(path):
            raise FileNotFoundError(
                "predictions.csv not found. Please run model training (Task 4.3) first."
            )
        df = pd.read_csv(path)
        if not {"actual", "predicted"}.issubset(df.columns):
            raise ValueError("predictions.csv must contain 'actual' and 'predicted' columns.")
        df = df.dropna(subset=["actual", "predicted"])
        if df.empty:
            raise ValueError("predictions.csv contains no valid rows to evaluate.")
        return df

    # ------------------------------------------------------- classification
    @staticmethod
    def classification_metrics(y_true, y_pred):
        y_true = pd.Series(y_true).astype(str).reset_index(drop=True)
        y_pred = pd.Series(y_pred).astype(str).reset_index(drop=True)
        labels = sorted(set(y_true) | set(y_pred))

        accuracy = accuracy_score(y_true, y_pred)
        p_macro, r_macro, f_macro, _ = precision_recall_fscore_support(
            y_true, y_pred, labels=labels, average="macro", zero_division=0)
        p_w, r_w, f_w, _ = precision_recall_fscore_support(
            y_true, y_pred, labels=labels, average="weighted", zero_division=0)
        p_c, r_c, f_c, s_c = precision_recall_fscore_support(
            y_true, y_pred, labels=labels, average=None, zero_division=0)
        cm = confusion_matrix(y_true, y_pred, labels=labels)

        metrics = {
            "accuracy": _clean(accuracy),
            "macro": {"precision": _clean(p_macro), "recall": _clean(r_macro), "f1": _clean(f_macro)},
            "weighted": {"precision": _clean(p_w), "recall": _clean(r_w), "f1": _clean(f_w)},
        }

        # Binary: also report the headline precision/recall/F1 for the positive class
        if len(labels) == 2:
            positive = "1" if "1" in labels else labels[1]
            i = labels.index(positive)
            metrics["binary"] = {
                "positive_label": positive,
                "precision": _clean(p_c[i]), "recall": _clean(r_c[i]), "f1": _clean(f_c[i]),
            }

        return {
            "metrics": metrics,
            "labels": labels,
            "confusion_matrix": cm.tolist(),
            "per_class": [
                {"label": labels[i], "precision": _clean(p_c[i]), "recall": _clean(r_c[i]),
                 "f1": _clean(f_c[i]), "support": int(s_c[i])}
                for i in range(len(labels))
            ],
        }

    # ----------------------------------------------------------- regression
    @staticmethod
    def regression_metrics(y_true, y_pred):
        y_true = pd.to_numeric(pd.Series(y_true), errors="coerce").to_numpy(dtype=float)
        y_pred = pd.to_numeric(pd.Series(y_pred), errors="coerce").to_numpy(dtype=float)
        mask = ~(np.isnan(y_true) | np.isnan(y_pred))
        y_true, y_pred = y_true[mask], y_pred[mask]
        if len(y_true) == 0:
            raise ValueError("Regression evaluation needs numeric 'actual' and 'predicted' values.")

        mse = mean_squared_error(y_true, y_pred)
        residuals = y_true - y_pred
        metrics = {
            "mae": _clean(mean_absolute_error(y_true, y_pred)),
            "mse": _clean(mse),
            "rmse": _clean(math.sqrt(mse)),
            "r2": _clean(r2_score(y_true, y_pred)) if len(y_true) > 1 else None,
            "median_ae": _clean(median_absolute_error(y_true, y_pred)),
            "max_error": _clean(max_error(y_true, y_pred)),
            "mean_residual": _clean(residuals.mean()),
        }

        idx = np.arange(len(y_true))
        if len(idx) > MAX_SCATTER_POINTS:
            idx = np.linspace(0, len(y_true) - 1, MAX_SCATTER_POINTS).astype(int)
        return {
            "metrics": metrics,
            "points": [{"actual": _clean(y_true[i]), "predicted": _clean(y_pred[i])} for i in idx],
        }

    # ---------------------------------------------------------------- public
    def evaluate(self, task_type):
        if task_type not in ("classification", "regression"):
            raise ValueError(f"Unsupported task type: {task_type}. Must be 'classification' or 'regression'.")
        df = self._load_predictions()

        if task_type == "classification":
            body = self.classification_metrics(df["actual"], df["predicted"])
        else:
            body = self.regression_metrics(df["actual"], df["predicted"])

        return {"status": "completed", "task_type": task_type, "n_samples": int(len(df)), **body}
