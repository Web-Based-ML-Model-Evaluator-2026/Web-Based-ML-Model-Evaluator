# Sprint 4 Integrated Application

## Base application
This package starts from the repository's Sprint 3 Integrated-Application, preserving its preprocessing UI and Python HTTP API.

## Cumulative feature modules
- `evaluation-metrics/` — task implementation bundled as a modular feature area.
- `model-configuration/` — task implementation bundled as a modular feature area.
- `model-selection/` — task implementation bundled as a modular feature area.
- `model-training-testing/` — task implementation bundled as a modular feature area.

## Important integration boundary
The task folders are included in this cumulative application package and retain their own source, tests, and integration notes. They use different backend/frontend stacks (including Flask/React/Vite modules), so they are kept modular rather than being falsely represented as fully wired into the Sprint 3 vanilla frontend and standard-library HTTP server.

## Run the base integrated application
From this directory:
```powershell
py backend/server.py
```
Then open http://127.0.0.1:8000.

## Verification
The base app is the Sprint 3 integrated app. Task-level tests and setup instructions are in each `features/<feature>/` folder. Run those tests using each feature's README/requirements before claiming end-to-end integration.

## Suggested next integration steps
1. Select a single application backend framework and register each task's routes/blueprints.
2. Connect frontend task components to the shared app navigation and API client.
3. Run backend unit tests and browser E2E tests against the assembled application.
