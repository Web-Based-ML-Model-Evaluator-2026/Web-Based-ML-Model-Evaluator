# 🧭 Sprint 1 - Task 1.2: User Dashboard & Navigation Layout

## 📖 Executive Summary
This module establishes the foundational user interface and client-side routing architecture for the ML Evaluator application. By delivering a cohesive, responsive dashboard layout, an intuitive navigation system, and a high-level project overview, this task sets the structural baseline and UI shell for all subsequent machine learning pipeline stages built in Sprints 2 through 4.

## 🏗️ System Architecture
- **Frontend Framework (React + Vite):** Employs a component-driven architecture to build a scalable layout shell, utilizing Vite for lightning-fast hot module replacement (HMR) and optimized production builds.
- **Styling Engine (Tailwind CSS):** Leverages utility-first CSS to create a highly responsive, modern, and accessible interface without the overhead of heavy custom stylesheets.
- **Client-Side Routing (React Router):** Manages view rendering and state persistence across different URLs, ensuring a seamless Single Page Application (SPA) experience without page reloads.

## 🚀 Core Functionalities
- **Global Navigation Structure:** Implements a persistent, user-friendly navigation bar and sidebar system, organizing routing links for the complete ML lifecycle (Upload, EDA, Data Splitting, Model Training, and Evaluation).
- **Dashboard Overview:** Delivers a landing page that summarizes the ML Evaluator project objectives, current pipeline status, and quick-start guidelines to orient the user.
- **Responsive UI Shell:** Ensures the application adapts fluidly to various screen sizes and resolutions using modern Flexbox and CSS Grid layouts.
- **Extensible Component Containers:** Standardizes the UI layout wrappers (`Layout.jsx`, `MainContent.jsx`), ensuring that teammate contributions in future sprints can seamlessly plug into the designated rendering area without breaking the global design.

## 🗺️ Navigation & Routing Reference
| Route Path | Component View | Purpose |
| :--- | :--- | :--- |
| `/` | `DashboardOverview` | Landing page featuring the project summary and status widgets. |
| `/upload` | `UploadPlaceholder` | Reserved route for Sprint 2 (Dataset Upload phase). |
| `/pipeline` | `PipelinePlaceholder` | Reserved route for Sprint 3 (Data Splitting & Preprocessing). |
| `*` | `NotFound / 404` | Catch-all route to handle invalid URLs gracefully and redirect users safely. |

## 🛠️ Local Setup & Execution
1. **Frontend Initialization:**
   Ensure you have Node.js installed, then run the following commands from the root of the frontend directory:
   ```bash
   # Navigate to the frontend directory
   cd frontend
   
   # Install required dependencies (React, React Router, Tailwind)
   npm install
   
   # Start the Vite development server
   npm run dev
