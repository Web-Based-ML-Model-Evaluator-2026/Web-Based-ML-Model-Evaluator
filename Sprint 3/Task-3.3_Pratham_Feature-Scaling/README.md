# Sprint 3 — Task 3.3: Feature Scaling

## Objective
Provide standard scaling (z-score standardization) and min-max normalization for selected numeric dataset columns, with validation of the transformed values.

## Contents
- `frontend/src/utils/featureScaling.js` — dependency-free scaling, profiling, validation and CSV export functions.
- `frontend/src/utils/featureScaling.test.js` — Node.js unit tests.
- `frontend/src/components/FeatureScaling.jsx` — reusable React component for integration into the main app.
- `FeatureScaling_Demo/` — standalone Vite demo that loads a sample CSV or a user's CSV.
- `sample-data/feature_scaling_sample.csv` — sample dataset.
- `TEST-PLAN.md` and `INTEGRATION_GUIDE.md`.

## Supported methods
- **Standard scaling:** `z = (x - mean) / populationStandardDeviation`. For a non-constant column, the transformed mean is approximately 0 and population standard deviation approximately 1.
- **Min-max normalization:** `x' = (x - min) / (max - min) * (maxRange - minRange) + minRange`. The default output range is 0–1; custom finite bounds are supported.

Only selected numeric columns are transformed. Other columns and row order are preserved. Input rows are not mutated. Missing values are preserved as missing values and excluded from fitting; invalid non-empty values cause an actionable error instead of being silently coerced. Constant columns are mapped to 0 for standard scaling and to the requested minimum for min-max scaling, and are reported in the result.

## Run the standalone demo (Windows PowerShell)
```powershell
cd "FeatureScaling_Demo"
npm install
npm test
npm run build
npm run dev
```
Open the local URL printed by Vite. The demo includes a sample CSV, CSV upload, method/column selection, validation results, a preview, and CSV export.

## Reusable component
```jsx
import FeatureScaling from "./components/FeatureScaling.jsx";

<FeatureScaling
  rows={dataset.rows}
  datasetName={dataset.filename}
  onScalingComplete={(result) => setProcessedRows(result.rows)}
/>
```
`rows` must be an array of objects. Callback payload includes `rows`, `method`, `columns`, `parameters`, `profiles`, `constantColumns`, and `validation`.

## Integration notes
- Keep this task's implementation modular; do not replace the shared app or other teammates' work.
- In the complete pipeline, missing-value handling and categorical encoding should be applied as appropriate before scaling, and train/test splitting should happen before fitting any preprocessing parameters to avoid data leakage. For a production ML pipeline, fit scaling parameters on training data and apply those same parameters to validation/test data. This standalone task currently scales the supplied dataset as a whole; integration with Task 3.4 should pass training data for fitting and reuse the resulting parameters for other splits.
- This is a task deliverable, not a claim that it has already been integrated into the shared application.
