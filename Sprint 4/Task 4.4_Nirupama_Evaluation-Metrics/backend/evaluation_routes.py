"""
TASK 4.4: Flask blueprint exposing POST /api/evaluate.
Register in server.py with:  app.register_blueprint(create_evaluation_blueprint("results"))
"""
from flask import Blueprint, request, jsonify
from evaluation_metrics import EvaluationEngine


def create_evaluation_blueprint(results_dir="results"):
    bp = Blueprint("evaluation", __name__)
    engine = EvaluationEngine(results_dir=results_dir)

    @bp.route("/api/evaluate", methods=["POST"])
    def evaluate():
        try:
            data = request.get_json(silent=True) or {}
            task_type = data.get("task_type")
            if not task_type:
                return jsonify({"status": "error", "message": "Missing task_type."}), 400
            return jsonify(engine.evaluate(task_type)), 200
        except FileNotFoundError as e:
            return jsonify({"status": "error", "message": str(e)}), 404
        except Exception as e:
            return jsonify({"status": "error", "message": str(e)}), 400

    return bp
