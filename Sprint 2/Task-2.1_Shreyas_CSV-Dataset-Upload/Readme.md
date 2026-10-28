# 📁 Sprint 2 - Task 2.1: CSV Dataset Upload & Safe File Storage

## 📖 Executive Summary
This module acts as the primary data ingestion gateway for the ML Evaluator system. It provides a secure, user-friendly interface for uploading raw tabular datasets and safely persisting them to the backend file system. This foundational task ensures that all downstream exploratory data analysis (EDA) and preprocessing modules have access to verified, sanitized CSV data.

## 🏗️ System Architecture
- **Frontend (React + Vite + Tailwind):** Features a drag-and-drop enabled file upload zone with visual feedback for accepted file types, file size validation, and upload progress states.
- **Backend File Manager (Python + Flask + Werkzeug):** Utilizes strict routing and cryptographic filename sanitization to parse incoming multipart/form-data and safely store the CSV without exposing the server to directory traversal vulnerabilities.

## 🚀 Core Functionalities
- **Secure Ingestion Pipeline:** Implements `werkzeug.utils.secure_filename` to strip malicious characters from uploaded files before saving them to the host OS.
- **Strict Format Validation:** Enforces MIME-type and extension checking, strictly rejecting `.xlsx`, `.txt`, `.json`, or corrupted payloads, ensuring only standard `.csv` files enter the pipeline.
- **Graceful Error Handling:** Provides clear, actionable UI feedback if an upload fails, a file exceeds the memory limits, or the user submits an empty request.
- **Persistent Storage Handoff:** Saves the verified dataset to a protected `backend/uploads/` directory, acting as the single source of truth for upcoming Sprint 2 data cleaning tasks.

## 🔌 API Reference
| Endpoint | Method | Purpose | Payload/Response |
| :--- | :---: | :--- | :--- |
| `/api/upload` | `POST` | Ingests the raw dataset from the client. | Accepts `multipart/form-data`. Returns success status and saved file path. |
| `/api/upload/status` | `GET` | Checks if a valid dataset is currently loaded in the system. | Returns boolean and active filename. |

## 🛠️ Local Setup & Execution
1. **Initialization:**
   ```bash
   cd backend
   pip install -r requirements.txt
   python server.py

   cd frontend
   npm run dev
