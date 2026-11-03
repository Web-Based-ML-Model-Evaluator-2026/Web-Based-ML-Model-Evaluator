# Performance Visualizations & Evaluation Report Generation

This module provides an interactive metric visualization engine and automated report generation pipeline for the ML Evaluator system. It allows users to visually compare multiple trained models across standard evaluation metrics and export evaluation reports in PDF and CSV formats.

---

## Features

### 1. Model Performance Visualizations
- Grouped bar charts built using Chart.js to compare multiple trained models side-by-side.
- Classification metrics support: Accuracy, Precision, Recall, and F1-Score (bounded y-axis: 0.0 to 1.0).
- Regression metrics support: Mean Absolute Error (MAE), Root Mean Squared Error (RMSE), and R² Score (dynamically scaled).
- Explicit Chart.js canvas instance cleanup upon unmount/re-render to prevent memory leaks and duplicate canvas bindings.

### 2. Dataset Summary & Preview
- Real-time display of total sample count (N), total feature count (M), target column name, and selected model identity.
- Summary of calculated arithmetic means for all numerical features.
- Formatted tabular preview displaying the first 10 sample tuples of the active dataset.

### 3. Report Generation & Export Engine
- PDF Report Generation: Server-side rendering using ReportLab, compiling dataset summary, model configuration, hyperparameters, evaluation metrics, and sample tuples into an exportable document.
- CSV Summary Export: Real-time generation and streaming of tabular evaluation results via an in-memory buffer.

---

## Directory Structure

```text
Task 5.2_Shreyas_Performance_Visualizations/
├── backend/
│   ├── report_generator.py      # PDF & CSV generation engine (ReportLab)
│   ├── requirements.txt         # Python dependencies
│   └── server.py                # Flask API routes (/api/visualize, /api/report/*)
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx              # Main UI container & state coordinator
│       ├── index.css            # Tailwind directives
│       ├── main.jsx             # React DOM entrypoint
│       └── components/
│           ├── MetricCharts.jsx # Chart.js visualization component
│           └── ReportDownload.jsx # Summary tables & export triggers
├── INTEGRATION.md               # Teammate integration guide & API contract
└── README.md                    # Module documentation
