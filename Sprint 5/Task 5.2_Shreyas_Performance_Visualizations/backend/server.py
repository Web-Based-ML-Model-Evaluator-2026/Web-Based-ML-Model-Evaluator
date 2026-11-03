import os
import io
import pandas as pd
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from report_generator import EvaluationReportGenerator

app = Flask(__name__)
# Enable CORS for frontend integration across development ports
CORS(app, resources={r"/api/*": {"origins": "*"}})

def load_project_dataset():
    """
    Attempts to read tabular CSV data from previous sprint outputs.
    Falls back to a standard dataset if files are not present.
    """
    possible_paths = [
        os.path.join("..", "..", "Sprint 4", "Task 4.3_Shreyas_Model training and testing", "backend", "splits", "X_test.csv"),
        os.path.join("data", "dataset.csv")
    ]
    for p in possible_paths:
        if os.path.exists(p):
            try:
                return pd.read_csv(p)
            except Exception:
                pass

    # Built-in fallback tabular dataset
    return pd.DataFrame({
        "age": [25, 32, 47, 51, 62, 23, 38, 42, 55, 29, 48, 36],
        "salary": [45000, 62000, 89000, 95000, 110000, 39000, 71000, 78000, 102000, 52000, 88000, 67000],
        "credit_score": [680, 710, 640, 750, 790, 620, 690, 705, 730, 660, 740, 695],
        "default": [0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0]
    })

@app.route("/api/health", methods=["GET"])
def health_check():
    """Confirms that the visualization and reporting service is healthy."""
    return jsonify({"status": "running", "service": "Sprint 5 & 6 Visualizations and Reporting Engine"}), 200

@app.route("/api/visualize", methods=["POST"])
def get_visualization_metrics():
    """
    Task 5.2 (SRS ML-F-051):
    Returns model metric comparisons structured for Chart.js.
    Correctly separates Classification bounded scores from Regression error metrics.
    """
    payload = request.get_json() or {}
    task_type = payload.get("task_type", "classification").lower()

    if task_type == "classification":
        # Classification evaluation metrics bounded between 0.0 and 1.0
        response_data = {
            "task_type": "classification",
            "metrics_list": ["Accuracy", "Precision", "Recall", "F1 Score"],
            "models": [
                {
                    "name": "Random Forest",
                    "scores": [0.94, 0.92, 0.91, 0.915]
                },
                {
                    "name": "Logistic Regression",
                    "scores": [0.86, 0.84, 0.83, 0.835]
                },
                {
                    "name": "Support Vector Machine",
                    "scores": [0.89, 0.88, 0.86, 0.870]
                }
            ]
        }
    else:
        # Regression evaluation metrics (continuous error metrics and R2)
        response_data = {
            "task_type": "regression",
            "metrics_list": ["MAE", "RMSE", "R2 Score"],
            "models": [
                {
                    "name": "Random Forest Regressor",
                    "scores": [2.14, 3.05, 0.89]
                },
                {
                    "name": "Linear Regression",
                    "scores": [3.45, 4.82, 0.76]
                },
                {
                    "name": "Ridge Regressor",
                    "scores": [3.20, 4.41, 0.79]
                }
            ]
        }

    return jsonify(response_data), 200

@app.route("/api/report/summary", methods=["GET"])
def get_report_summary():
    """
    Returns dataset statistics (total tuples, columns, means, 10 sample tuples)
    for UI preview prior to document export.
    """
    df = load_project_dataset()
    generator = EvaluationReportGenerator({}, dataset_df=df)
    summary = generator.compute_summary_statistics()
    return jsonify(summary), 200

@app.route("/api/report/pdf", methods=["POST"])
def download_pdf_report():
    """
    Task 6.1 (SRS ML-F-053):
    Generates and streams the PDF evaluation report as a downloadable attachment.
    """
    payload = request.get_json() or {
        "project_id": "PRJ-PES-2026",
        "task_type": "classification",
        "target_column": "default",
        "model_name": "Random Forest",
        "hyperparameters": {"n_estimators": 100, "max_depth": 10, "random_state": 42},
        "metrics": {"accuracy": 0.94, "precision": 0.92, "recall": 0.91, "f1_score": 0.915}
    }

    df = load_project_dataset()
    generator = EvaluationReportGenerator(payload, dataset_df=df)
    pdf_bytes = generator.generate_pdf()

    return send_file(
        io.BytesIO(pdf_bytes),
        mimetype="application/pdf",
        as_attachment=True,
        download_name="Model_Evaluation_Report.pdf"
    )

@app.route("/api/report/csv", methods=["POST"])
def download_csv_report():
    """
    Task 6.1 (SRS ML-F-053):
    Generates and streams the structured CSV summary as a downloadable attachment.
    """
    payload = request.get_json() or {
        "project_id": "PRJ-PES-2026",
        "task_type": "classification",
        "target_column": "default",
        "model_name": "Random Forest",
        "hyperparameters": {"n_estimators": 100, "max_depth": 10},
        "metrics": {"accuracy": 0.94, "precision": 0.92, "recall": 0.91, "f1_score": 0.915}
    }

    df = load_project_dataset()
    generator = EvaluationReportGenerator(payload, dataset_df=df)
    csv_string = generator.generate_csv()

    return send_file(
        io.BytesIO(csv_string.encode("utf-8")),
        mimetype="text/csv",
        as_attachment=True,
        download_name="Model_Evaluation_Report.csv"
    )

if __name__ == "__main__":
    # Runs on dedicated port 5001 to avoid colliding with Task 4.3's port 5000
    app.run(host="0.0.0.0", port=5001, debug=True)