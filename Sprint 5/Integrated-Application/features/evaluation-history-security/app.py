
import os
from flask import Flask
from backend.config import Config
from backend.database import initialize_database
from backend.history.history_routes import history_blueprint
from backend.security.upload_routes import upload_blueprint
from backend.security.error_handlers import register_error_handlers

app = Flask(__name__)
app.config.from_object(Config)

initialize_database(app.config["DATABASE_PATH"])

app.register_blueprint(history_blueprint)
app.register_blueprint(upload_blueprint)

register_error_handlers(app)

@app.route("/")
def home():
    return {"message": "Sprint 5.4 and 6.3 Backend is running!"}

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5002, debug=True)
