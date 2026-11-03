"""Flask blueprint for model comparison."""
from flask import Blueprint, jsonify, request
from .model_comparison import compare_models, ComparisonValidationError

comparison_bp = Blueprint("model_comparison", __name__)

@comparison_bp.post("/api/compare")
def compare_endpoint():
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        return jsonify({"error": "A JSON object is required"}), 400
    try:
        result = compare_models(payload.get("task_type"), payload.get("models"), payload.get("primary_metric"))
        return jsonify(result), 200
    except ComparisonValidationError as exc:
        return jsonify({"error": str(exc)}), 400
