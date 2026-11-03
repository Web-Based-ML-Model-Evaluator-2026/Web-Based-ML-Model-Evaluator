"""
TASK 5.3: Flask blueprint for saving and retrieving the user's preferred model.

Register in the Task 5.2 server.py (port 5001) with:
    from preferred_model_routes import create_preferred_model_blueprint
    app.register_blueprint(create_preferred_model_blueprint())

Endpoints (all under /api/preferred-model):
    GET     ?project_id=...&task_type=...   -> saved preference, or null if none yet
    PUT     JSON body                       -> save / replace the preference
    DELETE  ?project_id=...&task_type=...   -> clear the preference
"""
from flask import Blueprint, request, jsonify
from preferred_model_store import PreferredModelStore, ValidationError


def create_preferred_model_blueprint(db_path="data/preferred_models.db"):
    bp = Blueprint("preferred_model", __name__)
    store = PreferredModelStore(db_path=db_path)

    @bp.route("/api/preferred-model", methods=["GET"])
    def get_preferred_model():
        try:
            record = store.get(request.args.get("project_id"), request.args.get("task_type"))
            return jsonify({"status": "success", "preferred_model": record}), 200
        except ValidationError as e:
            return jsonify({"status": "error", "message": str(e)}), 400

    @bp.route("/api/preferred-model", methods=["PUT"])
    def save_preferred_model():
        data = request.get_json(silent=True)
        if not isinstance(data, dict):
            return jsonify({"status": "error", "message": "No JSON payload provided."}), 400
        try:
            record = store.save(
                project_id=data.get("project_id"),
                task_type=data.get("task_type"),
                model_name=data.get("model_name"),
                metrics=data.get("metrics"),
                hyperparameters=data.get("hyperparameters"),
            )
            return jsonify({"status": "success", "preferred_model": record}), 200
        except ValidationError as e:
            return jsonify({"status": "error", "message": str(e)}), 400

    @bp.route("/api/preferred-model", methods=["DELETE"])
    def clear_preferred_model():
        try:
            removed = store.delete(request.args.get("project_id"), request.args.get("task_type"))
        except ValidationError as e:
            return jsonify({"status": "error", "message": str(e)}), 400
        if not removed:
            return jsonify({"status": "error", "message": "No preferred model is saved for this project."}), 404
        return jsonify({"status": "success", "preferred_model": None}), 200

    return bp
