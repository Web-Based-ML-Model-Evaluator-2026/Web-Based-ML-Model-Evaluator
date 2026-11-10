"""End-to-end smoke tests across HTTP server, frontend delivery and API workflows."""
import unittest
from tests.helpers import ApiServer, CLASSIFICATION_CSV


class TestEndToEnd(unittest.TestCase):
    def setUp(self):
        self.api = ApiServer()

    def tearDown(self):
        self.api.close()

    def test_health_and_frontend_assets_are_reachable(self):
        status, health, _ = self.api.request("GET", "/api/health")
        self.assertEqual(status, 200)
        self.assertEqual(health["status"], "ok")
        status, html, headers = self.api.request("GET", "/")
        self.assertEqual(status, 200)
        self.assertIn(b"ModelLab", html)
        self.assertIn("text/html", headers.get("Content-Type", ""))
        # Frontend JS and CSS are delivered by the server's static route.
        status, js, _ = self.api.request("GET", "/static/app.js")
        self.assertEqual(status, 200)
        self.assertGreater(len(js), 0)
        status, css, _ = self.api.request("GET", "/static/style.css")
        self.assertEqual(status, 200)
        self.assertGreater(len(css), 0)

    def test_user_journey_from_registration_to_experiment_history(self):
        status, registered, _ = self.api.request("POST", "/api/register", {
            "name": "Journey User", "email": "journey@test.local", "password": "JourneyPass123"
        })
        self.assertEqual(status, 201)
        token = registered["token"]
        status, login, _ = self.api.request("POST", "/api/login", {
            "email": "journey@test.local", "password": "JourneyPass123"
        })
        self.assertEqual(status, 200)
        token = login["token"]
        _, project, _ = self.api.request("POST", "/api/projects", {"name": "Journey"}, token)
        _, dataset, _ = self.api.request("POST", "/api/datasets/upload", {
            "project_id": project["id"], "filename": "journey.csv", "csv": CLASSIFICATION_CSV
        }, token)
        status, experiment, _ = self.api.request("POST", "/api/experiments/run", {
            "project_id": project["id"], "dataset_id": dataset["id"], "target": "segment",
            "task": "classification", "model": "Random Forest"
        }, token)
        self.assertEqual(status, 201)
        status, history, _ = self.api.request("GET", "/api/experiments", token=token)
        self.assertEqual(status, 200)
        self.assertEqual(history[0]["id"], experiment["id"])


if __name__ == "__main__":
    unittest.main(verbosity=2)
