# Web-Based ML Model Evaluator — Final Integrated Demonstration Build

A self-contained, locally hosted web application that combines the core Sprint 1–3 demonstration workflows for Team 13's Web-Based ML Model Evaluator. It uses Python's standard library, browser-based JavaScript, and SQLite. No separate database server or internet connection is required to run the application. Python 3.10 or newer is recommended.

## Included Functionality

- **Sprint 1 — Authentication and Project Management:** Account registration, login/logout, salted PBKDF2 password hashing, session cookies, user-owned projects, project deletion, and SQLite persistence.
- **Sprint 2 — Dataset Upload and Exploration:** CSV upload and validation, file-size and row/column limits, header and duplicate-column checks, dataset preview, missing-value counts, duplicate-row counts, inferred column types, unique counts, and numerical summaries.
- **Sprint 3 — Data Preprocessing:** Missing-value handling, categorical one-hot/label encoding, min-max/standard scaling, optional target-column selection, and train/test split preview.
- **Additional Components:** Responsive dashboard, project cards, sample CSV dataset, local SQLite database, automated tests, Windows startup script, and a retained source snapshot of the uploaded team repository.

## Running the Application on Windows

1. Extract the application ZIP into a normal folder on your computer. Do not run it directly from inside the ZIP archive.
2. Install Python 3.10 or newer if it is not already installed. Select **Add Python to PATH** during installation if that option is available.
3. Open the extracted application folder in File Explorer.
4. Double-click `START-WINDOWS.bat`, or open PowerShell in the extracted folder and run:

   ```powershell
   py -3 app\server.py
   ```

5. Open **http://127.0.0.1:8000** in your browser.
6. Register an account and create a project.
7. Select **Datasets → Load sample dataset**, or upload `sample-data\customer_churn_sample.csv`.
8. Open **Preprocessing**, select the project and dataset, configure the available options, and run the preprocessing preview.
9. Stop the server by pressing **Ctrl+C** in the terminal.

The server listens on localhost by default and is intended for a local academic demonstration, not public production hosting. SQLite data is created in the `data` folder on first run. To reset the demo, stop the server and delete `data\evaluator.sqlite3`.

## Running Automated Tests

Run the following command in PowerShell from the extracted application folder:

```powershell
py -3 -m unittest discover -s tests -v
```

The test suite checks CSV validation and statistics, password hashing, registration, authentication boundaries, project creation, upload, preview, and preprocessing API workflows. Tests use a temporary database and should not modify the demonstration database.

`TEST-REPORT.txt` records the checks performed during packaging. Browser automation and execution on every target Windows environment have not been verified.

## Scope and Limitations

- The uploaded CSV is retained unchanged. Preprocessing produces a response preview and does not overwrite the original dataset.
- The train/test split is a **row-count preview**, not a persisted model-ready split artifact.
- This demonstration does not yet train or evaluate machine-learning models.
- Experiments 4, 5, and 6—model selection, training, evaluation, comparison, and reporting—remain outside this application's implemented scope.
- OTP email delivery and production CAPTCHA are not implemented.
- The application is a local demonstration build assembled for reliable startup. The original Sprint source snapshot is retained under `reference-source/` for traceability; this does not imply that every standalone team implementation has been merged line-for-line.
- Before public deployment, additional safeguards are required, including HTTPS, durable session storage, CSRF protection, stronger operational controls, and a production web server. Do not expose the demonstration server directly to the internet.

## Folder Structure

- `app/` — application server and browser interface.
- `data/` — SQLite database, created during execution.
- `sample-data/` — sample CSV dataset.
- `tests/` — automated standard-library tests.
- `reference-source/team-sprint-source-snapshot.zip` — retained team repository source snapshot for reference.
- `START-WINDOWS.bat` — Windows startup script.
- `TEST-REPORT.txt` — packaging verification report.

## Project Status

This build demonstrates the core Sprint 1–3 workflows. Later model training, evaluation, comparison, and reporting functionality must be verified separately before being described as implemented.
