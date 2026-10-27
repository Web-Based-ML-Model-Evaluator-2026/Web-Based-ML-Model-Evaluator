# Dataset Preview — Integration Guide

## Component
Import the reusable component into the parent React page:

`import DatasetPreview from "./components/DatasetPreview";`

Adjust the import path according to the parent page's location.

## Expected dataset format
The component expects an object with:
- `name` or `filename`: dataset filename.
- `columns`: an array of column names or column metadata.
- `rows`: an array of objects, with column names as keys.
- `totalRows` or `total_rows`: total number of rows.
- `totalColumns` or `total_columns`: total number of columns.

## Props
- `dataset`: dataset metadata and preview rows.
- `loading`: whether data is being retrieved.
- `error`: an error message, if retrieval fails.
- `previewLimit`: number of rows to show, capped at 10.

## Backend integration
The parent page should request preview data from an approved backend endpoint and pass the response to `DatasetPreview`. The endpoint should identify the uploaded file using its dataset ID and resolve its location safely on the server. Do not accept arbitrary filesystem paths from the browser.

The current upload endpoint does not return preview rows. Backend integration therefore requires an existing preview endpoint or a backend change approved by the Task 2.1 owner.

## Test cases
1. Valid dataset: show columns, types, dimensions, and preview rows.
2. Empty selection: show the empty state.
3. Loading: show the loading message.
4. API failure: show the error message.
5. Dataset with no data rows: show the headers and empty-row message.
