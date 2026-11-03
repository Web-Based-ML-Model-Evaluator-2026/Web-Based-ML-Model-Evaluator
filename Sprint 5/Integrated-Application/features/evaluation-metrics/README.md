# Sprint 4: Task 4.4 - Evaluation Metrics

Reads `results/predictions.csv` (written by Task 4.3) and computes + displays metrics.

## Classification
Accuracy; precision, recall, F1 (macro and weighted, plus positive-class values for binary problems); confusion matrix (heat-mapped); per-class report with support.

## Regression
RMSE, MAE, MSE, R², median absolute error, max error, mean residual (bias); actual-vs-predicted scatter plot.

## Files
| File | Purpose |
|---|---|
| `backend/evaluation_metrics.py` | `EvaluationEngine` - metric computation |
| `backend/evaluation_routes.py` | Flask blueprint: `POST /api/evaluate` `{ "task_type": "classification" \| "regression" }` |
| `backend/test_evaluation_metrics.py` | 7 pytest tests (hand-computed values, multiclass, edge cases) |
| `frontend/src/components/EvaluationMetrics.jsx` | Results UI (props: `taskType`, `runId`) |

## Integration (already applied in Task 4.3)
Copies of the backend files and `EvaluationMetrics.jsx` live in the Task 4.3 folders. `server.py` registers the blueprint, and `ModelTrainer.jsx` renders `<EvaluationMetrics>` after a successful training run.

## Run
```
cd "Task 4.3_Shreyas_Model training and testing/backend"
pip install -r requirements.txt && python server.py
cd ../frontend && npm install && npm run dev
```
Tests: `cd "Task 4.4_Evaluation-Metrics/backend" && pytest`

Note: `/api/evaluate` needs `results/predictions.csv`, so run training first. Evaluation uses test-set predictions only. ROC-AUC is not included because Task 4.3 saves hard predictions, not probabilities.
