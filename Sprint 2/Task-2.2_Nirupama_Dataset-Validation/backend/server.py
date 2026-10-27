from flask import Flask, request, jsonify
from flask_cors import CORS

from dataset_validator import validate_uploaded_file, MAX_FILE_SIZE
from safe_storage import validate_and_save_file, DatasetValidationError

app = Flask(__name__)
# Allow the Vite dev server (port 5173) to call this API (port 5000)
CORS(app)
# Reject absurdly large request bodies before they are buffered
app.config['MAX_CONTENT_LENGTH'] = MAX_FILE_SIZE + 1024 * 1024


@app.errorhandler(413)
def too_large(_err):
    return jsonify({
        "valid": False,
        "errors": [{"code": "FILE_TOO_LARGE",
                    "message": "The file exceeds the 10 MB size limit."}],
        "warnings": [],
        "summary": None,
    }), 413


@app.route('/api/validate-dataset', methods=['POST'])
def validate_dataset():
    """
    Validate a CSV without storing it.
    Returns 200 with a report for any completed validation (check `valid`),
    400 only when no file was sent at all.
    """
    if 'file' not in request.files:
        return jsonify({"error": "No file received in request."}), 400
    report = validate_uploaded_file(request.files['file'])
    return jsonify(report), 200


@app.route('/api/upload-dataset', methods=['POST'])
def upload_dataset():
    """
    Validate then store a CSV (replaces Task 2.1's upload endpoint once
    integrated). Invalid datasets are never written to disk and return
    HTTP 422 with the full validation report.
    """
    if 'file' not in request.files:
        return jsonify({"error": "No file received in request."}), 400
    try:
        return jsonify(validate_and_save_file(request.files['file'])), 201
    except DatasetValidationError as e:
        return jsonify(e.report), 422
    except Exception as e:  # noqa: BLE001 - last-resort handler
        return jsonify({"error": f"Internal storage failure: {e}"}), 500


if __name__ == '__main__':
    print("Dataset Validation API running on http://127.0.0.1:5000")
    app.run(port=5000, debug=True)
