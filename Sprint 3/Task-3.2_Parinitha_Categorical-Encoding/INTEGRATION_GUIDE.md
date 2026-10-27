# Integration Guide — Task 3.2

This task folder contains a reusable frontend component and utility functions; it does not change the shared backend.

Pass the dataset rows from the existing upload flow:
```jsx
<CategoricalEncoding
  rows={dataset.rows}
  datasetName={dataset.filename}
  onEncodingComplete={(result) => {
    setProcessedDataset(result.rows);
  }}
/>
```
Adjust property names to match the actual API response. Do not accept client-supplied filesystem paths. Before merging, coordinate with the parent-page owner and confirm downstream model training uses the transformed rows without unintentionally overwriting the original dataset.
