"""
Task 2.2 - Dataset Validation engine (SCRUM-17).

Validates an uploaded CSV *before* it is stored or used by the preview (2.3)
and statistics (2.4) features. Pure Python, standard library only, so it can
be unit-tested without Flask.

Checks performed, in order (the first fatal problem stops later checks that
depend on it):
  1. File type      - .csv extension, allowed MIME type, not a renamed binary
  2. File size      - empty (0 bytes) and > 10 MB
  3. Encoding       - must be UTF-8 (a UTF-8 BOM is accepted and stripped)
  4. Empty content  - whitespace-only file, header-only file (no data rows)
  5. Structure      - delimiter, unclosed quotes (malformed CSV), ragged rows
  6. Header         - blank / duplicate column names
  7. Warnings       - non-fatal issues (blank rows, empty columns, one column,
                      header that looks like data, spreadsheet-formula cells)

Result shape (always returned, never raises for bad user input):
  {
    "valid": bool,
    "errors":   [ {"code", "message", "row"?, "column"?} ],
    "warnings": [ {"code", "message", ...} ],
    "summary":  { "file_name", "file_size_bytes", "encoding", "delimiter",
                  "row_count", "column_count", "columns" }
  }
"""
import csv
import io
import os

# -----------------------------------------------------------------
# CONFIGURATION
# -----------------------------------------------------------------
MAX_FILE_SIZE = 10 * 1024 * 1024          # 10 MB, same limit as Task 2.1
ALLOWED_EXTENSIONS = {".csv"}
# Browsers/OSes report many MIME types for .csv files (Windows + Excel often
# send application/vnd.ms-excel), so the extension is the primary check and
# the MIME type only rejects clearly wrong types.
ALLOWED_MIME_TYPES = {
    "text/csv",
    "application/csv",
    "application/vnd.ms-excel",
    "text/plain",
    "application/octet-stream",
    "",
    None,
}
MAX_REPORTED_ROW_ERRORS = 10               # cap listed row-level errors
MAX_COLUMNS = 1000
CANDIDATE_DELIMITERS = [",", ";", "\t", "|"]
# Leading bytes of common non-text formats that are often renamed to .csv
BINARY_SIGNATURES = {
    b"PK\x03\x04": "an Excel/ZIP file",
    b"%PDF": "a PDF file",
    b"\xd0\xcf\x11\xe0": "a legacy Excel (.xls) file",
    b"\x89PNG": "an image file",
    b"\xff\xd8\xff": "an image file",
    b"GIF8": "an image file",
}


# -----------------------------------------------------------------
# HELPERS
# -----------------------------------------------------------------
def _issue(code, message, **extra):
    item = {"code": code, "message": message}
    item.update(extra)
    return item


def _detect_delimiter(text):
    """Pick the candidate delimiter that appears most consistently in the
    first lines of the file. Falls back to a comma."""
    lines = [ln for ln in text.splitlines()[:20] if ln.strip()]
    if not lines:
        return ","
    best, best_score = ",", -1
    for delim in CANDIDATE_DELIMITERS:
        counts = [ln.count(delim) for ln in lines]
        if counts[0] == 0:
            continue
        # Score: delimiter is present in the header and rows agree with it
        consistent = sum(1 for c in counts if c == counts[0])
        score = consistent * 1000 + counts[0]
        if score > best_score:
            best, best_score = delim, score
    return best


def _looks_numeric(value):
    try:
        float(value.replace(",", ""))
        return True
    except ValueError:
        return False


def _is_formula_like(cell):
    """CSV/formula-injection check: cells a spreadsheet would execute."""
    cell = cell.strip()
    if not cell:
        return False
    if cell[0] in ("=", "@"):
        return True
    if cell[0] in ("+", "-") and len(cell) > 1 and not _looks_numeric(cell):
        return True
    return False


def _result(file_name, size, errors, warnings, encoding=None, delimiter=None,
            row_count=0, columns=None):
    columns = columns or []
    return {
        "valid": len(errors) == 0,
        "errors": errors,
        "warnings": warnings,
        "summary": {
            "file_name": file_name,
            "file_size_bytes": size,
            "encoding": encoding,
            "delimiter": delimiter,
            "row_count": row_count,
            "column_count": len(columns),
            "columns": columns,
        },
    }


