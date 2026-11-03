# Sprint 5: Task 5.3 - Preferred Model Selection

Lets the user pick a preferred model from the evaluated candidates, and **saves the selection together with the results** (metrics and hyperparameters) the model had when it was chosen. The saved preference is reloaded when the page is opened again.

## Behaviour
- One preference is stored per **project + task type**, so a classification choice and a regression choice never overwrite each other.
- Saving again replaces the previous preference. **Clear** removes it.
- If the selected model's results change after it was saved (e.g. the model was re-trained), the UI says so and offers **Update saved results**.
- A failed save shows the server's error message. It never pretends to have saved.
- Saved metric keys are snake_case (`accuracy`, `f1_score`, `r2_score`, `mae`, ...), the same keys Task 5.2's report generator uses, so a saved record can be passed straight into the PDF/CSV report.

## Files
| File | Purpose |
|---|---|
| `backend/preferred_model_store.py` | `PreferredModelStore`: validation + SQLite persistence (stdlib only) |
| `backend/preferred_model_routes.py` | Flask blueprint for `/api/preferred-model` |
| `backend/test_preferred_model.py` | 24 pytest tests (store + routes + CORS preflight) |
| `frontend/src/components/PreferredModelSelector.jsx` | Selection UI |
| `frontend/src/lib/preferredModelApi.js` | API client and helpers (`buildMetricsMap`, `metricKey`) |

Like Task 4.1, this is a component starter, not a standalone app. It plugs into the Task 5.2 app and server.

## API
| Method | URL | Body / params | Result |
|---|---|---|---|
| `GET` | `/api/preferred-model` | `?project_id=&task_type=` | `{status, preferred_model}`; `preferred_model` is `null` if none saved yet |
| `PUT` | `/api/preferred-model` | `{project_id, task_type, model_name, metrics, hyperparameters?}` | saved record |
| `DELETE` | `/api/preferred-model` | `?project_id=&task_type=` | `404` if nothing was saved |

Saved record:
```json
{
  "project_id": "PRJ-PES-2026", "task_type": "classification",
  "model_name": "Random Forest",
  "hyperparameters": { "n_estimators": 100 },
  "metrics": { "accuracy": 0.94, "precision": 0.92, "recall": 0.91, "f1_score": 0.915 },
  "saved_at": "2026-11-03T12:54:04+00:00"
}
```
Validation errors return `400 {status: "error", message}`: missing `project_id` / `model_name`, `task_type` not `classification`/`regression`, or `metrics` empty or non-numeric.

## Integration with Task 5.2

**Backend** (`Task 5.2.../backend/server.py`): copy `preferred_model_store.py` and `preferred_model_routes.py` next to it, then add:
```python
from preferred_model_routes import create_preferred_model_blueprint
...
app.register_blueprint(create_preferred_model_blueprint())   # after CORS(app, ...)
```
The database is created at `backend/data/preferred_models.db` on first use. Do not commit it.

**Frontend** (`Task 5.2.../frontend/src/App.jsx`): copy the component into `src/components/` and `preferredModelApi.js` into `src/lib/`, then render it under `<MetricCharts>`:
```jsx
import PreferredModelSelector from './components/PreferredModelSelector';
...
<PreferredModelSelector
  projectId={activeProjectMetadata.project_id}
  taskType={taskType}
  visualizationData={visualizationData}
  hyperparameters={activeProjectMetadata.hyperparameters}
/>
```

**Optional: use the preference in the report.** Task 5.2's `activeProjectMetadata` hardcodes the model name and metrics. To report the preferred model instead, keep the saved record in state and pass it on:
```jsx
const [preferred, setPreferred] = useState(null);
...
<PreferredModelSelector ... onPreferredChange={setPreferred} />
...
// in activeProjectMetadata:
model_name: preferred?.model_name ?? (taskType === 'classification' ? 'Random Forest Classifier' : 'Random Forest Regressor'),
metrics: preferred?.metrics ?? (/* existing defaults */),
```

## Run the tests
```
cd "Task 5.3_Preferred_Model_Selection/backend"
pip install -r requirements.txt
pytest
```

## Known limitation
Model names must match across tasks. Task 5.2's `/api/visualize` currently returns hard-coded sample models (e.g. "Support Vector Machine"), while Task 4.3 trains models named e.g. "SVM". The saved name is whatever `/api/visualize` returns, and the backend does not check it against Task 4.3's catalogue. When 5.2 is switched to real results, keep the names consistent.
