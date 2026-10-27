# Task 3.1 — Missing Value Handling

## Goal
Implement simple missing-value strategies and validate the processed dataset.

## Strategies
| Strategy | Applies to | Behaviour |
|---|---|---|
| Drop rows | any column | Removes rows that have a missing value in a selected column |
| Drop columns | any column | Removes selected columns that contain missing values |
| Mean / Median | numeric columns | Fills with the column mean/median (rounded to 6 d.p.) |
| Most frequent (mode) | any column | Fills with the most common value; ties pick the smallest number / first alphabetically |
| Constant | any column | Fills with a user-supplied value (must be numeric for numeric columns) |

Missing means: `null`, `undefined`, blank/whitespace, `NaN`, or the tokens `NA`, `N/A`, `null`, `none`, `nan`, `undefined` (same rule as Task 2.4).

Incompatible columns (e.g. mean on a text column, or a column with no values at all) are **skipped and reported**, never silently changed.

## Validation
`validateProcessedDataset` checks that the dataset is non-empty, the row count and columns match the strategy applied, no missing values remain, imputed numeric columns contain only numbers, and no existing value was altered. Row loss above 20% raises a warning. Required checks make `valid` false; warnings do not.

## Files
- `frontend/src/utils/missingValueHandling.js` — profiling, strategies, validation, CSV export (no dependencies).
- `frontend/src/utils/missingValueHandling.test.js` — 12 unit tests (`node:test`).
- `frontend/src/components/MissingValueHandling.jsx` — reusable React UI.
- `sample-data/missing_sample.csv` — sample data with blanks and `NA`.
- `MissingValueHandling_Demo/` — standalone Vite app for trying it out.
- `TEST-PLAN.md`, `INTEGRATION_GUIDE.md`.

## Component usage
```jsx
<MissingValueHandling
  rows={dataset.rows}
  datasetName={dataset.filename}
  onHandlingComplete={(result) => setProcessedRows(result.rows)}
/>
```
`rows` must be an array of objects. The callback receives `{ rows, strategy, imputations, skipped, droppedRowCount, droppedColumns, before, after, validation }`.

## Run the demo
```
cd MissingValueHandling_Demo
npm install
npm run dev      # open the URL shown (usually http://127.0.0.1:5173/)
npm test         # runs the unit tests against ../frontend/src/utils
```
`MissingValueHandling_Demo/src` holds copies of the component and util. If you edit `frontend/src`, copy the changes across.

## Notes
- Imputing a numeric column converts all its values to real numbers (CSV parsing yields strings), so later steps get a consistent type.
- Mean/median/mode imputation should be fitted on the **training split only** to avoid data leakage. Task 3.4 splits the data, so see the integration guide for ordering.
