from functools import wraps
from hmac import compare_digest
from flask import current_app, jsonify, request

def require_api_key(view):
    @wraps(view)
    def wrapped(*args, **kwargs):
        expected = current_app.config.get("API_ACCESS_KEY")
        if expected:
            supplied = request.headers.get("X-API-Key", "")
            if not supplied or not compare_digest(supplied, expected):
                return jsonify({"error":"Authentication required."}), 401
        return view(*args, **kwargs)
    return wrapped
