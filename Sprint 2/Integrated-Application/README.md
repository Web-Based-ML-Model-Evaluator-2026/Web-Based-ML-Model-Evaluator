# Sprint 2 — Integrated Application

This folder integrates the four Sprint 2 deliverables into one runnable application while leaving the original task folders unchanged.

## Integrated workflow

1. **Task 2.1 — CSV Dataset Upload:** choose a CSV, upload it through the Flask API, and store it under a sanitized UUID-prefixed filename.
2. **Task 2.2 — Dataset Validation:** validate before upload and validate again at the storage boundary. Invalid datasets are not stored.
3. **Task 2.3 — Dataset Preview:** fetch the stored dataset by opaque dataset ID and show dimensions, inferred column types, and up to ten rows.
4. **Task 2.4 — Dataset Statistics:** calculate row/column counts, missing cells, duplicate rows, numeric descriptive statistics, categorical frequencies, column completeness, searchable profiles, and exportable CSV summary from the same shared dataset.

## Requirements

- Python 3.10+
- Node.js 18+ and npm

## Run the backend (PowerShell)

```powershell
cd "Sprint 2/Integrated-Application/backend"
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python server.py
```

The API runs at `http://127.0.0.1:5000`. Health check: `http://127.0.0.1:5000/api/health`.

## Run the frontend (second PowerShell window)

```powershell
cd "Sprint 2/Integrated-Application/frontend"
npm install
npm run dev
```

Open `http://127.0.0.1:5173`. Optional API override: set `VITE_API_BASE_URL` before starting Vite.

## Tests and build

Frontend utility tests and production build:

```powershell
cd "Sprint 2/Integrated-Application/frontend"
npm test
npm run build
```

Backend API tests (with backend virtual environment active):

```powershell
cd "Sprint 2/Integrated-Application/backend"
python -m unittest discover -s tests -v
```

## API routes

- `GET /api/health`
- `POST /api/validate-dataset` — multipart field `file`; returns validation report.
- `POST /api/upload-dataset` — multipart field `file`; validates and stores only valid CSVs. Returns `file_id`, `stored_name`, dimensions, and validation report; does not expose an absolute filesystem path.
- `GET /api/datasets/<file_id>/preview` — returns safe metadata and the first ten rows for a stored dataset.

## Integration/security notes

- Browser validation is for user feedback only; the backend revalidates before storage.
- The preview route accepts only a 12-character lowercase hexadecimal ID, resolves the stored file server-side, and never accepts a filesystem path from the browser.
- The current project’s existing architecture does not implement authentication/owner authorization for these dataset routes; do not deploy this local-development API as a multi-user production service without adding authorization and per-user dataset ownership.
- Upload storage is local to `backend/uploads/`. Uploaded datasets are runtime data and should not be committed.
- Original Task 2.1–2.4 folders are retained beside this integration folder as individual deliverables.
