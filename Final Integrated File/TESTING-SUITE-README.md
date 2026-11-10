# ModelLab Complete Testing Suite

This package is designed for the supplied **ModelLab-Final** application. Extract the contents of this ZIP directly into the application root (the folder containing `backend/`, `frontend/`, and `database/`).

The suite currently contains 32 unit tests, 15 component/functional tests, 6 integration tests, 4 system tests, and 2 end-to-end tests (59 total).\n\n## Test categories

| File | Purpose |
|---|---|
| `tests/test_unit.py` | Isolated tests for password utilities, CSV validation, metrics, timestamps, SQLite setup, ownership and authentication helpers. |
| `tests/test_functional.py` | Individual API feature tests: registration, login validation, profile, projects, upload, content retrieval, logout and frontend delivery. |
| `tests/test_integration.py` | Connected data pipeline and database relationship tests. |
| `tests/test_system.py` | Complete service workflows, including project → dataset → model experiment → history → report. |
| `tests/test_end_to_end.py` | HTTP server, frontend assets and user journey smoke tests. |

Tests use temporary SQLite databases and temporary upload folders. They do not intentionally modify the application's `database/modellab.sqlite3` or existing uploaded datasets.

## Install

From the ModelLab application root:

```powershell
python -m pip install -r backend/requirements.txt
python -m pip install -r requirements-test.txt
```

If the second command cannot resolve the relative `-r ../backend/requirements.txt` line because you extracted files at a different location, install the two dependency groups separately:

```powershell
python -m pip install -r backend/requirements.txt
python -m pip install coverage
```

## Run everything

```powershell
python run_all_tests.py
```

The runner executes each testing category separately, then runs the full suite under `coverage.py` with branch measurement.

## Reports

After execution:

- `reports/index.html` — consolidated browser-viewable test dashboard.
- `reports/coverage_html/index.html` — detailed line-by-line statement and branch coverage.
- `reports/test_results.json` — machine-readable summary.
- `reports/test_execution.log` — complete verbose test output.
- `reports/coverage.json` — machine-readable coverage data.

Open the dashboard on Windows:

```powershell
Start-Process reports/index.html
```

Open detailed coverage:

```powershell
Start-Process reports/coverage_html/index.html
```

## GitHub Actions

The workflow is at `.github/workflows/ci.yml`. Commit and push this file and the test suite to the GitHub repository. GitHub Actions runs the suite on pushes to `main`/`master`, pull requests targeting those branches, and manual workflow dispatch. Reports are uploaded as a workflow artifact.

## Important scope notes

- The application supplied in the ZIP is a Python HTTP server with a static HTML/CSS/JavaScript frontend and SQLite persistence. The tests exercise its actual backend API and served frontend assets.
- Python statement/branch coverage applies to `backend/server.py`; it does not measure browser-side JavaScript coverage.
- The current application does not expose a separate public preprocessing endpoint, so preprocessing is verified as part of the actual `run_model` pipeline.
- Tests assert observed behavior. A failing test should be investigated rather than changed merely to make the report green.
