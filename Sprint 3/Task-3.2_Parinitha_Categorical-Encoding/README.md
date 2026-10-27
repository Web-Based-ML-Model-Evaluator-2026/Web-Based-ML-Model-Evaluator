# Task 3.2 — Categorical Encoding

## Goal
Identify categorical columns and offer two encoding options:
- **Label encoding** maps each category to an integer.
- **One-hot encoding** creates binary 0/1 columns for categories.

## Files
- `frontend/src/components/CategoricalEncoding.jsx` — reusable React UI.
- `frontend/src/utils/categoricalEncoding.js` — detection and encoding functions.
- `sample-data/categorical_sample.csv` — sample data.
- `INTEGRATION_GUIDE.md` — how to connect to the team's app.

## Component usage
```jsx
<CategoricalEncoding
  rows={dataset.rows}
  datasetName={dataset.filename}
  onEncodingComplete={(result) => setProcessedRows(result.rows)}
/>
```
`rows` must be an array of objects.

## Notes
Automatic column detection is heuristic. Numeric identifiers and low-cardinality numeric columns can be ambiguous; use explicit selection or backend-provided types for production. Label encoding may imply an artificial order for nominal categories, so one-hot encoding is often safer for nominal data.
