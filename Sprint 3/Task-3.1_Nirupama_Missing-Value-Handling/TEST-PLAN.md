# Task 3.1 — Test Plan

## Automated (`npm test` in `MissingValueHandling_Demo`)
Covers missing-token detection, profiling, mean/median/mode/constant, drop rows/columns, skipped incompatible columns, empty columns, no-op on complete data, invalid input, tamper detection in validation, and CSV export.

## Manual
| ID | Test | Expected |
|---|---|---|
| TC-3.1-01 | Load sample data | 4 columns flagged, missing counts shown |
| TC-3.1-02 | Mean on all flagged columns | Numeric columns filled; text columns skipped with warning; validation fails "No missing values remain" |
| TC-3.1-03 | Mode on all flagged columns | All filled; validation passes |
| TC-3.1-04 | Constant `0` | Numeric columns get 0; text columns get "0" |
| TC-3.1-05 | Constant with empty box | "Enter a constant fill value." |
| TC-3.1-06 | Drop rows | Rows removed; row-loss warning if over 20% |
| TC-3.1-07 | Drop columns | Affected columns removed from preview and download |
| TC-3.1-08 | Uncheck all columns | Apply button disabled |
| TC-3.1-09 | Load CSV with no missing values | "No missing values found" message |
| TC-3.1-10 | Download processed CSV | File contains processed rows, no missing cells |
