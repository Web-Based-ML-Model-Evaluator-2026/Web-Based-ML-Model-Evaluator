# Web-Based ML Model Evaluator

PES2UG24CS368	–	PRATHAM KUMAR		   - prathamkumar041104@gmail.com			

PES2UG24CS324	–	NIRUPAMA JAYARAMAN	- jnirupama06@gmail.com		

PES2UG25CS824	–	SHREYAS BELLAD		   - shreyasbellad2006@gmail.com		

PES2UG24CS339	–	PARINITHA ACHARYA	   - parinitha.acharya2006@gmail.com

## 1. Project Overview

The **Web-Based ML Model Evaluator** is a Software Engineering mini-project developed by Team 13. It provides a web-based workflow for managing projects, uploading and exploring datasets, preprocessing data, training machine-learning models, evaluating their performance, comparing results, and reviewing previous experiments.

The project follows an incremental **Scrum development approach**, organized around six sprints and 24 user stories. The repository contains individual task implementations, sprint-level integrations, project documentation, automated tests, and a final demonstration application.

The application supports supervised learning on tabular datasets for both classification and regression tasks.

## 2. Repository Structure

| Folder / File | Purpose |
|---|---|
| `.github/workflows/` | GitHub Actions workflows for automated checks. |
| `Sprint 1/` | Authentication, dashboard, project management, and access-control tasks. |
| `Sprint 1/Integrated-Application/` | Integrated Sprint 1 application. |
| `Sprint 2/` | Dataset upload, validation, preview, and statistics tasks. |
| `Sprint 2/Integrated-Application/` | Integrated Sprint 2 dataset workflow. |
| `Sprint 3/` | Missing-value handling, categorical encoding, feature scaling, and target/splitting tasks. |
| `Sprint 3/Integrated-Application/` | Integrated Sprint 3 preprocessing workflow. |
| `Sprint 4/` | Model selection, model configuration, training/testing, and evaluation metrics. |
| `Sprint 4/Integrated-Application/` | Integrated Sprint 4 machine-learning workflow. |
| `Sprint 5/` | Model comparison, visualizations, preferred-model selection, evaluation history, and release-readiness work. |
| `Sprint 5/Integrated-Application/` | Integrated Sprint 5 application and feature integrations. |
| `1st_Phase/` | Phase 1 submission documents. |
| `2nd_Phase/` | Phase 2 submission documents. |
| `3rd_Phase/` | Phase 3 submission documents. |
| `Final Integrated File/` | Final ModelLab demonstration application, including backend, frontend, datasets, tests, launcher, and documentation. |
| `README.md` | Main project overview and repository guide. |

## 3. Sprint 1 — Authentication and Project Management

**Objective:** Establish the application's foundation by implementing user access, navigation, and project management.

| Task | Assigned Member | Responsibility |
|---|---|---|
| Task 1.1 — Registration and Login | Pratham Kumar | Implement account registration, login, and related authentication workflows. |
| Task 1.2 — Dashboard and Navigation | Shreyas | Develop the dashboard layout and application navigation. |
| Task 1.3 — Project Creation and Management | Nirupama | Implement project creation and project-management functionality. |
| Task 1.4 — Access Control | Parinitha | Develop project ownership checks and input validation for access-controlled operations. |

**Sprint deliverable:** A foundational application supporting authentication, navigation, and user project management.

## 4. Sprint 2 — Dataset Upload and Exploration

**Objective:** Allow users to upload datasets, validate their contents, preview records, and inspect descriptive statistics.

| Task | Assigned Member | Responsibility |
|---|---|---|
| Task 2.1 — CSV Dataset Upload | Shreyas | Implement CSV upload and safe dataset storage. |
| Task 2.2 — Dataset Validation | Nirupama | Validate file type, size, encoding, headers, and CSV structure; reject invalid files. |
| Task 2.3 — Dataset Preview | Parinitha | Display dataset dimensions, column names, inferred data types, and sample rows. |
| Task 2.4 — Dataset Statistics | Pratham Kumar | Calculate and display dataset summaries, missing values, duplicate rows, numeric statistics, and categorical frequencies. |

**Sprint deliverable:** A dataset workflow connecting upload, validation, preview, and statistics.

## 5. Sprint 3 — Data Preprocessing

