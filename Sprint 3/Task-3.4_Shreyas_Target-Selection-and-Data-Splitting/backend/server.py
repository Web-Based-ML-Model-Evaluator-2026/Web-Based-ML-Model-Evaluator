"""
=============================================================================
TASK 3.4: FLASK REST API SERVER
=============================================================================
Module: server.py
Purpose:
  Provides API endpoints strictly scoped to Task 3.4:
  - GET  /api/health: Service health check
  - GET  /api/dataset-info: Retrieves the active pipeline dataset schema (empty by default)
  - POST /api/pipeline/ingest: Endpoint for previous task (Task 3.3) to pass data in
  - POST /api/split: Executes target separation and data splitting
=============================================================================
"""

import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
from data_splitter import DataSplitterEngine

app = Flask(__name__)
CORS(app)

engine = DataSplitterEngine(storage_dir="splits")

# ---------------------------------------------------------------------------
# INITIAL PIPELINE STATE: Completely empty by default
# ---------------------------------------------------------------------------
CURRENT_DATASET = {
    "df": None,
    "source": None
}


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({
        "status": "healthy",
        "service": "Task 3.4 Target Selection and Splitting",
        "port": 5001
    }), 200


# ---------------------------------------------------------------------------
# ROUTE 1: FETCH ACTIVE PIPELINE DATASET SCHEMA
# ---------------------------------------------------------------------------
@app.route("/api/dataset-info", methods=["GET"])
def get_dataset_info():
    """
    Returns column headers and row count.
    If no dataset has been provided by earlier pipeline tasks, returns status: "empty".
    """
    df = CURRENT_DATASET.get("df")

    # If pipeline is empty, return empty response cleanly (HTTP 200 with status: empty)
    if df is None or df.empty:
        return jsonify({
            "status": "empty",
            "message": "No dataset currently in pipeline. Waiting for preprocessed data from Task 3.3.",
            "columns": [],
            "total_rows": 0
        }), 200

    return jsonify({
        "status": "ready",
        "source": CURRENT_DATASET.get("source", "upstream_pipeline"),
        "columns": list(df.columns),
        "total_rows": len(df)
    }), 200


# ---------------------------------------------------------------------------
# ROUTE 2: PIPELINE INGESTION ENDPOINT (Called by upstream Task 3.3 or test script)
# ---------------------------------------------------------------------------
@app.route("/api/pipeline/ingest", methods=["POST"])
def ingest_pipeline_data():
    """
    Allows the upstream module (Task 3.3 / Feature Scaling) to push its
    preprocessed DataFrame into Task 3.4 for target selection and splitting.
    """
    # Accept JSON records payload from upstream pipeline
    data = request.get_json()
    if not data or "records" not in data:
        return jsonify({"error": "Payload must contain 'records' list"}), 400

    try:
        df = pd.DataFrame(data["records"])
        CURRENT_DATASET["df"] = df
        CURRENT_DATASET["source"] = data.get("source", "pipeline_task_3.3")

        return jsonify({
            "status": "success",
            "message": f"Successfully received {len(df)} rows and {len(df.columns)} columns from upstream pipeline.",
            "columns": list(df.columns),
            "total_rows": len(df)
        }), 200
    except Exception as e:
        return jsonify({"error": f"Failed to ingest pipeline data: {str(e)}"}), 500


# ---------------------------------------------------------------------------
# ROUTE 3: EXECUTE TARGET SELECTION & DATA SPLITTING
# ---------------------------------------------------------------------------
@app.route("/api/split", methods=["POST"])
def split_data():
    """
    Splits the active pipeline dataset into X_train, X_test, y_train, y_test.
    """
    df = CURRENT_DATASET.get("df")
    if df is None or df.empty:
        return jsonify({
            "error": "Pipeline dataset is empty. Cannot split without incoming data."
        }), 400

    data = request.get_json() or {}
    target_column = data.get("target_column")
    test_size = float(data.get("test_size", 0.2))
    random_state = int(data.get("random_state", 42))
    shuffle = bool(data.get("shuffle", True))
    auto_stratify = bool(data.get("auto_stratify", True))

    if not target_column:
        return jsonify({"error": "target_column parameter is required"}), 400

    try:
        result = engine.validate_and_split(
            df=df,
            target_column=target_column,
            test_size=test_size,
            random_state=random_state,
            shuffle=shuffle,
            auto_stratify=auto_stratify
        )
        return jsonify({"status": "success", "data": result}), 200
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 422
    except Exception as e:
        return jsonify({"error": f"Splitting operation failed: {str(e)}"}), 500


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5001, debug=True)