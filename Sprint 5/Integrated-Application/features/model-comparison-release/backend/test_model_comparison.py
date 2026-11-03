import pytest
from flask import Flask
from backend.model_comparison import compare_models, ComparisonValidationError
from backend.comparison_routes import comparison_bp

@pytest.fixture
def client():
    app = Flask(__name__)
    app.register_blueprint(comparison_bp)
    return app.test_client()

def test_classification_ranks_highest_f1_first():
    result = compare_models("classification", [
        {"name":"A", "metrics":{"f1_score":0.8}},
        {"name":"B", "metrics":{"f1_score":0.92}},
    ])
    assert result["best_model"] == "B"
    assert [m["rank"] for m in result["models"]] == [1, 2]
    assert result["direction"] == "maximize"

def test_regression_minimizes_rmse():
    result = compare_models("regression", [
        {"name":"A", "metrics":{"rmse":3.4}},
        {"name":"B", "metrics":{"rmse":2.1}},
    ])
    assert result["best_model"] == "B"
    assert result["direction"] == "minimize"

@pytest.mark.parametrize("payload", [
    {"task_type":"unknown", "models":[]},
    {"task_type":"classification", "models":[{"name":"A","metrics":{"f1_score":0.5}}]},
    {"task_type":"classification", "models":[{"name":"A","metrics":{"f1_score":1.2}},{"name":"B","metrics":{"f1_score":0.4}}]},
    {"task_type":"regression", "models":[{"name":"A","metrics":{"rmse":float("nan")}},{"name":"B","metrics":{"rmse":1}}]},
])
def test_invalid_inputs_rejected(payload):
    with pytest.raises(ComparisonValidationError):
        compare_models(payload.get("task_type"), payload.get("models"), payload.get("primary_metric"))

def test_api_success(client):
    response = client.post("/api/compare", json={"task_type":"classification", "models":[
        {"name":"Logistic Regression", "metrics":{"f1_score":0.81}},
        {"name":"Random Forest", "metrics":{"f1_score":0.93}}
    ]})
    assert response.status_code == 200
    assert response.json["best_model"] == "Random Forest"

def test_api_bad_payload(client):
    response = client.post("/api/compare", json={"task_type":"classification", "models":[]})
    assert response.status_code == 400
    assert "error" in response.json
