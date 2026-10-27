# Integration Guide — Task 3.1

This folder is an isolated deliverable: a React component and utility functions. It does not change the shared backend.

```jsx
<MissingValueHandling
  rows={dataset.rows}
  datasetName={dataset.filename}
  onHandlingComplete={(result) => setProcessedDataset(result.rows)}
/>
```
Adjust property names to match the real upload response. Store the processed rows separately; do not overwrite the original dataset.

## Pipeline order (needs team agreement)
1. **Missing values (3.1)** → 2. **Categorical encoding (3.2)** → 3. **Target selection and split (3.4)**.
- Run 3.1 before 3.2: 3.2 turns missing categories into `null` / all-zero one-hot rows. Filling them first (e.g. mode or "Unknown") avoids that.
- Mean/median/mode computed on the full dataset leak test-set information into training. For rigorous evaluation, split first (3.4) and compute fill values on the training set only, then reuse them on the test set. `applyMissingStrategy` returns the fill values in `imputations[].value`, and you can pass the same value back as a `constant` strategy to the test split.
- Do not drop rows where the target column is missing without telling the user; select columns explicitly.

## Backend option
The util is dependency-free and ports directly. For large datasets, apply the same logic in pandas (`df.fillna`, `df.dropna`) behind an endpoint that takes an opaque dataset ID, never a client-supplied path, and returns a bounded preview plus the validation report.
