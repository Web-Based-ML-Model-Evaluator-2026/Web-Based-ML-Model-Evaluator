# Sprint 4 — Task 4.2: Model Configuration

**Owner:** Pratham Kumar  
**Epic:** Epic 4 — ML Model Training & Evaluation  
**Purpose:** Let a user configure supported model hyperparameters, validate inputs, apply defaults, and produce the configuration payload consumed by Task 4.3.

## Integration contract

This task emits the exact payload shape expected by the Task 4.3 Flask endpoint:

```json
{
  "task_type": "classification",
  "model_name": "Logistic Regression",
  "hyperparameters": {
    "C": 1.0,
    "max_iter": 1000,
    "random_state": 42
  }
}
```

The component invokes `onSubmit(configuration)`. The parent component can pass the returned configuration to Task 4.3's `POST /api/train` endpoint.

## Included files

- `frontend/src/components/ModelConfiguration.jsx` — reusable React form.
- `frontend/src/lib/modelConfiguration.js` — model catalog, defaults, coercion and client-side validation.
- `frontend/tests/modelConfiguration.test.js` — Node.js built-in test suite for configuration validation and payload generation.
- `backend/model_config_validator.py` — server-side allowlist and value validation for the supported model parameters.
- `backend/test_model_config_validator.py` — Python `unittest` coverage.
- `INTEGRATION.md` — integration steps for Task 4.3.

## Supported models

The catalog is aligned with the model names in the supplied Task 4.3 `ModelTrainerEngine`:
- Classification: Logistic Regression, Decision Tree, Random Forest, SVM, k-NN, Naive Bayes.
- Regression: Linear Regression, Ridge, Lasso, Decision Tree Regressor, Random Forest Regressor.

The UI exposes only parameters relevant to each selected model. `random_state` is included for models that support it. The backend validator rejects unknown model names, unknown parameters, invalid types, and out-of-range values.

## Run tests

### Python validator

From this task folder:

```powershell
py -3 -m unittest discover -s backend -p "test_model_config_validator.py" -v
```

### JavaScript validation

Requires Node.js 18 or newer:

```powershell
node --test frontend/tests/modelConfiguration.test.js
```

The React component is designed to be copied into the Task 4.3 React/Vite frontend. To build the full frontend, run `npm install` and `npm run build` in the existing Task 4.3 `frontend` folder after following `INTEGRATION.md`.

## Scope note

This task configures and validates model parameters; it does not train models. Training, prediction, persistence, and evaluation remain in their respective sprint tasks.
