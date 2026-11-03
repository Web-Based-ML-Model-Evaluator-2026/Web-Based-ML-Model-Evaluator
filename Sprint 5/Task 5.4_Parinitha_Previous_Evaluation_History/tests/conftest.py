import pytest
from flask import Flask
from backend.database import initialize_database
from backend.history.history_routes import history_blueprint
from backend.security.upload_routes import upload_blueprint
from backend.security.error_handlers import register_error_handlers
@pytest.fixture
def app(tmp_path):
    app=Flask(__name__)
    app.config.update(TESTING=True,DATABASE_PATH=str(tmp_path/"test.sqlite3"),API_ACCESS_KEY=None)
    initialize_database(app.config["DATABASE_PATH"])
    app.register_blueprint(history_blueprint)
    app.register_blueprint(upload_blueprint)
    register_error_handlers(app)
    return app
@pytest.fixture
def client(app): return app.test_client()
