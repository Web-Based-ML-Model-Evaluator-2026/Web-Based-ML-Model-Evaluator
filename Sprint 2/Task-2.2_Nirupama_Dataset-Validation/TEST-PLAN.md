# Task 2.2 — Test Plan

## Automated tests
- **Backend:** `cd backend && python -m unittest discover -s tests -v` — 48 tests covering file type, size boundaries, encoding, empty content, malformed CSV, header checks, warnings, report shape, a fuzz test with random bytes, and the Flask endpoints (including "invalid upload is never stored" and path-traversal filenames).
- **Frontend:** `cd frontend && npm test` — 8 tests for the client pre-check.

## Manual tests (use files in `sample-data/`)

| ID | File | Expected result |
|---|---|---|
| TC-2.2-01 | `valid.csv` | Green "Dataset is valid", 6 rows / 5 columns, Continue enabled |
| TC-2.2-02 | `valid-with-warnings.csv` | Valid, with 3 amber warnings (blank rows, empty column, formula cells), Continue enabled |
| TC-2.2-03 | `not-a-csv.txt` | Red error: invalid file type, Continue disabled |
| TC-2.2-04 | `empty.csv` (0 bytes) | Red error: file is empty |
| TC-2.2-05 | `header-only.csv` | Red error: no data rows |
| TC-2.2-06 | `malformed-unclosed-quote.csv` | Red error: malformed CSV with line number |
| TC-2.2-07 | `ragged-rows.csv` | Two errors naming lines 3 and 4 |
| TC-2.2-08 | `wrong-delimiter.csv` | Red error: semicolon-delimited not supported |
| TC-2.2-09 | `duplicate-headers.csv` | Red error listing `score` |
| TC-2.2-10 | `blank-header.csv` | Red error naming column position 2 |
| TC-2.2-11 | `invalid-encoding.csv` | Red error: not valid UTF-8 |
| TC-2.2-12 | Rename an `.xlsx` to `.csv` | Red error: looks like an Excel/ZIP file |
| TC-2.2-13 | CSV larger than 10 MB | Red error: exceeds 10 MB limit |
| TC-2.2-14 | Stop the backend, select any `.csv` | Red error: could not reach the validation server |
| TC-2.2-15 | Select file A, then quickly file B | Only B's result is shown (no stale result) |
| TC-2.2-16 | Upload invalid file via `/api/upload-dataset` | HTTP 422, `backend/uploads/` unchanged |

## Acceptance criteria
- Invalid type, oversized, empty, malformed and invalid CSVs are rejected with a specific, human-readable message.
- Valid files (with or without warnings) are accepted.
- Invalid files are never stored.
- The validator never crashes on arbitrary input.
- All automated tests, `npm run lint` and `npm run build` pass.
