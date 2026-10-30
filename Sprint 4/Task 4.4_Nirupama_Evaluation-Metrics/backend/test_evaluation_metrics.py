import math
import pandas as pd
import pytest
from evaluation_metrics import EvaluationEngine


def write_preds(tmp_path, actual, predicted):
    pd.DataFrame({"actual": actual, "predicted": predicted}).to_csv(tmp_path / "predictions.csv", index=False)
    return EvaluationEngine(results_dir=str(tmp_path))


def test_binary_classification_known_values(tmp_path):
    # TP=3 FN=1 FP=1 TN=3  -> accuracy 0.75, precision 0.75, recall 0.75
    eng = write_preds(tmp_path, [1, 1, 1, 1, 0, 0, 0, 0], [1, 1, 1, 0, 1, 0, 0, 0])
    r = eng.evaluate("classification")
    assert r["metrics"]["accuracy"] == 0.75
    assert r["metrics"]["binary"]["precision"] == 0.75
    assert r["metrics"]["binary"]["recall"] == 0.75
    assert r["labels"] == ["0", "1"]
    assert r["confusion_matrix"] == [[3, 1], [1, 3]]


def test_multiclass_classification(tmp_path):
    eng = write_preds(tmp_path, ["a", "b", "c", "a", "b", "c"], ["a", "b", "b", "a", "b", "c"])
    r = eng.evaluate("classification")
    assert math.isclose(r["metrics"]["accuracy"], 5 / 6, rel_tol=1e-5)
    assert "binary" not in r["metrics"]
    assert len(r["per_class"]) == 3
    assert sum(c["support"] for c in r["per_class"]) == 6


def test_class_never_predicted_does_not_crash(tmp_path):
    eng = write_preds(tmp_path, [0, 1, 2], [0, 0, 0])
    r = eng.evaluate("classification")
    assert r["metrics"]["macro"]["precision"] is not None


def test_regression_known_values(tmp_path):
    eng = write_preds(tmp_path, [3, 5, 7], [2, 5, 9])  # errors: 1, 0, -2
    m = eng.evaluate("regression")["metrics"]
    assert math.isclose(m["mae"], 1.0)
    assert math.isclose(m["mse"], 5 / 3, rel_tol=1e-5)
    assert math.isclose(m["rmse"], math.sqrt(5 / 3), rel_tol=1e-5)
    assert math.isclose(m["max_error"], 2.0)


def test_perfect_regression_r2_is_one(tmp_path):
    m = write_preds(tmp_path, [1, 2, 3, 4], [1, 2, 3, 4]).evaluate("regression")["metrics"]
    assert m["r2"] == 1.0 and m["rmse"] == 0.0


def test_regression_rejects_non_numeric(tmp_path):
    with pytest.raises(ValueError):
        write_preds(tmp_path, ["x", "y"], ["x", "z"]).evaluate("regression")


def test_missing_file_and_bad_task(tmp_path):
    with pytest.raises(FileNotFoundError):
        EvaluationEngine(results_dir=str(tmp_path)).evaluate("classification")
    with pytest.raises(ValueError):
        write_preds(tmp_path, [1], [1]).evaluate("clustering")