**Objective:** Provide preprocessing operations to prepare datasets for machine-learning workflows.

| Task | Assigned Member | Responsibility |
|---|---|---|
| Task 3.1 — Missing-Value Handling | Nirupama | Implement strategies for handling missing values, including imputation and removal options. |
| Task 3.2 — Categorical Encoding | Parinitha | Implement label encoding and one-hot encoding for categorical features. |
| Task 3.3 — Feature Scaling | Pratham Kumar | Implement standard scaling and min-max normalization for selected numerical features. |
| Task 3.4 — Target Selection and Data Splitting | Shreyas | Enable target-column selection and train/test split configuration or preview. |

**Sprint deliverable:** A preprocessing workflow combining missing-value handling, categorical encoding, feature scaling, and target/splitting configuration.

## 6. Sprint 4 — Model Training and Evaluation

**Objective:** Extend the preprocessing workflow with model selection, configuration, training, testing, and evaluation metrics.

| Task | Assigned Member | Responsibility |
|---|---|---|
| Task 4.1 — Model Selection | Parinitha | Provide model-selection functionality for supported machine-learning algorithms. |
| Task 4.2 — Model Configuration | Pratham Kumar | Configure model parameters and training options. |
| Task 4.3 — Model Training and Testing | Shreyas | Integrate model training and testing into the application workflow. |
| Task 4.4 — Evaluation Metrics | Nirupama | Calculate and present evaluation metrics for trained models. |

**Sprint deliverable:** A machine-learning workflow that selects and configures models, trains them, and evaluates their performance.

## 7. Sprint 5 — Comparison, Visualization, and Evaluation History

**Objective:** Help users interpret model results, compare candidate models, retain preferred choices, and revisit previous evaluations.

| Task | Assigned Member | Responsibility |
|---|---|---|
| Task 5.1 — Model Comparison | Pratham Kumar | Compare evaluation results across models and rank candidates using selected metrics. |
| Task 5.2 — Performance Visualizations and Reporting | Shreyas | Present evaluation results through visualizations and support report generation and export. |
| Task 5.3 — Preferred Model Selection | Nirupama | Save and retrieve a preferred model and its associated evaluation results. |
| Task 5.4 — Previous Evaluation History | Parinitha | Persist, list, retrieve, and delete previous evaluation records. |

**Sprint deliverable:** A results workflow supporting model comparison, performance visualization, preferred-model selection, and evaluation history.

## 8. Sprint 6 — Security and Release Readiness

Sprint 6 work is represented in the repository's cross-sprint task packages.

| Task | Repository Location | Responsibility |
|---|---|---|
| Task 6.3 — Security and Error Handling | `Sprint 5/Task 5.4_Parinitha_Previous_Evaluation_History/` | Validate requests and CSV uploads, handle errors safely, and support optional API-key access control. |
| Task 6.4 — End-to-End Testing and Release Readiness | `Sprint 5/Task-5.1_6.4_Pratham_Model-Comparison_E2E/` | Provide end-to-end smoke testing, integration guidance, and a release-readiness checklist. |

**Sprint deliverable:** Security and error-handling improvements, integration validation, and release-readiness testing resources.

## 9. Final Integrated Application

The `Final Integrated File/` folder contains the final ModelLab demonstration application.

### Main contents

- `backend/` — Python HTTP API, authentication, project and dataset endpoints, preprocessing, model training, evaluation, and report endpoints.
- `frontend/` — Browser-based single-page interface built with HTML, CSS, and JavaScript.
- `database/` — SQLite database location.
- `datasets/` — Five synthetic sample datasets and the upload directory.
- `tests/` — Automated application tests.
- `START-WINDOWS.bat` — Windows startup script.
- `RUN-TESTS-WINDOWS.bat` — Windows test runner.
- `README.md` — Application setup and usage instructions.
- `VERIFICATION-REPORT.md` — Application verification notes.

### Running the application

Requirements:
- Windows 10/11 (or Linux/macOS)
- Python 3.10 or newer
- Internet access for first-time dependency installation

On Windows:

1. Open the `Final Integrated File/` folder.
2. Double-click `START-WINDOWS.bat`.
3. Allow dependency installation if prompted.
4. Open `http://127.0.0.1:8000` in your browser.
5. Register, create a project, upload a CSV dataset, and run an experiment.
6. Stop the server with Ctrl+C in the console.

