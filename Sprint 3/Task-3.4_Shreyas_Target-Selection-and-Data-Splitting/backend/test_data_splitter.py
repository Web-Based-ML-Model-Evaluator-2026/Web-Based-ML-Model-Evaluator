"""
=============================================================================
TASK 3.4: AUTOMATED UNIT TESTS FOR DATA SPLITTER ENGINE
=============================================================================
Module: test_data_splitter.py
Purpose:
  Validates functional correctness, mathematical dimensions, and STP error
  guards using Python's built-in `unittest` framework for the CI/CD pipeline.

Test Cases Covered:
  1. test_successful_split_dimensions:
     Verifies correct split proportions (80/20), feature isolation, and y removal.
  2. test_artifacts_saved_to_disk:
     Verifies X_train.csv, X_test.csv, y_train.csv, and y_test.csv exist on disk.
  3. test_missing_target_raises_error:
     Guards against non-existent column names selected as the target.
  4. test_empty_dataframe_raises_error:
     Guards against empty input datasets (0 rows).
  5. test_all_null_target_raises_error:
     Guards against target columns containing only NaN / null values.
  6. test_no_features_left_raises_error:
     Guards against 1-column datasets where selecting target leaves 0 features.
=============================================================================
"""

import os
import unittest
import pandas as pd
from data_splitter import DataSplitterEngine


class TestDataSplitterEngine(unittest.TestCase):

    def setUp(self):
        """
        Runs before every test method.
        Sets up an isolated test output directory and sample test DataFrames.
        """
        self.test_storage = "test_splits"
        self.engine = DataSplitterEngine(storage_dir=self.test_storage)

        # Standard 10-row dataset for testing (8 rows train / 2 rows test on 80/20)
        self.valid_df = pd.DataFrame({
            "age": [25, 38, 45, 29, 52, 22, 40, 31, 48, 35],
            "income": [35000, 62000, 85000, 41000, 95000, 28000, 71000, 49000, 88000, 59000],
            "credit_score": [650, 720, 790, 610, 810, 580, 740, 670, 780, 700],
            "purchased": ["No", "Yes", "Yes", "No", "Yes", "No", "Yes", "No", "Yes", "Yes"]
        })

    def tearDown(self):
        """
        Runs after every test method.
        Cleans up generated test CSV files so tests remain stateless and isolated.
        """
        if os.path.exists(self.test_storage):
            for file_name in os.listdir(self.test_storage):
                file_path = os.path.join(self.test_storage, file_name)
                if os.path.isfile(file_path):
                    os.remove(file_path)
            os.rmdir(self.test_storage)

    # -----------------------------------------------------------------------
    # TEST 1: SUCCESSFUL PARTITIONING & DIMENSION VALIDATION
    # -----------------------------------------------------------------------
    def test_successful_split_dimensions(self):
        """
        Verifies that an 80/20 split on 10 rows produces:
        - 8 training rows, 2 test rows
        - 3 input features in X (with the target 'purchased' excluded)
        """
        result = self.engine.validate_and_split(
            df=self.valid_df,
            target_column="purchased",
            test_size=0.2,
            random_state=42,
            shuffle=True
        )

        # Verify row counts
        self.assertEqual(result["splits"]["train"]["rows"], 8)
        self.assertEqual(result["splits"]["test"]["rows"], 2)

        # Verify feature matrix dimensions (original 4 columns - 1 target = 3 features)
        self.assertEqual(result["splits"]["train"]["features"], 3)
        self.assertEqual(result["splits"]["test"]["features"], 3)

        # Ensure target column is strictly isolated from feature columns
        self.assertNotIn("purchased", result["feature_columns"])
        self.assertEqual(result["target_column"], "purchased")

    # -----------------------------------------------------------------------
    # TEST 2: VERIFY DISK ARTIFACT PERSISTENCE (SPRINT 4 HANDOFF)
    # -----------------------------------------------------------------------
    def test_artifacts_saved_to_disk(self):
        """
        Ensures that partitioned CSV files are persisted to the storage directory
        so downstream model training components can access them.
        """
        self.engine.validate_and_split(
            df=self.valid_df,
            target_column="purchased",
            test_size=0.2,
            random_state=42
        )

        expected_files = ["X_train.csv", "X_test.csv", "y_train.csv", "y_test.csv"]
        for filename in expected_files:
            file_path = os.path.join(self.test_storage, filename)
            self.assertTrue(os.path.exists(file_path), f"Expected artifact {filename} was not found on disk.")

    # -----------------------------------------------------------------------
    # TEST 3: STP ERROR GUARD - MISSING TARGET COLUMN
    # -----------------------------------------------------------------------
    def test_missing_target_raises_error(self):
        """
        Verifies that selecting a column not present in the DataFrame raises a ValueError.
        """
        with self.assertRaises(ValueError) as context:
            self.engine.validate_and_split(
                df=self.valid_df,
                target_column="non_existent_column",
                test_size=0.2
            )
        self.assertIn("does not exist", str(context.exception).lower())

    # -----------------------------------------------------------------------
    # TEST 4: STP ERROR GUARD - EMPTY DATAFRAME
    # -----------------------------------------------------------------------
    def test_empty_dataframe_raises_error(self):
        """
        Verifies that passing an empty DataFrame (0 rows) raises a ValueError.
        """
        empty_df = pd.DataFrame()
        with self.assertRaises(ValueError) as context:
            self.engine.validate_and_split(
                df=empty_df,
                target_column="purchased",
                test_size=0.2
            )
        self.assertIn("empty", str(context.exception).lower())

    # -----------------------------------------------------------------------
    # TEST 5: STP ERROR GUARD - ALL-NULL TARGET COLUMN
    # -----------------------------------------------------------------------
    def test_all_null_target_raises_error(self):
        """
        Verifies that selecting a column containing only NaN values raises a ValueError.
        """
        df_with_null_target = self.valid_df.copy()
        df_with_null_target["purchased"] = None

        with self.assertRaises(ValueError) as context:
            self.engine.validate_and_split(
                df=df_with_null_target,
                target_column="purchased",
                test_size=0.2
            )
        self.assertIn("null values", str(context.exception).lower())

    # -----------------------------------------------------------------------
    # TEST 6: STP ERROR GUARD - ZERO FEATURES REMAINING
    # -----------------------------------------------------------------------
    def test_no_features_left_raises_error(self):
        """
        Verifies that if a dataset contains only 1 column, selecting it as target
        leaves 0 features and raises a ValueError.
        """
        single_column_df = pd.DataFrame({"only_target": [1, 2, 3, 4, 5]})

        with self.assertRaises(ValueError) as context:
            self.engine.validate_and_split(
                df=single_column_df,
                target_column="only_target",
                test_size=0.2
            )
        self.assertIn("at least one feature column", str(context.exception).lower())


if __name__ == "__main__":
    unittest.main()