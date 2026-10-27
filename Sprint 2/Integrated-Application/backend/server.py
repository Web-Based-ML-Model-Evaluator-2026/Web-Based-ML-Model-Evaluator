"""Unified Sprint 2 API: validated CSV upload, safe storage and preview."""
import csv
import os
import re
from flask import Flask, jsonify, request
from flask_cors import CORS
from dataset_validator import validate_uploaded_file, MAX_FILE_SIZE
from safe_storage import validate_and_save_file, DatasetValidationError, UPLOAD_DIR

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": ["http://127.0.0.1:5173", "http://localhost:5173"]}})
app.config["MAX_CONTENT_LENGTH"] = MAX_FILE_SIZE + 1024 * 1024

@app.errorhandler(413)
def too_large(_err):
    return jsonify({"valid": False, "errors": [{"code": "FILE_TOO_LARGE", "message": "The file exceeds the 10 MB size limit."}], "warnings": [], "summary": None}), 413

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "sprint-2-integrated-api"})

@app.route("/api/validate-dataset", methods=["POST"])
def validate_dataset():
    if "file" not in request.files:
        return jsonify({"error": "No file received in request."}), 400
    report = validate_uploaded_file(request.files["file"])
    return jsonify(report), 200

@app.route("/api/upload-dataset", methods=["POST"])
def upload_dataset():
    if "file" not in request.files:
        return jsonify({"error": "No file received in request."}), 400
    try:
        result = validate_and_save_file(request.files["file"])
        # Deliberately do not expose server filesystem paths.
        return jsonify(result), 201
    except DatasetValidationError as exc:
        return jsonify(exc.report), 422
    except Exception:
        app.logger.exception("Dataset upload failed")
        return jsonify({"error": "The server could not store this dataset."}), 500

def _resolve_stored_dataset(file_id):
    # IDs are opaque 12-character hex prefixes; never accept a browser path.
    if not re.fullmatch(r"[a-f0-9]{12}", file_id or ""):
        return None
    try:
        names = os.listdir(UPLOAD_DIR)
    except OSError:
        return None
    matches = [name for name in names if name.startswith(file_id + "_") and name.lower().endswith(".csv")]
    if len(matches) != 1:
        return None
    path = os.path.realpath(os.path.join(UPLOAD_DIR, matches[0]))
    if os.path.commonpath([os.path.realpath(UPLOAD_DIR), path]) != os.path.realpath(UPLOAD_DIR):
        return None
    return matches[0], path

@app.route("/api/datasets/<file_id>/preview", methods=["GET"])
def dataset_preview(file_id):
    stored = _resolve_stored_dataset(file_id)
    if not stored:
        return jsonify({"error": "Dataset not found. Upload a valid CSV first."}), 404
    stored_name, path = stored
    try:
        with open(path, "r", encoding="utf-8-sig", newline="") as stream:
            reader = csv.DictReader(stream, strict=True)
            columns = reader.fieldnames or []
            # Validation already limits file size to 10 MB; still cap preview rows.
            rows = []
            total_rows = 0
            for row in reader:
                total_rows += 1
                if len(rows) < 10:
                    rows.append(row)
        return jsonify({
            "datasetId": file_id,
            "name": stored_name[13:] if len(stored_name) > 13 else stored_name,
            "filename": stored_name[13:] if len(stored_name) > 13 else stored_name,
            "storedName": stored_name,
            "columns": columns,
            "rows": rows,
            "totalRows": total_rows,
            "totalColumns": len(columns),
            "previewLimit": 10,
        })
    except (OSError, UnicodeError, csv.Error):
        app.logger.exception("Dataset preview failed")
        return jsonify({"error": "The stored dataset could not be parsed for preview."}), 500

if __name__ == "__main__":
    print("Sprint 2 integrated API running at http://127.0.0.1:5000")
    app.run(host="127.0.0.1", port=5000, debug=False)
