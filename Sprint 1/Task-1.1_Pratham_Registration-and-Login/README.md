# Task 1.1 Registration and Login

Owner: Pratham Kumar
Sprint: Sprint 1
Epic: User Authentication & Project Management

## Scope

This task provides a self-contained authentication module with:
- React + Vite registration and login pages.
- Express REST API.
- Server-side password hashing with `bcryptjs`.
- SQLite persistence for user accounts.
- JWT session token stored in an `HttpOnly` cookie.
- Input validation, generic login errors, basic rate limiting, security headers, and logout.
- A protected `/api/auth/me` endpoint to identify the current user.

## Requirements

- Node.js 20 or later
- npm

## Run locally

From this directory:

```bash
npm install
npm run dev
```

The frontend runs at `http://localhost:5173`; the API runs at `http://localhost:4000`.

For a production-style local build:

```bash
npm run build
npm start
```

The Express server serves the built frontend from `dist/` when the build exists.

## Environment

Copy `.env.example` to `.env` and set a unique `JWT_SECRET` before using this outside local development. Never commit `.env`.

## API endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Create an account |
| POST | `/api/auth/login` | Verify credentials and start a session |
| POST | `/api/auth/logout` | Clear the session cookie |
| GET | `/api/auth/me` | Return the authenticated user's public profile |

Registration expects `name`, `email`, and `password`. Login expects `email` and `password`.

## Data and security notes

- Passwords are hashed on the server with bcrypt; plain-text passwords are never stored.
- The password hash is never returned by the API.
- JWT is placed in an `HttpOnly`, `SameSite=Lax` cookie.
- This is a mini-project starter, not a security audit or production certification. Before public deployment, configure HTTPS, a strong secret, a persistent database location/backups, stricter deployment-specific cookie/CORS/CSRF policy, and operational monitoring.
- SQLite data is stored in `data/auth.sqlite` and is excluded from Git.
- The dashboard route is a handoff placeholder. During integration, connect successful authentication to Shreyas's existing dashboard without replacing his application entry point.

## Suggested verification

1. Register with a valid name, email, and password.
2. Try registering the same email again; it should be rejected.
3. Log in with the correct credentials.
4. Refresh the page; the session should still be recognized by `/api/auth/me`.
5. Log out; `/api/auth/me` should return `401`.
6. Try invalid email, too-short password, and incorrect credentials.
