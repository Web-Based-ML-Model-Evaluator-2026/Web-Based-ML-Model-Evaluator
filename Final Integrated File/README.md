# Web-Based ML Model Evaluator — Sprint 1–3 Demonstration Build

A self-contained, locally hosted web application that combines the core Sprint 1–3 demonstration flow. It uses **Python's standard library only**: no Node.js, Flask, database server, or internet connection is required to run the application. Python 3.10+ is recommended.

## Included functionality

- **Sprint 1:** account registration/login/logout, salted PBKDF2 password hashes, session cookies, user-owned projects, project deletion, SQLite persistence.
- **Sprint 2:** CSV upload, validation (size, extension, header, duplicate columns, row shape, row/column limits), preview, missing-value counts, duplicate-row count, inferred column types, unique counts and numeric summaries.
- **Sprint 3:** missing-value strategies (mean/Unknown, mode, zero/Unknown, drop incomplete rows), categorical one-hot/label encoding, min-max/standard scaling, optional target column and train/test split preview.
- Responsive dashboard, project cards, sample CSV, local SQLite database, automated tests, and a retained source snapshot of the uploaded team repository.

## Run on Windows

1. Extract `Web-Based-ML-Model-Evaluator-Final.zip` into a normal folder on your Desktop (do not run it from inside the ZIP).
2. Install Python 3.10 or newer if it is not already installed. During setup, select **Add Python to PATH**.
3. Open the extracted folder in File Explorer.
4. Double-click `START-WINDOWS.bat`, or open PowerShell in the extracted folder and run:

   ```powershell
   py -3 app\server.py
   ```

5. Open **http://127.0.0.1:8000** in your browser.
6. Register an account, create a project, then select **Datasets → Load sample dataset** or upload `sample-data\customer_churn_sample.csv`.
7. Open **Preprocessing**, select the project and dataset, configure options, and run the preprocessing preview.
8. Stop the server with **Ctrl+C** in the terminal.

The server listens on localhost only by default. It is intended for a local class demonstration, not public production hosting. SQLite data is created in the `data` folder on first run. To reset the demo, stop the server and delete `data\evaluator.sqlite3`.

## Run automated tests

From PowerShell in the extracted folder:

```powershell
py -3 -m unittest discover -s tests -v
```

The test suite checks CSV validation/statistics, password hashing, registration, authentication boundaries, project creation, upload, preview, and preprocessing API flow. Tests use a temporary database and do not change the demonstration database.

## Important scope and accuracy notes

- The uploaded CSV is retained unchanged. Preprocessing produces a response preview and does not overwrite the original dataset.
- The test/train split is a **row-count preview**, not a persisted model-ready split artifact. This demo does not train or evaluate machine-learning models.
- Experiments 4, 5, and 6 (model selection/training/evaluation/comparison/reporting) are intentionally deferred, as requested.
- OTP email delivery and a production CAPTCHA are not included. Do not present them as implemented.
- The application is a local demonstration implementation assembled for reliable one-command startup. The original Sprint source snapshot is included under `reference-source/` for traceability; this ZIP does not claim that every standalone team implementation has been merged line-for-line.
- Before public deployment, add HTTPS, a durable session store, CSRF protections, stronger operational controls, and a production web server. Do not expose this demo server directly to the internet.

## Folder map

- `app/` — application server and browser UI.
- `tests/` — automated standard-library tests.
- `sample-data/` — sample dataset for demonstration.
- `reference-source/team-sprint-source-snapshot.zip` — supplied team repository snapshot used as reference.
- `START-WINDOWS.bat` — Windows launcher.
- `TEST-REPORT.txt` — results from checks run while packaging this archive.
