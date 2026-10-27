# Task 2.2 — Dataset Validation

**Jira:** SCRUM-17  
**Sprint:** Sprint 2  
**Feature:** Validate file type and size; handle empty, malformed, and invalid CSV files.

## Scope

A self-contained validation layer that sits between the upload (Task 2.1) and the preview / statistics features (Tasks 2.3 / 2.4). Nothing is stored or analysed until the dataset passes validation.

| Requirement (from ticket) | How it is handled | Error code |
|---|---|---|
| File type | Only `.csv` (last extension wins, case-insensitive); wrong MIME types rejected; Excel/PDF/image files renamed to `.csv` are detected | `INVALID_FILE_TYPE`, `INVALID_MIME_TYPE`, `NOT_A_TEXT_FILE` |
| File size | Max 10 MB (same limit as 2.1). Oversized request bodies are also refused by Flask (HTTP 413) | `FILE_TOO_LARGE` |
| Empty files | 0-byte file, whitespace-only file, header-only file | `EMPTY_FILE`, `EMPTY_CONTENT`, `NO_DATA_ROWS` |
| Malformed CSV | Unclosed / misplaced quotes, rows with too many or too few fields (row numbers reported) | `MALFORMED_CSV`, `INCONSISTENT_ROW_LENGTH` |
| Invalid CSV | Non-UTF-8 encoding, non-comma delimiters (`;`, tab, `\|`), blank or duplicate column names | `INVALID_ENCODING`, `UNSUPPORTED_DELIMITER`, `BLANK_HEADER`, `DUPLICATE_HEADER` |

**Non-fatal warnings** (file is still accepted): blank lines (ignored), empty columns, a single column, an all-numeric header row (header may be missing), and cells that start with `=`, `@`, `+` or `-` (spreadsheet formula injection).

A UTF-8 BOM (common in Excel exports) is accepted and stripped.

## Structure

```
Task-2.2_Dataset-Validation/
├── backend/
│   ├── dataset_validator.py        # validation engine (pure Python, no Flask)
│   ├── safe_storage.py             # Task 2.1 storage, now validate-then-save
│   ├── server.py                   # Flask API
│   ├── requirements.txt
│   └── tests/test_dataset_validator.py   # 48 tests
├── frontend/
│   └── src/
│       ├── components/DatasetValidation.jsx   # reusable UI component
│       ├── utils/clientPrecheck.js            # instant type/size/empty checks
│       ├── utils/clientPrecheck.test.js       # 8 tests
│       └── App.jsx                            # standalone demo
├── sample-data/                    # one file per failure mode + valid files
├── TEST-PLAN.md
└── INTEGRATION_GUIDE.md
```

## Run locally

**Backend** (Python 3.10+)

```bash
cd backend
pip install -r requirements.txt
python server.py          # http://127.0.0.1:5000
```

**Frontend** (Node 20+)

```bash
cd frontend
npm install
npm run dev               # http://localhost:5173
```

Select any file from `sample-data/` in the demo page to see the result.

## Quality checks

```bash
cd backend  && python -m unittest discover -s tests -v
cd frontend && npm test && npm run lint && npm run build
```

## API

### `POST /api/validate-dataset`
`multipart/form-data` with a `file` field. Validates without storing. Returns **200** with a report whenever validation ran (check `valid`); **400** only if no file was sent; **413** if the body is far over the limit.

### `POST /api/upload-dataset`
Validates, then stores the file. Valid → **201** with the Task 2.1 metadata (`file_id`, `stored_name`, `file_size_kb`, `columns`, `row_count`) plus `validation`. Invalid → **422** with the report; **nothing is written to disk**.

### Report shape

```json
{
  "valid": false,
  "errors":   [{ "code": "INCONSISTENT_ROW_LENGTH", "message": "Line 3 has 2 field(s) but the header defines 3.", "row": 3 }],
  "warnings": [{ "code": "BLANK_ROWS", "message": "1 blank line(s) were found and will be ignored.", "count": 1 }],
  "summary":  { "file_name": "x.csv", "file_size_bytes": 42, "encoding": "utf-8", "delimiter": ",",
                "row_count": 2, "column_count": 3, "columns": ["a", "b", "c"] }
}
```

## Design decisions / limitations

- **Server is the authority.** The browser pre-check only gives instant feedback; it is never trusted.
- **Comma-delimited only**, matching the rest of the project. Semicolon/tab files get a clear message instead of silently parsing as one column.
- **UTF-8 only.** Latin-1 / Windows-1252 files are rejected with instructions rather than guessed at.
- Row-level errors are capped at 10 per file (plus a "N more" line) to keep responses small.
- Missing values (empty cells) are **not** errors; Task 2.4 reports them.
- The whole file (≤ 10 MB) is read into memory; for larger limits switch to streaming.
- The `file_path` field from Task 2.1's response is intentionally removed so server filesystem paths are never exposed (per Task 2.4's integration notes).
