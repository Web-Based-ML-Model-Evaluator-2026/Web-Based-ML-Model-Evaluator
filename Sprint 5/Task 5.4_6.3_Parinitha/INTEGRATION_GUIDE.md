# Integration Guide

## Preserve existing work
This is an add-on. Do not replace the team's `server.py`, `report_generator.py`, Task 5.2 files, or Task 6.1 files. Merge the modules into the existing backend.

## Register in the existing Flask app
Add imports:
```python
from backend.database import initialize_database
from backend.history.history_routes import history_blueprint
from backend.security.upload_routes import upload_blueprint
from backend.security.error_handlers import register_error_handlers
```
After app creation/configuration:
```python
app.config["DATABASE_PATH"] = os.getenv("EVALUATION_HISTORY_DB", "evaluation_history.sqlite3")
app.config["API_ACCESS_KEY"] = os.getenv("API_ACCESS_KEY")
initialize_database(app.config["DATABASE_PATH"])
app.register_blueprint(history_blueprint)
app.register_blueprint(upload_blueprint)
register_error_handlers(app)
```
Register each blueprint only once. Merge error handlers if the existing app already has them.

## Save a completed evaluation
POST `/api/history` with JSON:
```json
{
  "project_id": "PES-ML-001",
  "task_type": "classification",
  "dataset_name": "credit.csv",
  "model_name": "Random Forest",
  "metrics": {"accuracy": 0.94, "precision": 0.92, "recall": 0.91, "f1_score": 0.915},
  "hyperparameters": {"n_estimators": 100},
  "summary": "Evaluation completed"
}
```

## Frontend examples
```javascript
const response = await fetch("http://localhost:5001/api/history");
const data = await response.json();
if (!response.ok) throw new Error(data.error || "Could not load history");
setEvaluations(data.evaluations);
```
For details, GET `/api/history/${id}`. For CSV validation, send `FormData` with the file under key `file` to `/api/security/validate-csv`.

## Access control and deployment
For local development, `API_ACCESS_KEY` may be unset. To enable the included API-key check in PowerShell:
```powershell
$env:API_ACCESS_KEY = "use-a-long-random-secret"
```
Send it as `X-API-Key`. Do not commit secrets. A key embedded in browser JavaScript is visible to users; deployed multi-user applications should integrate the team's approved login/session or token-based authorization instead.

## Validation scope
CSV checks cover filename extension/path, non-empty data, UTF-8 encoding and a 5 MB size limit. They do not replace pandas parsing or validation of required dataset columns/row counts.

## Tests
Run `pytest -q` from the package root. Tests use a temporary SQLite database.
