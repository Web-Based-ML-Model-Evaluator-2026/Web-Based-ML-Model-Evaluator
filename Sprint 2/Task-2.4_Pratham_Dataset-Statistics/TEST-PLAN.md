# Task 2.4 — Test Plan

## Scope
Validate the descriptive-statistics engine and the user-facing CSV workflow.

## Automated unit tests
Run `npm test`. Tests cover:
1. Numeric and categorical summary calculations.
2. Common missing-value tokens and empty columns.
3. Sample standard deviation and IQR outlier detection.
4. Duplicate row detection and CSV report export.
5. Invalid API input and zero-column datasets.
6. Object rows keyed by column name.

## Manual functional tests

| ID | Test | Expected result |
|---|---|---|
| TC-2.4-01 | Load sample dataset | Overview and all statistics tabs display values |
| TC-2.4-02 | Upload valid CSV with numeric and text columns | Numeric and categorical profiles are computed |
| TC-2.4-03 | Upload `.txt` file | Clear unsupported-format message |
| TC-2.4-04 | Upload zero-byte CSV | Clear empty-file message |
| TC-2.4-05 | Upload CSV larger than 10 MB | Clear size-limit message |
| TC-2.4-06 | Upload header-only CSV | Empty-data warning is displayed |
| TC-2.4-07 | Upload CSV with blank header | Clear validation error |
| TC-2.4-08 | Upload CSV with inconsistent row field count | Row-specific parse error |
| TC-2.4-09 | Search for a column name | Matching columns remain visible |
| TC-2.4-10 | Filter by Numeric/Categorical/Empty | Only matching types display |
| TC-2.4-11 | Export summary | Browser downloads a CSV summary |
| TC-2.4-12 | Dataset has missing values | Missing count/percentage and completeness update |
| TC-2.4-13 | Dataset has repeated rows | Duplicate row count reflects exact repeated rows |
| TC-2.4-14 | Dataset has no numeric columns | Numeric tab shows a useful empty state |
| TC-2.4-15 | Dataset has high-cardinality categorical values | Top frequencies shown; truncation noted |

## Acceptance criteria
- The summary is calculated from the currently loaded dataset, never hard-coded.
- Numeric metrics are deterministic and documented.
- Missing values do not enter numeric calculations.
- Malformed row widths and empty headers are reported clearly.
- Search/filter/export controls work.
- `npm test` and `npm run build` complete successfully.
