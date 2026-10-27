# Task 2.4 — Dataset Statistics

**Owner:** Pratham Kumar  
**Jira:** SCRUM-19  
**Sprint:** Sprint 2  
**Feature:** Calculate and display descriptive statistics for a validated CSV dataset.

## Scope

This is a self-contained React/Vite implementation of the Dataset Statistics feature. It is designed to be developed and tested independently before integration with the team's upload (Task 2.1), validation (Task 2.2), and preview (Task 2.3) components.

Features:
- Dataset overview: rows, columns, missing cells, and duplicate rows.
- Per-column type inference and completeness.
- Numeric statistics: count, missing, mean, median, standard deviation (sample), min, quartiles, max, and outlier count using the 1.5×IQR rule.
- Categorical statistics: distinct count, most frequent value, and value-frequency distribution.
- Missing-value heat summary and column completeness indicators.
- Searchable/filterable statistics table, CSV export of the summary, and sample dataset.
- Explicit handling for empty input, ragged rows, blank headers, and mixed-type columns.
- Responsive layout and accessible status messages.

## Requirements

- Node.js 20+ recommended (Node.js 18+ may work with current Vite versions).
- npm.

## Run locally

```bash
npm install
npm run dev
```

Open the URL printed by Vite (normally `http://localhost:5173`).

## Quality checks

```bash
npm test
npm run build
```

The statistics engine has dependency-free Node tests. The UI uses React, Vite, Recharts, Papa Parse, and Lucide icons.

## How to use it

1. Start the application.
2. Upload a `.csv` file or load the included sample.
3. Review the overview cards, numeric summaries, categorical summaries, and column table.
4. Search columns or export the computed summary.

The browser-only demo parses CSV locally with Papa Parse. For the final integrated app, prefer sending validated data from the shared backend and call `calculateDatasetStatistics(rows, headers)` with the normalized rows and column names. Do not expose server filesystem paths or trust client-side validation as a security boundary.

## Integration contract

The primary utility is:

```js
import { calculateDatasetStatistics } from "./src/utils/datasetStatistics.js";

const report = calculateDatasetStatistics(rows, headers);
```

- `rows`: array of objects keyed by column name, or array of arrays if converted by the caller.
- `headers`: ordered array of column names.
- Returns `{ overview, columns, warnings }`.
- Each `columns` item includes `name`, `inferredType`, `total`, `missing`, `missingPercent`, `distinctCount`, `completenessPercent`, and either `numeric` or `categorical` statistics.

If using the Flask upload service, the integration endpoint should return parsed, validated rows (or a server-side dataset identifier and a statistics endpoint) rather than only a filesystem path. For large files, calculate statistics server-side and paginate results instead of transferring the whole dataset to the browser.

## Design decisions / limitations

- This module computes descriptive statistics; it does not train/evaluate ML models.
- Numeric parsing accepts finite numbers and numeric strings, but a column is treated as numeric only when all non-missing values parse as numbers.
- Blank strings, whitespace-only strings, and common null tokens (`NA`, `N/A`, `null`, `none`, `nan`) count as missing.
- Standard deviation is the **sample** standard deviation (denominator `n - 1`); it is `0` for one value and `null` if no numeric values exist.
- Quartiles use linear interpolation.
- Outliers are flagged with the 1.5×IQR rule; this is an exploratory indicator, not proof of data errors.
- Very high-cardinality categorical columns display the most frequent 10 values to keep the UI readable; the report retains distinct counts.
- Browser-only parsing is suitable for the mini-project demo, not a replacement for server-side security/validation.
