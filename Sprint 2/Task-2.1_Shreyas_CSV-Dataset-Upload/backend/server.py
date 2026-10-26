from flask import Flask, request, jsonify
from flask_cors import CORS
from safe_storage import sanitize_and_save_file

# Initialize the Flask application
app = Flask(__name__)

# Enable Cross-Origin Resource Sharing (CORS) so Vite (port 5173) can communicate with Flask (port 5000)
CORS(app)


@app.route('/api/upload-dataset', methods=['POST'])
def upload_dataset():
    """
    HTTP POST Endpoint: Receives multipart/form-data containing the CSV file.
    Delegates validation, sanitization, and isolated saving to safe_storage.py.
    """
    # Verify that a file was sent in the request payload
    if 'file' not in request.files:
        return jsonify({"error": "No file received in request."}), 400

    file = request.files['file']

    try:
        # Run the sanitization and storage engine
        result = sanitize_and_save_file(file)
        return jsonify(result), 201

    except ValueError as e:
        # Return client-side / input validation errors (HTTP 400 Bad Request)
        return jsonify({"error": str(e)}), 400

    except Exception as e:
        # Return internal server errors (HTTP 500 Internal Server Error)
        return jsonify({"error": f"Internal safe storage failure: {str(e)}"}), 500


# Application entry point
if __name__ == '__main__':
    print("Safe Storage API running on http://127.0.0.1:5000")
    app.run(port=5000, debug=True)