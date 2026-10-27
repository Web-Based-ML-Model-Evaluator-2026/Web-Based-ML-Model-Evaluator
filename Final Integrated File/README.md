# Web-Based ML Model Evaluator — Final Integrated Application

This folder contains the final integrated demonstration application for Team 13's Web-Based ML Model Evaluator. It combines the core Sprint 1, Sprint 2, and Sprint 3 workflows into a single locally hosted web application using Python's standard library, browser-based JavaScript, and SQLite.

## Included Functionality

- **Sprint 1 — Authentication and Project Management:** Registration, login/logout, password hashing, session cookies, user-owned projects, and SQLite persistence.
- **Sprint 2 — Dataset Upload and Exploration:** CSV validation, dataset preview, missing-value counts, duplicate-row counts, inferred column types, and numerical summaries.
- **Sprint 3 — Data Preprocessing:** Missing-value handling, categorical encoding, feature scaling, target-column selection, and train/test split preview.
- Responsive dashboard, sample dataset, automated tests, and Windows startup script.

## Running the Application on Windows

1. Ensure Python 3.10 or newer is installed.
2. Open this folder in File Explorer.
3. Double-click `START-WINDOWS.bat`, or run the following command in PowerShell:

   ```powershell
   py -3 app\server.py
   ```

4. Open `http://127.0.0.1:8000` in your browser.
5. Register, create a project, upload a CSV or load the sample dataset, and explore the preprocessing workflow.
6. Stop the server with `Ctrl+C`.

## Automated Tests

Run the tests from this folder:

```powershell
py -3 -m unittest discover -s tests -v
```

`TEST-REPORT.txt` records the checks performed during packaging. Browser automation and execution on every target Windows environment have not been verified.

## Scope and Limitations

- The original uploaded dataset is retained unchanged.
- The train/test split is a preview; the application does not claim to train or evaluate machine-learning models.
- Experiments 4, 5, and 6—model training, evaluation, comparison, and reporting—remain outside the implemented scope.
- OTP email delivery and production CAPTCHA are not implemented.
- This application is intended for local demonstration, not public production deployment.

## Folder Structure

- `app/` — application server and browser interface.
- `data/` — SQLite database.
- `sample-data/` — sample CSV dataset.
- `tests/` — automated tests.
- `reference-source/` — retained source snapshot for reference.
- `START-WINDOWS.bat` — Windows startup script.
- `TEST-REPORT.txt` — packaging verification report.