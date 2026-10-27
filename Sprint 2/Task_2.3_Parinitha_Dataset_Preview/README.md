# Task 2.3 — Dataset Preview

## Objective
To create a reusable React component that displays an uploaded dataset's dimensions, column names, data types, and first 10 rows.

## Features
- Displays total number of rows and columns.
- Displays column names and their data types.
- Shows up to 10 rows in a horizontally scrollable table.
- Handles loading, error, and empty states.
- Infers basic data types: Number, Boolean, Text, and Unknown.
- Displays missing cell values as a dash.

## Files
- `frontend/src/components/DatasetPreview.jsx` — dataset preview UI.
- `frontend/src/utils/datasetPreview.js` — column normalization and data-type inference.
- `frontend/src/DatasetPreviewDemo.jsx` — demonstration component.
- `sample-data/iris_sample.csv` — sample CSV for testing.
- `INTEGRATION_GUIDE.md` — integration notes.

## Testing
Test with a dataset containing numeric and text columns. Verify row and column counts, the first 10 rows, inferred data types, and loading, error, and empty states.

## Integration
The component accepts dataset metadata and preview rows through its props. The parent application must provide the dataset data. Connecting the component to the team's upload API requires an endpoint that returns preview rows and dataset metadata.

## Limitation
The current demonstration uses sample data. It does not independently read uploaded CSV files or retrieve rows from the backend.
