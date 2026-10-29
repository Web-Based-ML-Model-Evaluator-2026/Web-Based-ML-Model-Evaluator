# Sprint 4: Task 4.3 - Model Training and Testing Engine

## 🎯 What is this Task?
Task 4.3 is responsible for the core execution pipeline of the ML model evaluator. Once a dataset is preprocessed, algorithm-selected, and configured, this module takes over to train the model using `scikit-learn`, generate test set predictions, save the output files securely, and return real-time operational telemetry back to the user interface.

---

## 🛠️ Tech Stack & Libraries Used
* **Backend:** Python 3.12, Flask, Flask-CORS
* **Machine Learning:** scikit-learn, joblib (for model persistence)
* **Frontend:** React, Vite, Tailwind CSS, Axios, Lucide React (Icons)
* **Automation:** GitHub Actions (CI/CD pipeline validation)

---

## ⚙️ What It Is Doing (Detailed Breakdown)

### 1. The Backend Training Engine (`model_trainer.py`)
* **Dynamic Model Mapping:** Automatically matches the selected algorithm name (e.g., *Logistic Regression, Random Forest, Support Vector Machines, Linear Regression*) to its proper `scikit-learn` class.
* **Deterministic Execution:** Automatically configures `random_state=42` where applicable to ensure reproducible, consistent training results.
* **Execution & Inference:** Executes `.fit(X_train, y_train)` on the training splits and runs `.predict(X_test)` to generate test inferences.
* **Artifact Persistence:** Safely serializes the trained model into a `.joblib` file stored on disk (`models/`) and writes the prediction results into a CSV file (`results/predictions.csv`) so they are instantly accessible for downstream tasks.

### 2. The REST API Layer (`server.py`)
* Exposes a secure `POST /api/train` endpoint that acts as a receiver for dataset configurations.
* Triggers the training engine safely in the background and returns structured JSON telemetry (including execution duration, sample counts, and artifact paths).
* Implements robust error-catching to return clean error messages to the UI if a training job encounters an invalid configuration.

### 3. The Frontend Execution UI (`ModelTrainer.jsx`)
* **Non-Blocking Interface:** Uses asynchronous JavaScript (`async/await`) so the browser remains fully responsive and smooth while the backend is computing heavy machine learning loops.
* **State Management:** Manages clear visual states (`idle` $\rightarrow$ `running` $\rightarrow$ `completed` or `error`) complete with animated loading indicators.
* **Telemetry Dashboard:** Renders an analytics summary card upon completion, displaying the active algorithm, execution time in seconds, and total rows evaluated.

### 4. Automated CI/CD Pipeline
* Runs automated GitHub Actions workflows on every push to validate code stability:
  * **Backend Job:** Installs Python dependencies and runs automated syntax compilation checks.
  * **Frontend Job:** Installs Node dependencies and tests production build compilation for Vite and Tailwind.

---

## 🤝 How It Fits With the Team
To ensure seamless collaboration without merge conflicts, this module strictly maintains its boundaries:
* **Receives Data From:** Task 4.1 (Algorithm selection) and Task 4.2 (Hyperparameters). *(Currently mocked for standalone testing).*
* **Executes:** Task 4.3 (Model training, `.fit()`, `.predict()`, and UI execution telemetry).
* **Hands Off To:** Task 4.4 (Teammate C reads the saved `predictions.csv` and model files to compute accuracy, RMSE, and visual performance metrics).
