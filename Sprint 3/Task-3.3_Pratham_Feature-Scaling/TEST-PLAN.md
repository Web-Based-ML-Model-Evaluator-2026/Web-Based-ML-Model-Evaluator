# Test Plan — Task 3.3 Feature Scaling

## Automated checks
Run `npm test` in `FeatureScaling_Demo`.

Cases covered:
1. Standard scaling yields approximately zero mean and unit population standard deviation.
2. Min-max normalization maps minimum/maximum to 0/1.
3. Custom min-max output range is honored.
4. Unselected categorical columns remain unchanged.
5. Missing values are preserved and ignored when fitting.
6. Invalid non-empty numeric values are rejected.
7. Constant numeric columns are handled deterministically and reported.
8. Input objects are not mutated.
9. Empty rows/columns and invalid range values are rejected.
10. CSV export escapes commas, quotes and newlines.

## Manual checks
- Load the sample CSV and select `study_hours` and `attendance`.
- Choose Standard scaling; verify transformed values and validation summary.
- Choose Min-max normalization; verify selected columns are in [0, 1].
- Upload a CSV containing a non-numeric token in a selected numeric column; verify a clear error is shown.
- Export the processed CSV and confirm non-selected columns remain present.
