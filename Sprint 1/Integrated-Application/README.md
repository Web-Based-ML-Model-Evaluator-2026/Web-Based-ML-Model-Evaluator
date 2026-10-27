# Web-Based ML Model Evaluator — Sprint 1 Integrated Build

This is a **single application build** prepared from the team's uploaded Sprint 1 repository ZIP. It brings the sprint's core user-facing flow together:
- **Task 1.1 — Registration and login:** reuses the submitted Express/SQLite authentication implementation, bcrypt password hashing, JWT session cookie, and protected session endpoint.
- **Task 1.2 — Dashboard and navigation:** provides one shared authenticated workspace, responsive navigation, project overview, search, and signed-in user display.
- **Task 1.3 — Project creation and management:** creates, lists, edits, searches, and deletes projects through the same app and database.
- **Task 1.4 — Access control and validation:** enforces owner-scoped project API operations on the server; validates project names and descriptions; rejects duplicate names for the same user.

Task 1.4's original Django files explicitly described themselves as an example scaffold needing adaptation to the team's actual model and authentication. To avoid running a second framework/backend beside Task 1.1, its ownership/validation intent is integrated into the existing Express API. The original individual task folders are not bundled inside this integrated project.

## Requirements
- Node.js 20+
- npm

## Setup
1. Extract this folder.
2. Run `npm install`.
3. Copy `.env.example` to `.env`.
4. Set a fresh, long, random `JWT_SECRET` in `.env`. Never commit `.env`.
5. Run `npm run dev`.
6. Open `http://127.0.0.1:5173`.

The frontend runs on Vite and the API on `http://127.0.0.1:4000`. For a production-style local build, run `npm run build` then `npm start`.

## Core API
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/projects`
- `POST /api/projects`
- `PATCH /api/projects/:id`
- `DELETE /api/projects/:id`

All project endpoints require an authenticated session. A user can only list or mutate projects whose `owner_id` matches their authenticated user ID; owner IDs are never accepted from the browser.

## Sprint 1 scope boundary
Datasets, preprocessing, model training/evaluation, result comparison, and report generation are navigation placeholders for future sprint work; they are not implemented by this Sprint 1 integration.

## Verification
Run:
- `npm run check` — JavaScript syntax checks
- `npm test` — project-name validation tests
- `npm run build` — frontend production build

These checks should be run after installing dependencies in your environment. This archive has been assembled from the submitted source files, but was not executed in this environment, so please verify the commands before submitting.
