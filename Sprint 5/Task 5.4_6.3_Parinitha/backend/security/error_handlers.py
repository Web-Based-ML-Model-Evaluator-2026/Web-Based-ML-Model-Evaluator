from flask import jsonify
from werkzeug.exceptions import HTTPException
def register_error_handlers(app):
    @app.errorhandler(HTTPException)
    def http_error(error):
        return jsonify({"error":error.description}),error.code
    @app.errorhandler(Exception)
    def unexpected_error(error):
        app.logger.exception("Unhandled application error")
        return jsonify({"error":"An unexpected server error occurred."}),500
