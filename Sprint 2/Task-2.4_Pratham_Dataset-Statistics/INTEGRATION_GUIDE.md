# Integration guide — Task 2.4

## Keep the feature isolated until integration
This folder is an independent Task 2.4 deliverable. Do not overwrite Shreyas's upload or Parineeta's preview work.

## Recommended integration points
- Reuse the team's existing dataset ID and metadata contract once agreed.
- If the frontend already has parsed rows and headers, call `calculateDatasetStatistics(rows, headers)`.
- For larger datasets, prefer a backend statistics endpoint and return a bounded report instead of sending every row to the browser.
- Never accept a filesystem path from the browser or expose storage paths in API responses.
- Do not trust browser-only parsing/validation as a security boundary.
- The statistics UI currently owns a standalone file input only for independent demonstration. In the final integrated UI, replace it with the shared dataset selection/upload state and pass the selected dataset to the statistics utility.

## Suggested API contract for future backend integration
`POST /api/datasets/:datasetId/statistics`

Response shape:
```json
{
  "datasetId": "opaque-id",
  "overview": {
    "rowCount": 100,
    "columnCount": 5,
    "missingCells": 2,
    "missingPercent": 0.4,
    "duplicateRows": 1
  },
  "columns": []
}
```

The backend should authorize access to the dataset owner, parse the stored CSV using a real CSV parser, and calculate statistics from the server-side file. The exact route should be agreed with the team before implementation.
