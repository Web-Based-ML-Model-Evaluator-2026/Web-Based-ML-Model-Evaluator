# Web-Based ML Model Evaluator

## 1. Project Overview

The **Web-Based ML Model Evaluator** is a Software Engineering mini-project developed by Team 13. It aims to provide a web-based workflow for user management, dataset upload, dataset exploration, and preprocessing before subsequent machine learning activities.

The project follows an incremental **Scrum development approach**, with six planned sprints and 24 user stories. This repository documents the individual task implementations, sprint integrations, submission documents, and final demonstration application.

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
| `1st_Phase/` | Phase 1 submission documents. |
| `2nd_Phase/` | Phase 2 submission documents. |
| `3rd_Phase/` | Phase 3 submission documents. |
| `Final Integrated File/` | Final local demonstration build, including application code, data, tests, launcher, and documentation. |
| `README.md` | Main project overview and repository guide. |

## 3. Sprint 1 — Authentication and Project Management

**Objective:** Establish the application's foundation by implementing user access, navigation, and project management.

| Task | Assigned Member | Responsibility |
|---|---|---|
| Task 1.1 — Registration and Login | Pratham Kumar | Implement account registration, login, and related authentication workflows. |
| Task 1.2 — Dashboard and Navigation | Shreyas | Develop the dashboard layout and application navigation. |
| Task 1.3 — Project Creation and Management | Neerupama | Implement project creation and project-management functionality. |
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

**Objective:** Provide preprocessing operations to prepare datasets for subsequent machine learning workflows.

| Task | Assigned Member | Responsibility |
|---|---|---|
| Task 3.1 — Missing-Value Handling | Nirupama | Implement strategies for handling missing values, including imputation and removal options. |
| Task 3.2 — Categorical Encoding | Parinitha | Implement label encoding and one-hot encoding for categorical features. |
| Task 3.3 — Feature Scaling | Pratham Kumar | Implement standard scaling and min-max normalization for selected numerical features. |
| Task 3.4 — Target Selection and Data Splitting | Shreyas | Enable target-column selection and train/test split preview. |

**Sprint deliverable:** A preprocessing workflow that combines missing-value handling, categorical encoding, feature scaling, and target/splitting configuration.

## 6. Final Integrated Application

The `Final Integrated File/` folder contains the final demonstration build intended to bring the core Sprint 1–3 workflows together.

### Main contents

- `app/` — Python server and browser interface.
- `data/` — SQLite database.
- `sample-data/` — Sample customer churn CSV dataset.
- `tests/` — Automated tests.
- `reference-source/` — Retained team source snapshot for reference.
- `START-WINDOWS.bat` — Windows startup script.
- `README.md` — Application setup and usage instructions.
- `TEST-REPORT.txt` — Packaging verification report.

### Running the application

1. Ensure Python 3.10 or newer is installed.
2. Open the `Final Integrated File/` folder.
3. Run `START-WINDOWS.bat`, or execute this command in PowerShell from that folder:

   ```powershell
   py -3 app\server.py
   ```

4. Open `http://127.0.0.1:8000` in your browser.
5. Register, create a project, load the sample dataset or upload a CSV, and explore the available preprocessing workflow.

To run automated tests:

```powershell
py -3 -m unittest discover -s tests -v
```

Refer to the final application's README and test report for validation details and limitations.

## 7. Phase-wise Submission Documentation

| Phase | Document | Purpose |
|---|---|---|
| Phase 1 | Project Title Document | Identifies the project and team. |
| Phase 1 | Software Requirements Specification (SRS) | Documents the system's purpose, scope, requirements, and expected functionality. |
| Phase 2 | Software Test Plan (STP) | Defines the testing objectives, approach, scope, and planned verification activities. |
| Phase 3 | Software Architecture Document (SAD) | Describes the system's architecture, components, responsibilities, and interactions. |

The `1st_Phase/`, `2nd_Phase/`, and `3rd_Phase/` folders organize the corresponding submission documents.

## 8. Current Scope and Limitations

The current demonstration focuses on the core Sprint 1–3 workflow.

- The original uploaded CSV is retained unchanged during preprocessing previews.
- Train/test splitting is represented as a preview; a persisted model-ready split is not claimed.
- Model training, evaluation, comparison, and reporting are planned for later development and are not claimed as implemented in this demonstration.
- OTP email delivery and production CAPTCHA are not included.
- The final demonstration is intended for local academic use, not public production deployment.

## 9. Future Development

The approved project plan contains six sprints. Subsequent work is intended to extend the application toward model selection, training, evaluation, comparison, and reporting, in accordance with the remaining backlog.

## 10. Project Information

- **Project:** Web-Based ML Model Evaluator
- **Team:** Team 13
- **Development Methodology:** Scrum / Agile
- **Repository:** [Web-Based-ML-Model-Evaluator](https://github.com/Web-Based-ML-Model-Evaluator-2026/Web-Based-ML-Model-Evaluator)
