# Integration map

| Team task | Integrated location | How it is connected |
|---|---|---|
| 1.1 Registration and login | `src/pages/LoginPage.jsx`, `src/pages/RegisterPage.jsx`, `src/context/AuthContext.jsx`, `server/auth.js`, `server/db.js` | Original submitted auth frontend/backend retained and used as the only session system |
| 1.2 Dashboard and navigation | `src/pages/WorkspacePage.jsx`, `src/styles.css` | Shared authenticated workspace with navigation and overview |
| 1.3 Project creation and management | `src/pages/WorkspacePage.jsx`, `src/services/projectService.js`, `server/projects.js` | Create/list/search/edit/delete connected to persistent SQLite API |
| 1.4 Access control and validation | `server/projects.js` | Owner-scoped SQL operations and server-side validation integrated into existing Express backend |

Integration choices:
- One React/Vite frontend, one Express API, one SQLite database, one authentication mechanism.
- Project ownership is enforced on the server, not just by filtering client-side data.
- Dataset/model pages are labelled as future-sprint placeholders rather than falsely represented as implemented.
