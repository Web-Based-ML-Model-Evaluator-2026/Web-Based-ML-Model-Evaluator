# Manual Test Plan — Task 1.1

Run `npm install` and `npm run dev` before testing.

| ID | Test | Expected result |
|---|---|---|
| AUTH-01 | Open `/register` | Registration form is displayed |
| AUTH-02 | Submit blank registration form | Browser/client validation prevents submission |
| AUTH-03 | Register with malformed email | Validation error appears |
| AUTH-04 | Register with password under 8 characters | Validation error appears |
| AUTH-05 | Register with valid details | Account is created and user is signed in |
| AUTH-06 | Register the same email again | API responds `409`; no duplicate user |
| AUTH-07 | Inspect SQLite `users` table | `password_hash` contains a bcrypt hash, not the submitted password |
| AUTH-08 | Log in with correct credentials | User is signed in and redirected to handoff route |
| AUTH-09 | Log in with incorrect password | Generic `401 Invalid email or password` |
| AUTH-10 | Refresh after login | Session is recovered through `/api/auth/me` |
| AUTH-11 | Log out then request `/api/auth/me` | API responds `401` |
| AUTH-12 | Send malformed API payload | API responds `400` with validation message |
| AUTH-13 | Make repeated auth requests | Rate limit eventually returns `429` |
| AUTH-14 | Call an unknown `/api` route | API responds `404` JSON |

This plan is not a substitute for running automated integration tests in the target environment.
