import sqlite3
from pathlib import Path
from contextlib import contextmanager

SCHEMA = """
CREATE TABLE IF NOT EXISTS evaluation_history (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 project_id TEXT, task_type TEXT NOT NULL, dataset_name TEXT,
 model_name TEXT NOT NULL, metrics_json TEXT NOT NULL,
 hyperparameters_json TEXT NOT NULL DEFAULT '{}', summary TEXT,
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_history_created ON evaluation_history(created_at DESC);
"""
def initialize_database(path):
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(path) as db:
        db.executescript(SCHEMA)
@contextmanager
def database_connection(path):
    initialize_database(path)
    db = sqlite3.connect(path)
    db.row_factory = sqlite3.Row
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
