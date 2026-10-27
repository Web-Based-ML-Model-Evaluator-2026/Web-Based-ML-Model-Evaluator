# Web-Based ML Model Evaluator — Sprint 3 Integrated Application

A single cohesive local web application integrating all four Sprint 3 data-preparation tasks:
1. Missing-value handling
2. Categorical encoding
3. Feature scaling
4. Target selection and train/test splitting

The browser frontend calls one Python backend API. No Node.js, external database, or third-party Python packages are required. Uses Python 3.10+ standard library.

## Run on Windows
1. Extract the ZIP.
2. Double-click `START-WINDOWS.bat`, or open PowerShell in this folder and run `python backend\server.py`.
3. Open http://127.0.0.1:8000
4. Use the included sample or upload a UTF-8 CSV (max 5 MB).
5. Choose the missing-value strategy, categorical encoding, scaling, optional target, and test split.
6. Click **Run preprocessing pipeline**. Review the report and download a new transformed CSV.

## API
- `GET /api/health` — health check
- `POST /api/preprocess` — JSON payload `{ "csv": "...", "filename": "...", "missing": "mean|mode|zero|drop", "encoding": "onehot|label|none", "scaling": "none|minmax|standard", "target": "column or empty", "test_size": 20 }`

## Important implementation details
- Target column is explicitly excluded from the feature matrix and preserved as a separate label in the output.
- Missing-value handling runs before splitting.
- The split is deterministic and preserves source row order for demonstration purposes; it is not a randomized or stratified split.
- Encoders and numeric scalers are fitted on training rows only, then applied to the data. For unseen categories in the test partition, label/one-hot transformation behavior must be reviewed: one-hot currently uses training categories and produces zeros for unseen categories; label encoding returns a validation error for unseen categories.
- Only numeric columns are scaled. One-hot encoded columns and the target are not scaled.
- No machine-learning model training, evaluation, comparison, or reports are included (deferred to later experiments).
- This is a local coursework demo, not a production security deployment.

## Test
Run `python -m unittest discover -s tests -v`.
