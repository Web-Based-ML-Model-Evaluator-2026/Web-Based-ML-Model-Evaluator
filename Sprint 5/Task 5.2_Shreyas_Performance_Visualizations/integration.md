# Integration & Architecture Guide
**Module:** Performance Visualizations (Task 5.2) & Evaluation Reporting (Task 6.1)
**Assignee:** Shreyas Bellad

This document outlines the complete integration lifecycle for the Visualizations and Reporting module. It details exactly how this module inherits data from upstream teammate tasks, the strict JSON contracts required for state transfer, and the mounting instructions for the Task 6.2 integration phase.

---

## 1. Upstream Dependencies: What This Module Inherits

To maintain a decoupled architecture, this module does not fetch raw data from the database or run its own ML pipelines. Instead, it **inherits** processed data from the global state managed by teammates. 

Here is exactly what must be handed off to this module from prior sprints:

### A. Inherited from Data Preprocessing (Sprint 3)
*This data is required to populate the Dataset Summary cards and the 10-Tuple Preview Table in the Report component.*
*   **Dataset Dimensions:** The total number of rows (tuples) and columns (features) remaining after cleaning and splitting.
*   **Column Metadata:** The list of independent features and the designated target column.
*   **Statistical Means:** The calculated arithmetic averages for all numerical columns.
*   **Sample Data:** A raw JSON array containing exactly 10 rows from the processed dataset to serve as a preview in the final PDF report.

### B. Inherited from Model Training & Testing (Sprint 4 & Task 5.1)
*This data is required to drive the interactive Chart.js comparison charts.*
*   **Task Type:** A flag indicating whether the pipeline ran `"classification"` or `"regression"` (dictates the chart axes and metric labels).
*   **Batch Evaluation Results:** An array containing every model trained during the batch execution, along with their respective final scores (Accuracy, F1, RMSE, etc.).

### C. Inherited from Preferred Model Selection (Task 5.3)
*This data is required by the PDF and CSV Generator engine to stamp the final report.*
*   **Champion Model Details:** Once the user selects their preferred model from the teammate's UI, this module needs that specific model's name, its tuned hyperparameters, and its final metrics.

---

## 2. Global State Contracts (React Props)

The integrating teammate (handling Task 6.2) must inject the inherited data into this module using three specific React props. The application's global state (e.g., Redux store or React Context) must map to the following exact JSON structures:

### Contract 1: `visualizationData` 
Passed to `<MetricCharts />` to render the multi-model comparison.

## 3. Teammate Task Interactions (Sprint 5 & 6 Workflow)

To ensure a smooth, conflict-free integration phase, this module has been explicitly designed to work in tandem with the tasks developed by the rest of the team across Sprints 5 and 6. 

Here is the exact interaction model and handoff protocol between this module (Tasks 5.2 & 6.1) and the teammates' modules:

### A. Interaction with Task 5.1: Model Comparison Table (Teammate A)
- **The Relationship:** Sibling UI Components.
- **How it interacts:** Task 5.1 provides the raw numerical grid of results, while Task 5.2 (`MetricCharts`) provides the visual representation of those exact same results. Both components will sit side-by-side in the final Task 6.2 dashboard and consume the exact same `visualizationData` array from the global state. No direct data passing occurs between 5.1 and 5.2; they simply share the same upstream data source.

### B. Interaction with Task 5.3: Preferred Model Selection (Teammate C)
- **The Relationship:** Upstream Trigger.
- **How it interacts:** Teammate C is building the interface where the user formally selects the "Champion" model from the evaluation results. 
- **The Handoff:** Once the user clicks "Select Preferred Model" in Teammate C's component, the global state updates. My Task 6.1 (`ReportDownload`) listens for this global state change and immediately pulls the selected model's metadata into the `projectMetadata` prop, locking it in for PDF and CSV generation.

### C. Interaction with Task 5.4: Evaluation History Retrieval (Teammate D)
- **The Relationship:** Dynamic State Override.
- **How it interacts:** Teammate D allows users to fetch previously saved model evaluations from the database. 
- **The Handoff:** When a user loads a historical evaluation, the global state is overwritten. My components (`MetricCharts` and `ReportDownload`) will automatically unmount the current charts, safely destroy the Canvas instances, and re-render the historical data without requiring any page reloads or manual API re-fetching.

### D. Interaction with Task 6.2: API Integration & State Management (Teammate C)
- **The Relationship:** The Integrator.
- **How it interacts:** Teammate C is responsible for wiring the frontend to the backend. Because my tasks are fully decoupled, Teammate C only needs to import `<MetricCharts />` and `<ReportDownload />` into the master dashboard and pass the Redux/Context state into my props. My components handle all internal rendering and file streaming autonomously.

### E. Interaction with Task 6.3: Security & Access Control (Teammate D)
- **The Relationship:** API Wrapper / Middleware.
- **How it interacts:** Teammate D will implement JWT authentication and route security. To secure my module, Teammate D only needs to apply their `@jwt_required` (or equivalent) decorators to my Flask endpoints (`/api/report/pdf` and `/api/report/csv`). My frontend fetch requests are natively configured to accept authorization headers injected by the global Axios/Fetch interceptors.

### F. Interaction with Task 6.4: End-to-End Integration Testing (Teammate A)
- **The Relationship:** QA Target.
- **How it interacts:** Teammate A will write integration tests (e.g., Selenium/Cypress) for the final release. To test my module, Teammate A's scripts will simulate a user clicking the `id="download-pdf-btn"` and `id="download-csv-btn"` elements inside my `<ReportDownload />` component, verifying that the browser receives a `200 OK` binary file stream.

--

```json
{
  "task_type": "classification", 
  "metrics_list": ["Accuracy", "Precision", "Recall", "F1 Score"],
  "models": [
    { 
      "name": "Random Forest", 
      "scores": [0.94, 0.92, 0.91, 0.915] 
    },
    { 
      "name": "Logistic Regression", 
      "scores": [0.86, 0.84, 0.83, 0.835] 
    },
    { 
      "name": "Support Vector Machine", 
      "scores": [0.89, 0.88, 0.87, 0.880] 
    }
  ]
}

---
