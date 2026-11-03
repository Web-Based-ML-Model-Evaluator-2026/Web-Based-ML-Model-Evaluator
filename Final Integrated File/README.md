# ModelLab — Web-Based ML Model Evaluator (Final Integrated Demo)

A local, end-to-end web application for supervised tabular machine-learning experiments. It provides account registration/login, project organization, CSV upload/validation, preprocessing, classification/regression model training, metrics, experiment history, comparison, and JSON report export.

## Architecture

```text
Browser (vanilla JS + responsive CSS)
        │ JSON/HTTP + Bearer session token
        ▼
Python HTTP API (backend/server.py)
        ├── Authentication (PBKDF2 password hashes; SQLite sessions)
        ├── Project and dataset endpoints
        ├── CSV validation and upload storage
        ├── sklearn preprocessing + train/test split + model training
        ├── Evaluation metrics and experiment persistence
        └── Comparison/report endpoints
        ▼
SQLite database (database/modellab.sqlite3) + uploaded CSV files (datasets/uploads/)
```

## Requirements
- Windows 10/11 (or Linux/macOS)
- Python 3.10 or newer
- Internet connection only for first-time `pip` dependency installation

## Run on Windows
1. Extract the ZIP to a folder.
2. Double-click `START-WINDOWS.bat`.
3. If prompted, allow Python dependencies to install.
4. Open `http://127.0.0.1:8000` (the script opens it automatically).
5. Register, create a project, upload one of the CSVs in `datasets/`, and run an experiment.
6. Stop the server with Ctrl+C in the console.

Or manually:
```powershell
python -m pip install -r backend\requirements.txt
python backend\server.py
```

## End-to-end workflow
1. **Register / sign in** — user passwords are stored as salted PBKDF2-HMAC-SHA256 hashes.
2. **Create a project** — give it a name and optional description.
3. **Upload a CSV** — UTF-8 CSV, 2+ columns, max 5 MB, max 100,000 data rows. Original file is retained.
4. **Configure training** — select classification or regression, target, supported model, test split, missing-value strategy, categorical encoding, and numeric scaling.
5. **Train & evaluate** — preprocessing is fitted within the training pipeline; metrics are calculated on held-out test data.
6. **History & comparison** — select saved experiments and compare their metrics.
7. **Report** — export selected experiment metadata, configurations, and metrics as JSON.

## Supported models and metrics
- Classification: Logistic Regression, Decision Tree, Random Forest, Gradient Boosting, SVM. Metrics: accuracy, weighted precision, weighted recall, weighted F1, confusion matrix.
- Regression: Linear Regression, Decision Tree Regressor, Random Forest Regressor, Gradient Boosting Regressor, SVR. Metrics: MAE, RMSE, R².
- Preprocessing: mean/mode imputation or dropping incomplete rows; one-hot or ordinal categorical encoding; standard or min-max scaling; configurable held-out test split.

## Included sample datasets
- `datasets/customer_churn.csv` — binary classification
- `datasets/iris_classification.csv` — multiclass classification
- `datasets/house_prices_regression.csv` — regression
- `datasets/student_performance.csv` — binary classification
- `datasets/employee_attrition.csv` — binary classification

The data are synthetic teaching/demo examples, not real personal data.

## Tests
Run `RUN-TESTS-WINDOWS.bat` or:
```powershell
python -m unittest discover -s tests -v
```
Tests cover API health, registration/login validation, project and dataset creation, classification training, regression training, and CSV validation.

## Folder structure
```text
backend/       HTTP API, validation, preprocessing, model training, SQLite access
frontend/      Single-page UI (HTML, CSS, JavaScript)
database/     SQLite database is created here at first run
 datasets/     Five sample CSV datasets; uploads stored in datasets/uploads/
tests/        End-to-end and model pipeline tests
reports/      Reserved for report artifacts; exports are downloaded from the UI
```

## Demo/security notes
- This is a local academic demonstration. The server binds to `127.0.0.1` by default; do not expose it publicly.
- Authentication is implemented for local user separation. For production deployment, add HTTPS, CSRF protections, rate limiting, secure cookie/session lifecycle, database migrations, centralized logging, and hardened upload isolation.
- Trained estimators are evaluated and metrics are persisted; model binaries are not currently serialized for later inference/deployment.
- The report export is JSON. PDF/CSV report formats and live deployment are outside this demo build.
