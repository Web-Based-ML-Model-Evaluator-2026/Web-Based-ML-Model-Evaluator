# Task 1.4 — Sample Access Control and Validation

This standalone demo scaffold uses a fictional sample project named **Iris Flower Classifier**. It demonstrates ownership checks and input validation; it is not the team's production application.

## Contents
- `backend/projects/`: example Django REST Framework app
- `frontend/src/`: frontend validation and demo form
- `INTEGRATION_TODO.md`: checklist

The backend files are an example Django app, not a complete Django project. They need Django settings, `manage.py`, app registration, and URL wiring before tests can run. Adapt them to your team's actual model, routes, and authentication before merging.

API example: `GET/POST /api/projects/`, `GET/PATCH/DELETE /api/projects/<id>/`. Authenticated users only see projects they own. Project names are trimmed, required, and limited to 100 characters.
