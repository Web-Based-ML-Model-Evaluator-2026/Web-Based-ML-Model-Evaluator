"""System tests: validate the integrated application as a complete service."""
import unittest
from tests.helpers import ApiServer, CLASSIFICATION_CSV, REGRESSION_CSV


class TestCompleteSystemWorkflows(unittest.TestCase):
    def setUp(self):
        self.api = ApiServer()
        status, body, _ = self.api.request("POST", "/api/register", {
            "name": "System User", "email": "system@test.local", "password": "SystemPass123"
        })
        self.assertEqual(status, 201)
        self.token = body["token"]

    def tearDown(self):
        self.api.close()

    def test_complete_classification_workflow_and_report(self):
        # Register → authenticate → create project → upload CSV → train → retrieve → report.
        status, me, _ = self.api.request("GET", "/api/me", token=self.token)
        self.assertEqual(status, 200)
        status, project, _ = self.api.request("POST", "/api/projects",
                                               {"name": "Churn Analysis", "description": "System test"},
                                               self.token)
        self.assertEqual(status, 201)
        status, dataset, _ = self.api.request("POST", "/api/datasets/upload", {
            "project_id": project["id"], "filename": "churn.csv", "csv": CLASSIFICATION_CSV
        }, self.token)
        self.assertEqual(status, 201)
        status, experiment, _ = self.api.request("POST", "/api/experiments/run", {
            "project_id": project["id"], "dataset_id": dataset["id"], "target": "segment",
            "task": "classification", "model": "Decision Tree", "test_size": 0.25,
            "missing": "mean", "encoding": "onehot", "scaling": "standard"
        }, self.token)
        self.assertEqual(status, 201)
        self.assertIn("accuracy", experiment["metrics"])
        status, experiments, _ = self.api.request("GET", "/api/experiments", token=self.token)
        self.assertEqual(status, 200)
        self.assertTrue(any(x["id"] == experiment["id"] for x in experiments))
        status, report, _ = self.api.request("POST", "/api/reports",
                                              {"experiment_ids": [experiment["id"]]}, self.token)
        self.assertEqual(status, 200)
        self.assertEqual(len(report["experiments"]), 1)
        self.assertEqual(report["experiments"][0]["task"], "classification")

    def test_complete_regression_workflow(self):
        _, project, _ = self.api.request("POST", "/api/projects",
                                         {"name": "Price Prediction"}, self.token)
        _, dataset, _ = self.api.request("POST", "/api/datasets/upload", {
            "project_id": project["id"], "filename": "prices.csv", "csv": REGRESSION_CSV
        }, self.token)
        status, result, _ = self.api.request("POST", "/api/experiments/run", {
            "project_id": project["id"], "dataset_id": dataset["id"], "target": "price",
            "task": "regression", "model": "Linear Regression"
        }, self.token)
        self.assertEqual(status, 201)
        self.assertTrue({"mae", "rmse", "r2"} <= result["metrics"].keys())

    def test_user_cannot_access_another_users_project(self):
        _, other, _ = self.api.request("POST", "/api/register", {
            "name": "Other", "email": "other@test.local", "password": "OtherPass123"
        })
        other_token = other["token"]
        _, other_project, _ = self.api.request(
            "POST", "/api/projects", {"name": "Private Project"}, other_token
        )
        status, _, _ = self.api.request("POST", "/api/datasets/upload", {
            "project_id": other_project["id"], "filename": "x.csv", "csv": CLASSIFICATION_CSV
        }, self.token)
        self.assertEqual(status, 404)

    def test_experiment_requires_owned_dataset(self):
        status, body, _ = self.api.request("POST", "/api/experiments/run", {
            "dataset_id": 9999, "project_id": 0, "target": "segment",
            "task": "classification", "model": "Decision Tree"
        }, self.token)
        self.assertEqual(status, 404)
        self.assertIn("error", body)


if __name__ == "__main__":
    unittest.main(verbosity=2)