# -----------------------------------------------------------------
# MAIN ENTRY POINT
# -----------------------------------------------------------------
def validate_csv_bytes(data, filename, content_type=None):
    """Validate raw upload bytes. Never raises for bad input; every problem is
    returned as an entry in `errors` (fatal) or `warnings` (non-fatal)."""
    errors, warnings = [], []
    size = len(data)
    name = filename or ""

    # ---- 1. FILE TYPE ------------------------------------------------
    ext = os.path.splitext(name)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        errors.append(_issue(
            "INVALID_FILE_TYPE",
            "Invalid file type. Only .csv files are supported"
            + (f" (received '{ext}')." if ext else " (the file has no extension).")))
        return _result(name, size, errors, warnings)

    mime = (content_type or "").split(";")[0].strip().lower() or None
    if mime not in ALLOWED_MIME_TYPES:
        errors.append(_issue(
            "INVALID_MIME_TYPE",
            f"The file's content type '{mime}' is not a CSV type."))
        return _result(name, size, errors, warnings)

    # ---- 2. FILE SIZE ------------------------------------------------
    if size == 0:
        errors.append(_issue("EMPTY_FILE", "The file is empty (0 bytes)."))
        return _result(name, size, errors, warnings)
    if size > MAX_FILE_SIZE:
        errors.append(_issue(
            "FILE_TOO_LARGE",
            f"The file exceeds the {MAX_FILE_SIZE // (1024 * 1024)} MB size limit."))
        return _result(name, size, errors, warnings)

    # ---- 3. ENCODING / BINARY CONTENT --------------------------------
    for signature, label in BINARY_SIGNATURES.items():
        if data.startswith(signature):
            errors.append(_issue(
                "NOT_A_TEXT_FILE",
                f"This looks like {label} renamed to .csv. Export it as a "
                "real CSV (comma-separated text) and try again."))
            return _result(name, size, errors, warnings)
    if b"\x00" in data:
        errors.append(_issue(
            "NOT_A_TEXT_FILE",
            "The file contains binary data and is not a valid text CSV."))
        return _result(name, size, errors, warnings)

    try:
        text = data.decode("utf-8-sig")   # strips a UTF-8 BOM if present
        encoding = "utf-8"
    except UnicodeDecodeError as exc:
        errors.append(_issue(
            "INVALID_ENCODING",
            "The file is not valid UTF-8 text (invalid byte at position "
            f"{exc.start}). Re-save the CSV with UTF-8 encoding."))
        return _result(name, size, errors, warnings)

    # ---- 4. EMPTY CONTENT --------------------------------------------
    if not text.strip():
        errors.append(_issue(
            "EMPTY_CONTENT", "The file contains only whitespace and no data."))
        return _result(name, size, errors, warnings, encoding=encoding)

    # ---- 5. STRUCTURE: DELIMITER + PARSE ------------------------------
    delimiter = _detect_delimiter(text)
    if delimiter != ",":
        shown = "tab" if delimiter == "\t" else f"'{delimiter}'"
        errors.append(_issue(
            "UNSUPPORTED_DELIMITER",
            f"The file appears to be {shown}-delimited. Only comma-separated "
            "CSV files are supported."))
        return _result(name, size, errors, warnings,
                       encoding=encoding, delimiter=delimiter)

    rows = []
    try:
        reader = csv.reader(io.StringIO(text, newline=""),
                            delimiter=delimiter, strict=True)
        for record in reader:
            rows.append((reader.line_num, record))
    except csv.Error as exc:
        errors.append(_issue(
            "MALFORMED_CSV",
            f"The CSV is malformed near line {reader.line_num}: {exc}. "
            "Check for unclosed or stray quotation marks.",
            row=reader.line_num))
        return _result(name, size, errors, warnings,
                       encoding=encoding, delimiter=delimiter)

    # Drop fully blank lines (warn about them below)
    non_blank = [(ln, rec) for ln, rec in rows if any(c.strip() for c in rec)]
    blank_lines = len(rows) - len(non_blank)

    if not non_blank:
        errors.append(_issue(
            "EMPTY_CONTENT", "The file contains no readable data."))
        return _result(name, size, errors, warnings,
                       encoding=encoding, delimiter=delimiter)

    header_line, header = non_blank[0]
    data_rows = non_blank[1:]
    columns = [h.strip() for h in header]

    # ---- 6. HEADER CHECKS --------------------------------------------
    if len(columns) > MAX_COLUMNS:
        errors.append(_issue(
            "TOO_MANY_COLUMNS",
            f"The file has {len(columns)} columns; the maximum is {MAX_COLUMNS}."))
        return _result(name, size, errors, warnings, encoding, delimiter)

    blank_cols = [i + 1 for i, c in enumerate(columns) if not c]
    if blank_cols:
        errors.append(_issue(
            "BLANK_HEADER",
            "Column name is blank for column position(s): "
            + ", ".join(map(str, blank_cols[:10]))
            + (" ..." if len(blank_cols) > 10 else "") + ".",
            row=header_line))

    seen, dupes = {}, []
    for c in columns:
        if not c:
            continue
        key = c.lower()
        seen[key] = seen.get(key, 0) + 1
    dupes = sorted({c for c in columns if c and seen[c.lower()] > 1})
    if dupes:
        errors.append(_issue(
            "DUPLICATE_HEADER",
            "Duplicate column names found: " + ", ".join(dupes[:10]) + ".",
            row=header_line))

    # ---- RAGGED ROWS ---------------------------------------------------
    expected = len(columns)
    ragged = [(ln, len(rec)) for ln, rec in data_rows if len(rec) != expected]
    if ragged:
        for ln, found in ragged[:MAX_REPORTED_ROW_ERRORS]:
            errors.append(_issue(
                "INCONSISTENT_ROW_LENGTH",
                f"Line {ln} has {found} field(s) but the header defines "
                f"{expected}.", row=ln))
        if len(ragged) > MAX_REPORTED_ROW_ERRORS:
            errors.append(_issue(
                "INCONSISTENT_ROW_LENGTH",
                f"...and {len(ragged) - MAX_REPORTED_ROW_ERRORS} more rows "
                "with the wrong number of fields."))

    # ---- NO DATA ROWS ----------------------------------------------------
    if not data_rows:
        errors.append(_issue(
            "NO_DATA_ROWS",
            "The file only contains a header row and no data rows."))

    if errors:
        return _result(name, size, errors, warnings, encoding, delimiter,
                       row_count=len(data_rows), columns=columns)

    # ---- 7. WARNINGS (file is usable) --------------------------------
    if blank_lines:
        warnings.append(_issue(
            "BLANK_ROWS",
            f"{blank_lines} blank line(s) were found and will be ignored.",
            count=blank_lines))

    if expected == 1:
        warnings.append(_issue(
            "SINGLE_COLUMN",
            "The dataset has only one column. Model evaluation normally "
            "needs feature columns plus a target column."))

    if header and all(_looks_numeric(c) for c in columns if c):
        warnings.append(_issue(
            "HEADER_LOOKS_LIKE_DATA",
            "Every column name is numeric, so the first row may be data "
            "rather than a header."))

    empty_cols = [
        columns[i] for i in range(expected)
        if all(not rec[i].strip() for _, rec in data_rows)
    ]
    if empty_cols:
        warnings.append(_issue(
            "EMPTY_COLUMNS",
            "Column(s) with no values: " + ", ".join(empty_cols[:10]) + ".",
            columns=empty_cols))

    formula_cells = sum(
        1 for _, rec in data_rows for cell in rec if _is_formula_like(cell))
    if formula_cells:
        warnings.append(_issue(
            "FORMULA_CELLS",
            f"{formula_cells} cell(s) start with =, +, - or @ and could run "
            "as formulas if the file is opened in a spreadsheet.",
            count=formula_cells))

    return _result(name, size, errors, warnings, encoding, delimiter,
                   row_count=len(data_rows), columns=columns)


def validate_uploaded_file(uploaded_file):
    """Validate a werkzeug FileStorage object (what Flask gives us).
    Reads at most MAX_FILE_SIZE + 1 bytes so an oversized upload is never
    fully loaded into memory."""
    uploaded_file.stream.seek(0)
    data = uploaded_file.stream.read(MAX_FILE_SIZE + 1)
    uploaded_file.stream.seek(0)
    report = validate_csv_bytes(
        data, uploaded_file.filename, uploaded_file.mimetype)
    return report
