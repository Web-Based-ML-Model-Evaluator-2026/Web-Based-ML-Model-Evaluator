# Sprint 4 — Task 4.1: Task and Model Selection

This starter implements the frontend selection step for the Web-Based ML Model Evaluator.

## Requirements covered
- Select Classification or Regression.
- Show only compatible algorithms for the selected task type.
- Validate that the selected algorithm belongs to the selected task type.
- Send the selection through an `onSelectionChange` callback.
- Include sample CSV files and an integration guide.

## Folder structure
```text
Task-4.1_Parinitha_Model-Selection/
├── frontend/src/components/ModelSelection.jsx
├── frontend/src/utils/modelSelection.js
├── sample-data/classification_sample.csv
├── sample-data/regression_sample.csv
├── README.md
└── INTEGRATION_GUIDE.md
```

This is a component starter, not a complete standalone React app. Integrate it into your team's existing frontend. Do not copy `node_modules` into your task folder or GitHub.

## Selection payload example
```js
{ taskType: "classification", algorithm: "logistic_regression" }
```
See `modelSelection.js` for the supported algorithm IDs.
