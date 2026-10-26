import os
import uuid
from werkzeug.utils import secure_filename

# -----------------------------------------------------------------
# STORAGE CONFIGURATION
# -----------------------------------------------------------------
# Define a dedicated, isolated directory for stored CSVs
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), 'uploads')
os.makedirs(UPLOAD_DIR, exist_ok=True)

# 10 MB system boundary limit in bytes
MAX_FILE_SIZE = 10 * 1024 * 1024


def sanitize_and_save_file(uploaded_file):
    """
    Safely stores uploaded CSV files:
    1. Validates file extension and size.
    2. Strips harmful path characters to prevent directory traversal attacks.
    3. Prefixes with a unique UUID to prevent overwriting existing files.
    4. Extracts dimensions and headers for downstream teammate tasks.
    """
    original_name = uploaded_file.filename

    # Guard 1: Verify file extension
    if not original_name or not original_name.lower().endswith('.csv'):
        raise ValueError("Invalid file format. Only .csv files are permitted.")

    # Guard 2: Path traversal sanitization (removes '../', '/', and non-ASCII chars)
    clean_name = secure_filename(original_name)
    if not clean_name:
        clean_name = "dataset.csv"

    # Guard 3: Collision-proof unique identifier
    unique_prefix = uuid.uuid4().hex[:12]
    safe_stored_name = f"{unique_prefix}_{clean_name}"
    target_path = os.path.join(UPLOAD_DIR, safe_stored_name)

    # Guard 4: File size boundary check
    uploaded_file.seek(0, os.SEEK_END)
    size_bytes = uploaded_file.tell()
    uploaded_file.seek(0)  # Reset pointer to start

    if size_bytes == 0:
        raise ValueError("The selected CSV file is empty (0 bytes).")
    if size_bytes > MAX_FILE_SIZE:
        raise ValueError("File exceeds maximum allowed size of 10 MB.")

    # Write the sanitized file safely to disk
    uploaded_file.save(target_path)

    # -----------------------------------------------------------------
    # METADATA EXTRACTION FOR SPRINT 2 HANDOFF
    # -----------------------------------------------------------------
    row_count = 0
    column_names = []

    # Read header and line count safely with utf-8 encoding
    with open(target_path, 'r', encoding='utf-8', errors='replace') as f:
        header_line = f.readline()
        if header_line:
            column_names = [col.strip().strip('"') for col in header_line.split(',')]
        # Count remaining data rows
        row_count = sum(1 for _ in f)

    # Return structured metadata for API response
    return {
        "status": "success",
        "file_id": unique_prefix,
        "original_name": original_name,
        "stored_name": safe_stored_name,
        "file_path": target_path,
        "file_size_kb": round(size_bytes / 1024, 2),
        "columns": column_names,
        "row_count": row_count
    }