import pytest
from flask import Flask
from flask_cors import CORS

from preferred_model_routes import create_preferred_model_blueprint
from preferred_model_store import PreferredModelStore, ValidationError

CLF_METRICS = {"accuracy": 0.94, "precision": 0.92, "recall": 0.91, "f1_score": 0.915}
URL = "/api/preferred-model"


@pytest.fixture
def store(tmp_path):
    return PreferredModelStore(db_path=str(tmp_path / "prefs.db"))


@pytest.fixture
def client(tmp_path):
    app = Flask(__name__)
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    app.register_blueprint(create_preferred_model_blueprint(str(tmp_path / "prefs.db")))
    return app.test_client()


def payload(**overrides):
    body = {
        "project_id": "PRJ-1",
        "task_type": "classification",
        "model_name": "Random Forest",
        "hyperparameters": {"n_estimators": 100},
        "metrics": dict(CLF_METRICS),
    }
    body.update(overrides)
    return body


# ---------- store ----------

def test_save_then_get_roundtrips_selection_and_results(store):
    saved = store.save("PRJ-1", "classification", "Random Forest", CLF_METRICS, {"n_estimators": 100})
    assert saved["model_name"] == "Random Forest"
    assert saved["metrics"] == CLF_METRICS
    assert saved["hyperparameters"] == {"n_estimators": 100}
    assert saved["saved_at"]
    assert store.get("PRJ-1", "classification") == saved


def test_get_returns_none_when_nothing_saved(store):
    assert store.get("PRJ-1", "classification") is None


def test_saving_again_replaces_previous_preference(store):
    store.save("PRJ-1", "classification", "Random Forest", CLF_METRICS)
    store.save("PRJ-1", "classification", "SVM", {"accuracy": 0.89})
    got = store.get("PRJ-1", "classification")
    assert got["model_name"] == "SVM"
    assert got["metrics"] == {"accuracy": 0.89}


def test_preferences_are_separate_per_project_and_task_type(store):
    store.save("PRJ-1", "classification", "Random Forest", CLF_METRICS)
    store.save("PRJ-1", "regression", "Ridge", {"mae": 3.2})
    store.save("PRJ-2", "classification", "SVM", {"accuracy": 0.89})
    assert store.get("PRJ-1", "classification")["model_name"] == "Random Forest"
    assert store.get("PRJ-1", "regression")["model_name"] == "Ridge"
    assert store.get("PRJ-2", "classification")["model_name"] == "SVM"


def test_preference_survives_a_new_store_instance(tmp_path):
    path = str(tmp_path / "prefs.db")
    PreferredModelStore(path).save("PRJ-1", "classification", "Random Forest", CLF_METRICS)
    assert PreferredModelStore(path).get("PRJ-1", "classification")["model_name"] == "Random Forest"


def test_task_type_is_case_insensitive(store):
    store.save("PRJ-1", "Classification", "Random Forest", CLF_METRICS)
    assert store.get("PRJ-1", "classification") is not None


def test_delete(store):
    store.save("PRJ-1", "classification", "Random Forest", CLF_METRICS)
    assert store.delete("PRJ-1", "classification") is True
    assert store.get("PRJ-1", "classification") is None
    assert store.delete("PRJ-1", "classification") is False


@pytest.mark.parametrize("kwargs", [
    {"project_id": ""},
    {"project_id": None},
    {"task_type": "clustering"},
    {"model_name": "   "},
    {"metrics": {}},
    {"metrics": None},
    {"metrics": {"accuracy": "high"}},
    {"metrics": {"accuracy": True}},
    {"metrics": {"accuracy": float("nan")}},
    {"hyperparameters": [1, 2]},
])
def test_invalid_input_is_rejected(store, kwargs):
    args = dict(project_id="PRJ-1", task_type="classification",
                model_name="Random Forest", metrics=CLF_METRICS, hyperparameters={})
    args.update(kwargs)
    with pytest.raises(ValidationError):
        store.save(**args)


# ---------- routes ----------

def test_get_before_saving_is_success_with_null(client):
    res = client.get(URL, query_string={"project_id": "PRJ-1", "task_type": "classification"})
    assert res.status_code == 200
    assert res.get_json() == {"status": "success", "preferred_model": None}


def test_put_then_get(client):
    put = client.put(URL, json=payload())
    assert put.status_code == 200
    assert put.get_json()["preferred_model"]["model_name"] == "Random Forest"

    got = client.get(URL, query_string={"project_id": "PRJ-1", "task_type": "classification"})
    record = got.get_json()["preferred_model"]
    assert record["metrics"] == CLF_METRICS
    assert record["hyperparameters"] == {"n_estimators": 100}


def test_put_without_json_body_is_400(client):
    assert client.put(URL).status_code == 400


def test_put_with_invalid_metrics_is_400_with_message(client):
    res = client.put(URL, json=payload(metrics={"accuracy": "high"}))
    assert res.status_code == 400
    assert res.get_json()["status"] == "error"
    assert "accuracy" in res.get_json()["message"]


def test_get_without_params_is_400(client):
    assert client.get(URL).status_code == 400


def test_delete_flow(client):
    client.put(URL, json=payload())
    params = {"project_id": "PRJ-1", "task_type": "classification"}
    assert client.delete(URL, query_string=params).status_code == 200
    assert client.get(URL, query_string=params).get_json()["preferred_model"] is None
    assert client.delete(URL, query_string=params).status_code == 404


def test_cors_preflight_allows_put_and_delete(client):
    res = client.options(URL, headers={
        "Origin": "http://localhost:5174",
        "Access-Control-Request-Method": "PUT",
        "Access-Control-Request-Headers": "content-type",
    })
    assert res.status_code == 200
    assert "PUT" in res.headers["Access-Control-Allow-Methods"]
    assert "DELETE" in res.headers["Access-Control-Allow-Methods"]
