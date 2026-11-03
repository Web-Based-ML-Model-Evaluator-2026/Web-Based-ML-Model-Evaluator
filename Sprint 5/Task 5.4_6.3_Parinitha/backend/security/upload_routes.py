from flask import Blueprint, jsonify, request
from .auth import require_api_key
from .validators import validate_csv_upload
upload_blueprint = Blueprint("secure_upload",__name__,url_prefix="/api/security")
@upload_blueprint.post("/validate-csv")
@require_api_key
def validate_csv():
    valid,message = validate_csv_upload(request.files.get("file"))
    if not valid: return jsonify({"error":message}),400
    return jsonify({"message":"CSV passed basic upload validation."}),200
