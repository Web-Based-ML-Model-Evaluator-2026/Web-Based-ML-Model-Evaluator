# Integration guide

## Backend
Register the blueprint in the Flask application serving model evaluation:
```python
from backend.comparison_routes import comparison_bp
app.register_blueprint(comparison_bp)
```
If the existing backend is a single `server.py`, ensure the package root is on `PYTHONPATH`. The endpoint is `POST /api/compare`.

Task 4.3's `ModelTrainerEngine.train_and_predict(...)` returns model/run metadata. Use the actual test-set metrics from that result to build `models` records; do not compare placeholder or training-only scores. Preserve the run identifier and model name in the caller's state/store if available.

## Frontend
Import:
```jsx
import ModelComparison from './components/ModelComparison';
```
Pass evaluated records:
```jsx
<ModelComparison taskType={taskType} models={evaluationResults} />
```
Each record must contain `name` and `metrics`. The component calls `/api/compare` and displays ranks and the best model. Set `VITE_API_BASE_URL` to the backend origin if it differs from same-origin deployment.

## Task 5.2
The comparison response's model list can be passed to Task 5.2's chart component after adapting metric labels/series. Avoid hardcoding sample scores in production flow.

## Release validation
Run Python and Node tests; start backend and frontend; perform a real training run; compare at least two models for classification and regression; verify metric direction and empty/error states; check browser console/network; verify report download; then record screenshots and test output in the team's submission evidence.
