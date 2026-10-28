# 🖥️ Sprint 1 - Task 1.2: User Dashboard & Navigation Layout

## 📖 Executive Summary
This module establishes the foundational User Interface (UI) and global routing architecture for the ML Evaluator web application. It delivers a centralized dashboard for project overviews and a persistent navigation system. As the primary structural shell of the application, this task ensures that all future sprint modules (Data Upload, Preprocessing, Splitting, and Evaluation) can seamlessly plug into a cohesive, responsive Single Page Application (SPA) environment.

## 🏗️ System Architecture
- **Frontend Framework (React + Vite):** Utilizes Vite for lightning-fast Hot Module Replacement (HMR) and optimized production builds. 
- **Styling Engine (Tailwind CSS):** Implements a utility-first CSS design system to guarantee a fully responsive layout across desktop and mobile viewports using modern Flexbox and Grid paradigms.
- **Routing Layer (React Router):** Manages client-side navigation without page reloads, maintaining application state and ensuring smooth transitions between different machine learning pipeline stages.

## 🚀 Core Functionalities
- **Global Navigation System:** A persistent sidebar/top navigation bar that provides intuitive access to core application workflows (Dashboard, Dataset Ingestion, Data Preprocessing, Model Training, and Evaluation).
- **Project Overview Dashboard:** A centralized landing page displaying high-level project metrics, pipeline progress indicators, and system health status.
- **Responsive Layout Shell:** A modular UI wrapper that adapts to different screen sizes, ensuring the complex data tables and charts in future sprints have a stable, scrollable container.
- **Dynamic Active States:** Visual feedback on navigation links to indicate the user's current location within the multi-step ML evaluation process.
- **Component Modularity:** Clean separation of UI components (`Sidebar.jsx`, `Navbar.jsx`, `Dashboard.jsx`) to allow parallel development by team members in subsequent sprints.

## 🛠️ Local Setup & Execution
1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   npm run dev
