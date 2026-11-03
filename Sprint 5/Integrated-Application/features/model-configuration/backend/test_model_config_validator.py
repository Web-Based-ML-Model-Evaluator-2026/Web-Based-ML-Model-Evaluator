import unittest

from model_config_validator import validate_model_configuration


class ModelConfigurationValidatorTests(unittest.TestCase):
    def test_accepts_valid_logistic_regression_payload(self):
        result = validate_model_configuration({
            "task_type": "classification",
            "model_name": "Logistic Regression",
            "hyperparameters": {"C": 1.0, "max_iter": 1000, "solver": "lbfgs"},
        })
        self.assertEqual(result["task_type"], "classification")
        self.assertEqual(result["hyperparameters"]["random_state"], 42)

    def test_rejects_unknown_model(self):
        with self.assertRaisesRegex(ValueError, "Unsupported model"):
            validate_model_configuration({
                "task_type": "classification",
                "model_name": "Not A Model",
                "hyperparameters": {},
            })

    def test_rejects_unknown_hyperparameter(self):
        with self.assertRaisesRegex(ValueError, "Unsupported hyperparameter"):
            validate_model_configuration({
                "task_type": "classification",
                "model_name": "Logistic Regression",
                "hyperparameters": {"magic_parameter": 1},
            })

    def test_rejects_invalid_numeric_range(self):
        with self.assertRaisesRegex(ValueError, "C must"):
            validate_model_configuration({
                "task_type": "classification",
                "model_name": "Logistic Regression",
                "hyperparameters": {"C": 0},
            })

    def test_rejects_boolean_for_integer(self):
        with self.assertRaisesRegex(ValueError, "max_iter must be an integer"):
            validate_model_configuration({
                "task_type": "classification",
                "model_name": "Logistic Regression",
                "hyperparameters": {"max_iter": True},
            })

    def test_rejects_invalid_task_type(self):
        with self.assertRaisesRegex(ValueError, "task_type must"):
            validate_model_configuration({
                "task_type": "clustering",
                "model_name": "Logistic Regression",
                "hyperparameters": {},
            })

    def test_rejects_non_object_hyperparameters(self):
        with self.assertRaisesRegex(ValueError, "hyperparameters must"):
            validate_model_configuration({
                "task_type": "regression",
                "model_name": "Ridge",
                "hyperparameters": [],
            })

    def test_optional_tree_depth_accepts_null(self):
        result = validate_model_configuration({
            "task_type": "classification",
            "model_name": "Decision Tree",
            "hyperparameters": {"max_depth": None},
        })
        self.assertIsNone(result["hyperparameters"]["max_depth"])
        self.assertEqual(result["hyperparameters"]["random_state"], 42)


if __name__ == "__main__":
    unittest.main()
