# End-to-end release checklist

Run against the integrated app after teammates' branches are merged.

- [ ] Register a new user; reject duplicate registration.
- [ ] Log in and log out; protected pages require authentication.
- [ ] Create/select a project.
- [ ] Upload valid CSV; reject unsupported, empty, oversized, malformed CSV.
- [ ] Preview dataset and verify headers/row counts.
- [ ] Run preprocessing and verify the source upload remains unchanged.
- [ ] Select task type, model, and valid hyperparameters.
- [ ] Train at least two models using the same split.
- [ ] Verify metrics are computed from the same test set.
- [ ] Compare classification models (higher accuracy/precision/recall/F1 is better).
- [ ] Compare regression models (lower MAE/MSE/RMSE and higher R² is better).
- [ ] Verify the selected best model agrees with the chosen metric.
- [ ] Confirm visualizations reflect the actual evaluation records, not demo constants.
- [ ] Download PDF/CSV report and verify model name, task, hyperparameters, and metrics.
- [ ] Check API errors, browser console, network requests, and responsive layout.
- [ ] Run backend and frontend automated tests; record results and environment.
- [ ] Confirm no credentials, local databases, generated models, or secrets are committed.