Alternatively, from the `Final Integrated File/` directory:

```powershell
python -m pip install -r backend\requirements.txt
python backend\server.py
```

### Running automated tests

Run `RUN-TESTS-WINDOWS.bat`, or execute:

```powershell
python -m unittest discover -s tests -v
```

Refer to `Final Integrated File/README.md` and `Final Integrated File/VERIFICATION-REPORT.md` for application-specific setup, test, and limitation details.

## 10. Supported Machine-Learning Workflow

The final demonstration supports the following end-to-end workflow:

1. **Register and sign in** — Create a local user account and authenticate.
2. **Create a project** — Organize datasets and experiments under a project.
3. **Upload a dataset** — Upload and validate a CSV file.
4. **Configure preprocessing** — Choose the target, task type, missing-value handling, categorical encoding, scaling, and train/test split.
5. **Train models** — Run supported classification or regression algorithms.
6. **Evaluate results** — Calculate task-appropriate metrics on held-out test data.
7. **Review history and compare** — Inspect saved experiments and compare model metrics.
8. **Export a report** — Download experiment metadata, configuration, and metrics as JSON.

### Supported models and metrics

**Classification models**
- Logistic Regression
- Decision Tree
- Random Forest
- Gradient Boosting
- Support Vector Machine (SVM)

**Classification metrics**
- Accuracy
- Weighted precision
- Weighted recall
- Weighted F1 score
- Confusion matrix

**Regression models**
- Linear Regression
- Decision Tree Regressor
- Random Forest Regressor
- Gradient Boosting Regressor
- Support Vector Regressor (SVR)

**Regression metrics**
- Mean Absolute Error (MAE)
- Root Mean Squared Error (RMSE)
- R² score

**Preprocessing options**
- Mean or mode imputation, or removal of incomplete rows
- One-hot or ordinal categorical encoding
- Standard or min-max scaling
- Configurable held-out test split

## 11. Included Sample Datasets

The final application includes synthetic demonstration datasets in `Final Integrated File/datasets/`:

| Dataset | Task | Target |
|---|---|---|
| `01_customer_churn_800x27.csv` | Classification | `churn` |
| `02_credit_default_750x30.csv` | Classification | `default` |
| `03_hospital_readmission_900x27.csv` | Classification | `readmission_30d` |
| `04_retail_sales_1000x27.csv` | Regression | `sales_amount` |
| `05_employee_attrition_650x28.csv` | Classification | `attrition` |

These datasets are synthetic teaching and demonstration examples, not real personal data.

## 12. Phase-wise Submission Documentation

| Phase | Document | Purpose |
|---|---|---|
| Phase 1 | Project Title Document | Identifies the project and team. |
| Phase 1 | Software Requirements Specification (SRS) | Documents the system's purpose, scope, requirements, and expected functionality. |
| Phase 2 | Software Test Plan (STP) | Defines the testing objectives, approach, scope, and planned verification activities. |
| Phase 3 | Software Architecture Document (SAD) | Describes the system architecture, components, responsibilities, and interactions. |

The `1st_Phase/`, `2nd_Phase/`, and `3rd_Phase/` folders organize the corresponding submission documents.

## 13. Scope and Limitations

The final application is intended for local academic demonstration.

- The server binds to `127.0.0.1` by default and should not be exposed publicly without additional security controls.
- Uploaded CSV files are subject to application validation and size limits.
- Trained estimators are evaluated and experiment metrics are persisted; model binaries are not currently serialized for later inference or deployment.
- Report export is provided in JSON format. PDF/CSV report formats and live deployment are outside the final demonstration build.
- Production deployment would require additional controls such as HTTPS, CSRF protections, rate limiting, hardened session management, database migrations, centralized logging, and stronger upload isolation.

## 14. Project Information

- **Project:** Web-Based ML Model Evaluator
- **Team:** Team 13
- **Development Methodology:** Scrum / Agile
- **Planned Sprints:** 6
- **Planned User Stories:** 24
- **Repository:** [Web-Based-ML-Model-Evaluator](https://github.com/Web-Based-ML-Model-Evaluator-2026/Web-Based-ML-Model-Evaluator)
