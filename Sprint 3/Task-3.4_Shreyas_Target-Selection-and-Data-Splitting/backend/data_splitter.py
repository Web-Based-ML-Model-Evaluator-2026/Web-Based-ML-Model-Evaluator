"""
=============================================================================
TASK 3.4: AUTOMATED DATA SPLITTING ENGINE
=============================================================================
Automatically determines:
  - Classification vs Regression target types.
  - Class stratification eligibility.
  - Optimal shuffling and reproducible seed defaults.
=============================================================================
"""

import os
from typing import Dict, Any
import pandas as pd
from sklearn.model_selection import train_test_split


class DataSplitterEngine:
    def __init__(self, storage_dir: str = "splits"):
        self.storage_dir = storage_dir
        os.makedirs(self.storage_dir, exist_ok=True)

    def validate_and_split(
        self,
        df: pd.DataFrame,
        target_column: str,
        test_size: float = 0.2,
        random_state: int = 42,
        shuffle: bool = True,
        auto_stratify: bool = True
    ) -> Dict[str, Any]:
        """
        Validates target column, automatically determines stratification,
        partitions X and y, and exports artifacts to splits/ directory.
        """
        if df.empty:
            raise ValueError("The provided dataset is empty (0 rows).")

        if target_column not in df.columns:
            raise ValueError(f"Target column '{target_column}' does not exist in dataset.")

        if df[target_column].isnull().all():
            raise ValueError(f"Target column '{target_column}' contains only null values.")

        feature_columns = [col for col in df.columns if col != target_column]
        if len(feature_columns) == 0:
            raise ValueError("Dataset must contain at least one feature column besides the target.")

        X = df[feature_columns]
        y = df[target_column]

        # -------------------------------------------------------------------
        # AUTOMATIC TARGET & STRATIFICATION DETECTION
        # -------------------------------------------------------------------
        stratify_target = None
        detected_problem_type = "Regression"

        # Check if target is categorical or low-cardinality discrete values (Classification)
        unique_count = y.nunique()
        is_categorical = (
            y.dtype == "object"
            or y.dtype.name == "category"
            or unique_count <= max(2, int(len(df) * 0.05))
        )

        if is_categorical:
            detected_problem_type = f"Classification ({unique_count} classes)"
            if auto_stratify and shuffle:
                class_counts = y.value_counts()
                # Stratification is valid if each class has at least 2 samples
                if len(class_counts) > 1 and (class_counts >= 2).all():
                    stratify_target = y

        # Execute split
        X_train, X_test, y_train, y_test = train_test_split(
            X,
            y,
            test_size=test_size,
            random_state=random_state,
            shuffle=shuffle,
            stratify=stratify_target
        )

        # Cache partitions to disk for downstream model training (Sprint 4)
        X_train.to_csv(os.path.join(self.storage_dir, "X_train.csv"), index=False)
        X_test.to_csv(os.path.join(self.storage_dir, "X_test.csv"), index=False)
        y_train.to_csv(os.path.join(self.storage_dir, "y_train.csv"), index=False)
        y_test.to_csv(os.path.join(self.storage_dir, "y_test.csv"), index=False)

        return {
            "target_column": target_column,
            "feature_columns": feature_columns,
            "total_rows": len(df),
            "test_size_ratio": test_size,
            "train_size_ratio": round(1.0 - test_size, 2),
            "detected_problem_type": detected_problem_type,
            "auto_stratified": stratify_target is not None,
            "splits": {
                "train": {
                    "rows": len(X_train),
                    "features": X_train.shape[1],
                    "target_samples": len(y_train)
                },
                "test": {
                    "rows": len(X_test),
                    "features": X_test.shape[1],
                    "target_samples": len(y_test)
                }
            },
            "preview": {
                "train_head": X_train.head(3).to_dict(orient="records"),
                "test_head": X_test.head(3).to_dict(orient="records")
            }
        }