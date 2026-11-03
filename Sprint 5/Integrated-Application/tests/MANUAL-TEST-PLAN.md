# Manual acceptance test plan

1. Start with `START-WINDOWS.bat`; verify the homepage loads at `http://127.0.0.1:8000`.
2. Confirm `/api/health` returns JSON status `ok`.
3. Use sample CSV; verify 20 rows, 6 source columns, and 2 missing cells.
4. Run mean imputation + one-hot + standardization + target `churn` + 20% test. Verify 20 output rows, 16 train / 4 test, 0 missing cells, and `churn` is not in the feature column list.
5. Select label encoding and min-max scaling; run again and verify numeric feature values are in [0,1] for values fitted within training range.
6. Select drop rows; verify output row count decreases to 18 for the sample.
7. Upload a `.txt` file; the UI should reject it before submission.
8. Download transformed CSV; open it and verify headers and rows.
9. Upload malformed CSV (duplicate headers or missing header) and verify a clear error.
10. Stop server with Ctrl+C and restart; verify it starts cleanly.

Automated unit tests cover core transformation behavior. Browser interactions must be completed on the target Windows machine as part of final acceptance.
