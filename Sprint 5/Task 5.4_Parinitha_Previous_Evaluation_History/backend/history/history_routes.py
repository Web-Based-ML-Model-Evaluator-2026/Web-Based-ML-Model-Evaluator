from flask import Blueprint, current_app, jsonify, request
from .history_service import HistoryService, HistoryNotFoundError
from backend.security.auth import require_api_key
from backend.security.validators import validate_history_payload, parse_pagination

history_blueprint = Blueprint("evaluation_history", __name__, url_prefix="/api/history")
def service(): return HistoryService(current_app.config["DATABASE_PATH"])

@history_blueprint.post("")
@require_api_key
def create():
    payload = request.get_json(silent=True)
    errors = validate_history_payload(payload)
    if errors: return jsonify({"error":"Invalid payload","details":errors}), 400
    return jsonify({"message":"Evaluation saved","evaluation":service().save(payload)}), 201

@history_blueprint.get("")
@require_api_key
def listing():
    page, error = parse_pagination(request.args)
    if error: return jsonify({"error":error}), 400
    records = service().list(**page)
    return jsonify({"count":len(records),"evaluations":records}), 200

@history_blueprint.get("/<int:record_id>")
@require_api_key
def detail(record_id):
    try: return jsonify({"evaluation":service().get(record_id)}), 200
    except HistoryNotFoundError as exc: return jsonify({"error":str(exc)}), 404

@history_blueprint.delete("/<int:record_id>")
@require_api_key
def remove(record_id):
    try:
        service().delete(record_id)
        return jsonify({"message":"Evaluation deleted"}), 200
    except HistoryNotFoundError as exc: return jsonify({"error":str(exc)}), 404
