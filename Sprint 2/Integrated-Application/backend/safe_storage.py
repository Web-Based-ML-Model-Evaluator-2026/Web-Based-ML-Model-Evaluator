import os
import uuid
from werkzeug.utils import secure_filename

from dataset_validator import validate_uploaded_file

# Isolated directory for stored CSVs (same layout as Task 2.1)
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), 'uploads')
os.makedirs(UPLOAD_DIR, exist_ok=True)


class DatasetValidationError(Exception):
    """Raised when an upload fails validation. Carries the full report."""

    def __init__(self, report):
        super().__init__("Dataset validation failed.")
        self.report = report


def validate_and_save_file(uploaded_file):
    """
    Task 2.2 integration point for Task 2.1's storage layer:
    1. Runs the full validation engine (type, size, encoding, structure).
    2. Only if the dataset is valid, saves it under a UUID-prefixed,
       sanitized name (no path traversal, no overwrites).
    3. Returns the same metadata shape as Task 2.1, plus the validation
       report, using the parsed row/column counts (not naive line splitting).
    """
    report = validate_uploaded_file(uploaded_file)
    if not report["valid"]:
        raise DatasetValidationError(report)

    clean_name = secure_filename(uploaded_file.filename) or "dataset.csv"
    unique_prefix = uuid.uuid4().hex[:12]
    stored_name = f"{unique_prefix}_{clean_name}"
    target_path = os.path.join(UPLOAD_DIR, stored_name)
    uploaded_file.save(target_path)

    summary = report["summary"]
    return {
        "status": "success",
        "file_id": unique_prefix,
        "original_name": uploaded_file.filename,
        "stored_name": stored_name,
        "file_size_kb": round(summary["file_size_bytes"] / 1024, 2),
        "columns": summary["columns"],
        "row_count": summary["row_count"],
        "validation": report,
    }
