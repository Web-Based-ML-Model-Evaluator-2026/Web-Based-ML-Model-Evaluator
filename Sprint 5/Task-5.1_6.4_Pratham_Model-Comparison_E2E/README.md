# Pratham — Model Comparison & End-to-End Release Readiness
Combined Sprint 5/Sprint 6 contribution for Jira **SCRUM-28 Model comparison** and **SCRUM-35 End-to-end testing and release readiness**.

This package is designed to be copied into `Sprint 5/Task 5.1_Pratham_Model-Comparison_E2E/`. It does not overwrite teammates' task folders.

## Contents
- `backend/model_comparison.py`: validates and normalizes evaluation records, computes comparable rankings, and chooses the best model according to task-specific metric direction.
- `backend/comparison_routes.py`: Flask blueprint exposing `POST /api/compare`.
- `frontend/src/components/ModelComparison.jsx`: React comparison table with metric selection and best-model highlight.
- `frontend/src/lib/modelComparison.js`: client-side validation, sorting, and formatting.
- `tests/`: unit and Flask API tests.
- `e2e/`: Playwright-ready smoke test and configuration, plus manual release checklist.
- `INTEGRATION.md`: integration contract with Task 4.3 training and Task 5.2 visualizations.
- `requirements-test.txt`, `package.json`: test dependencies and commands.

## Comparison input contract
`POST /api/compare`:
```json
{
  "task_type": "classification",
  "models": [
    {"name":"Random Forest","metrics":{"accuracy":0.94,"precision":0.92,"recall":0.91,"f1_score":0.915}},
    {"name":"Logistic Regression","metrics":{"accuracy":0.86,"precision":0.84,"recall":0.83,"f1_score":0.835}}
  ],
  "primary_metric": "f1_score"
}
```
Regression supports `mae`, `mse`, `rmse` (lower is better), and `r2_score` (higher is better). Classification supports `accuracy`, `precision`, `recall`, and `f1_score` (higher is better). Values must be finite; classification metrics must be in [0,1], and error metrics must be nonnegative.

Response includes normalized model records, metric direction, sorted rank, and `best_model`. The comparison endpoint accepts evaluation results; it does not retrain models.

## Run tests
From this package directory:
```bash
python -m pip install -r requirements-test.txt
python -m pytest -q
```
Frontend logic tests (Node 18+):
```bash
npm test
```
Playwright smoke test (after installing app dependencies and starting the integrated frontend/backend):
```bash
npm install
npx playwright install chromium
npm run test:e2e
```
Set `EVALUATOR_BASE_URL` if the app is not at `http://127.0.0.1:5173`.

## Limitations
The Playwright test is an integration smoke test and requires the full app running with seeded/evaluation results. It does not fabricate a successful training run. Actual release readiness should include running the full application tests, checking the training → comparison → visualization/report flow, and confirming no secrets or generated artifacts are committed.
