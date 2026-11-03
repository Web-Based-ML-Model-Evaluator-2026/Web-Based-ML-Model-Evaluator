import os
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
class Config:
    DATABASE_PATH = os.getenv("EVALUATION_HISTORY_DB", str(ROOT / "evaluation_history.sqlite3"))
    MAX_CONTENT_LENGTH = int(os.getenv("MAX_UPLOAD_BYTES", 5 * 1024 * 1024))
    API_ACCESS_KEY = os.getenv("API_ACCESS_KEY")
