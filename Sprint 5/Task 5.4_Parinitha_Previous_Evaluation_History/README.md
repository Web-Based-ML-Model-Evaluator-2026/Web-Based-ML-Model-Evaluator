# Sprint 5.4 + Sprint 6.3 — Parinitha

This modular Flask add-on implements:
- **5.4 Previous Evaluation History:** SQLite persistence, list/detail/delete APIs, pagination.
- **6.3 Security and Error Handling:** JSON validation, CSV upload checks, optional API-key access control, safe error responses, and tests.

## Setup
Use Python 3.10+:
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
pytest -q
```

The database defaults to `evaluation_history.sqlite3` in this package. Set `EVALUATION_HISTORY_DB` to change it.

## API
- `POST /api/history` — save evaluation
- `GET /api/history?limit=50&offset=0` — list evaluations
- `GET /api/history/<id>` — retrieve details
- `DELETE /api/history/<id>` — delete record
- `POST /api/security/validate-csv` — validate multipart field named `file`

When `API_ACCESS_KEY` is configured, protected routes require `X-API-Key`. If unset, authentication is disabled for local development. Do not expose a shared API key in browser code; use the team's real authentication system for deployed multi-user access.
