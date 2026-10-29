# Task 4.2 → Task 4.3 Integration

The provided Task 4.3 `ModelTrainer.jsx` currently hardcodes a mock payload. Task 4.2 should replace that mock with user-selected configuration while leaving the training engine in Task 4.3.

## 1. Copy the files

Copy these files into:

`Sprint 4/Task 4.3_Shreyas_Model training and testing/frontend/src/`

- `ModelConfiguration.jsx` → `src/components/ModelConfiguration.jsx`
- `modelConfiguration.js` → `src/lib/modelConfiguration.js`

Create `src/lib/` if it does not exist.

## 2. Render the configuration component

In the parent page/component that hosts model training, import:

```jsx
import ModelConfiguration from './components/ModelConfiguration';
```

Render it before the training execution component:

```jsx
<ModelConfiguration
  initialTaskType="classification"
  initialModelName="Logistic Regression"
  onSubmit={(configuration) => {
    // Store this object in parent state, then pass it to Task 4.3.
    setModelConfiguration(configuration);
  }}
/>
```

Define `const [modelConfiguration, setModelConfiguration] = useState(null)` in that parent. The component sends:

```json
{
  "task_type": "classification",
  "model_name": "Logistic Regression",
  "hyperparameters": {
    "C": 1,
    "max_iter": 1000,
    "random_state": 42
  }
}
```

## 3. Send the chosen configuration to Task 4.3

In the existing training handler, replace the hardcoded `mockPayload` with the configuration saved from Task 4.2:

```jsx
if (!modelConfiguration) {
  setErrorMessage('Configure a model before training.');
  setStatus('error');
  return;
}
const response = await axios.post(
  'http://localhost:5000/api/train',
  modelConfiguration
);
```

Use the state variable and error/status handlers appropriate to the existing Task 4.3 component. Do not maintain two competing configuration states.

## 4. Add backend validation (recommended)

The `backend/model_config_validator.py` file provides `validate_model_configuration(payload)`. In Task 4.3's `server.py`, call it after parsing JSON and before `engine.train_and_predict`:

```python
from model_config_validator import validate_model_configuration

validated = validate_model_configuration(data)
result = engine.train_and_predict(
    task_type=validated["task_type"],
    model_name=validated["model_name"],
    hyperparameters=validated["hyperparameters"],
)
```

Copy `model_config_validator.py` beside Task 4.3's `server.py`. Ensure the Python dependencies already listed for Task 4.3 are installed.

This integration snippet is guidance; the existing Task 4.3 files in the supplied repository are not modified by this Task 4.2 package.
