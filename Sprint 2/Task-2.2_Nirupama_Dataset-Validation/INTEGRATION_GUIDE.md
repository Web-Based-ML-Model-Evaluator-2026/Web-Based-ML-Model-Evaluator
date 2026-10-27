# Integration guide — Task 2.2

## Keep the feature isolated until integration
This folder is an independent Task 2.2 deliverable and does not modify Task 2.1, 2.3 or 2.4.

## Backend (merge into Task 2.1's `backend/`)
1. Copy `dataset_validator.py` into the shared backend folder.
2. Replace `safe_storage.py` with this folder's version (same storage layout and UUID naming; it now validates first and no longer returns `file_path`).
3. Add the `/api/validate-dataset` route, the `422` handling in `/api/upload-dataset`, and the `MAX_CONTENT_LENGTH` / 413 handler from `server.py`.

Frontend callers of the old upload endpoint must handle **422**: the body is a validation report (`valid`, `errors`, `warnings`, `summary`), not `{ "error": "..." }`.

## Frontend
Use the component with the `File` already chosen in Task 2.1's `DatasetUpload`:

```jsx
import { DatasetValidation } from './components/DatasetValidation';

<DatasetValidation file={selectedFile} onValidated={(report) => setCanContinue(report.valid)} />
```

Copy `src/utils/clientPrecheck.js` alongside it. Only enable the Upload / Continue action when `report.valid` is `true`.

Suggested flow: select file → `DatasetValidation` runs automatically → on valid, call `/api/upload-dataset` → pass `file_id` / `columns` / `row_count` to Preview (2.3) and Statistics (2.4).

## For Tasks 2.3 and 2.4
- `report.summary.columns` and `row_count` are parsed with a real CSV parser (quotes and embedded commas handled), unlike a naive `split(',')`.
- Guarantees after a file passes: UTF-8 text, comma-delimited, a non-blank unique header, at least one data row, and every row has the same number of fields as the header. Missing values may still exist.
