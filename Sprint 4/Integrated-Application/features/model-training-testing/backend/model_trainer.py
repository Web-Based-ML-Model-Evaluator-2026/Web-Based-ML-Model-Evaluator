"""
=============================================================================
TASK 4.3: MODEL TRAINING AND INFERENCE ENGINE
=============================================================================
Module: model_trainer.py
Purpose:
  Ingests split datasets from Sprint 3, trains the selected scikit-learn
  model, generates predictions on the test set, and securely persists
  the model artifacts and prediction results to the filesystem.
=============================================================================
"""

import os
import time
import pandas as pd
import joblib
from sklearn.linear_model import LogisticRegression, LinearRegression, Ridge, Lasso
from sklearn.tree import DecisionTreeClassifier, DecisionTreeRegressor
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.svm import SVC
from sklearn.neighbors import KNeighborsClassifier
from sklearn.naive_bayes import GaussianNB

class ModelTrainerEngine:
    def __init__(self, splits_dir="splits", models_dir="models", results_dir="results"):
        """
        Initializes the training engine and ensures artifact directories exist.
        """
        self.splits_dir = splits_dir
        self.models_dir = models_dir
        self.results_dir = results_dir

        for directory in [self.models_dir, self.results_dir]:
            if not os.path.exists(directory):
                os.makedirs(directory)

        # Catalogue of supported models based on ML-F-020 and ML-F-021
        self.supported_models = {
            "classification": {
                "Logistic Regression": LogisticRegression,
                "Decision Tree": DecisionTreeClassifier,
                "Random Forest": RandomForestClassifier,
                "SVM": SVC,
                "k-NN": KNeighborsClassifier,
                "Naive Bayes": GaussianNB
            },
            "regression": {
                "Linear Regression": LinearRegression,
                "Ridge": Ridge,
                "Lasso": Lasso,
                "Decision Tree Regressor": DecisionTreeRegressor,
                "Random Forest Regressor": RandomForestRegressor
            }
        }

    def _load_splits(self):
        """Helper to load train/test splits from disk."""
        try:
            X_train = pd.read_csv(os.path.join(self.splits_dir, "X_train.csv"))
            X_test = pd.read_csv(os.path.join(self.splits_dir, "X_test.csv"))
            y_train = pd.read_csv(os.path.join(self.splits_dir, "y_train.csv")).squeeze() # Flatten to 1D array
            y_test = pd.read_csv(os.path.join(self.splits_dir, "y_test.csv")).squeeze()
            return X_train, X_test, y_train, y_test
        except FileNotFoundError:
            raise FileNotFoundError("Split datasets not found. Please ensure Task 3.4 (Data Splitting) was completed.")

    def train_and_predict(self, task_type: str, model_name: str, hyperparameters: dict = None):
        """
        Executes the full training and prediction pipeline.
        
        Args:
            task_type: 'classification' or 'regression'
            model_name: The string name of the model to instantiate.
            hyperparameters: Dictionary of parameters to pass to the model.
            
        Returns:
            Dictionary containing metadata about the training run.
        """
        if hyperparameters is None:
            hyperparameters = {}

        # 1. Validation & Security Guards (PRJ-SR-005)
        if task_type not in self.supported_models:
            raise ValueError(f"Unsupported task type: {task_type}. Must be 'classification' or 'regression'.")
        
        if model_name not in self.supported_models[task_type]:
            raise ValueError(f"Model '{model_name}' is not supported for {task_type}.")

        # 2. Load Data (FR1)
        X_train, X_test, y_train, y_test = self._load_splits()

        if X_train.empty or y_train.empty:
            raise ValueError("Training datasets are empty. Cannot train model.")

        # 3. Instantiate Model (FR3 & NFR4 Determinism)
        # Force random_state for reproducible test results if the model supports it
        if "random_state" not in hyperparameters and model_name in ["Random Forest", "Decision Tree", "Random Forest Regressor", "Decision Tree Regressor", "Logistic Regression"]:
            hyperparameters["random_state"] = 42

        model_class = self.supported_models[task_type][model_name]
        try:
            model_instance = model_class(**hyperparameters)
        except Exception as e:
            raise ValueError(f"Invalid hyperparameters provided for {model_name}: {str(e)}")

        # 4. Train Model (FR3)
        start_time = time.time()
        model_instance.fit(X_train, y_train)
        training_duration = time.time() - start_time

        # 5. Generate Predictions (FR4)
        y_pred = model_instance.predict(X_test)

        # 6. Artifact Serialization (FR5)
        model_filename = f"{model_name.replace(' ', '_').lower()}_model.joblib"
        model_path = os.path.join(self.models_dir, model_filename)
        joblib.dump(model_instance, model_path)

        predictions_df = pd.DataFrame({
            "actual": y_test,
            "predicted": y_pred
        })
        predictions_path = os.path.join(self.results_dir, "predictions.csv")
        predictions_df.to_csv(predictions_path, index=False)

        # 7. Return Telemetry & Metadata
        return {
            "status": "completed",
            "model_name": model_name,
            "task_type": task_type,
            "training_duration_seconds": round(training_duration, 4),
            "test_samples_predicted": len(y_pred),
            "model_path": model_path,
            "predictions_path": predictions_path
        }