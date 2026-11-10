"""Functional tests: verify individual user-facing API features and validation."""
import unittest
from tests.helpers import ApiServer, CLASSIFICATION_CSV


class TestFunctionalApi(unittest.TestCase):
    def setUp(self):
        self.api = ApiServer()
        status, body, _ = self.api.request("POST", "/api/register", {
            "name": "Functional User", "email": "functional@test.local", "password": "Password123"
        })
        self.assertEqual(status, 201)
        self.token = body["token"]

    def tearDown(self):
        self.api.close()

    def test_health_endpoint_reports_service_status(self):
        status, body, headers = self.api.request("GET", "/api/health")
        self.assertEqual(status, 200)
        self.assertEqual(body, {"status": "ok", "service": "ModelLab"})
        self.assertEqual(headers.get("Content-Type"), "application/json; charset=utf-8")

    def test_register_rejects_missing_name(self):
        status, body, _ = self.api.request("POST", "/api/register", {
            "name": "", "email": "x@test.local", "password": "Password123"
        })
        self.assertEqual(status, 400)
        self.assertIn("error", body)

    def test_register_rejects_invalid_email(self):
        status, _, _ = self.api.request("POST", "/api/register", {
            "name": "X", "email": "invalid", "password": "Password123"
        })
        self.assertEqual(status, 400)

    def test_register_rejects_short_password(self):
        status, _, _ = self.api.request("POST", "/api/register", {
            "name": "X", "email": "x2@test.local", "password": "short"
        })
        self.assertEqual(status, 400)

    def test_duplicate_registration_returns_conflict(self):
        status, _, _ = self.api.request("POST", "/api/register", {
            "name": "Duplicate", "email": "functional@test.local", "password": "Password123"
        })
        self.assertEqual(status, 409)

    def test_login_rejects_wrong_password(self):
        status, body, _ = self.api.request("POST", "/api/login", {
            "email": "functional@test.local", "password": "WrongPassword"
        })
        self.assertEqual(status, 401)
        self.assertIn("error", body)

    def test_me_requires_authentication(self):
        status, _, _ = self.api.request("GET", "/api/me")
        self.assertEqual(status, 401)

    def test_me_returns_authenticated_profile(self):
        status, body, _ = self.api.request("GET", "/api/me", token=self.token)
        self.assertEqual(status, 200)
        self.assertEqual(body["email"], "functional@test.local")

    def test_project_creation_and_listing(self):
        status, created, _ = self.api.request("POST", "/api/projects",
                                               {"name": "Functional Project"}, self.token)
        self.assertEqual(status, 201)
        status, projects, _ = self.api.request("GET", "/api/projects", token=self.token)
        self.assertEqual(status, 200)
        self.assertTrue(any(p["id"] == created["id"] for p in projects))

    def test_project_creation_rejects_empty_name(self):
        status, _, _ = self.api.request("POST", "/api/projects", {"name": " "}, self.token)
        self.assertEqual(status, 400)

    def test_dataset_upload_and_content_retrieval(self):
        _, project, _ = self.api.request("POST", "/api/projects", {"name": "Dataset Project"}, self.token)
        status, dataset, _ = self.api.request("POST", "/api/datasets/upload", {
            "project_id": project["id"], "filename": "../../safe.csv", "csv": CLASSIFICATION_CSV
        }, self.token)
        self.assertEqual(status, 201)
        self.assertEqual(dataset["filename"], "safe.csv")
        status, content, _ = self.api.request("GET", f"/api/datasets/{dataset['id']}/content",
                                               token=self.token)
        self.assertEqual(status, 200)
        self.assertIn("age,income,segment", content["csv"])

    def test_dataset_upload_rejects_invalid_csv(self):
        _, project, _ = self.api.request("POST", "/api/projects", {"name": "Bad CSV Project"}, self.token)
        status, body, _ = self.api.request("POST", "/api/datasets/upload", {
            "project_id": project["id"], "filename": "bad.csv", "csv": "onecolumn\nx\n"
        }, self.token)
        self.assertEqual(status, 400)
        self.assertIn("error", body)

    def test_dataset_upload_rejects_foreign_or_missing_project(self):
        status, _, _ = self.api.request("POST", "/api/datasets/upload", {
            "project_id": 9999, "filename": "x.csv", "csv": CLASSIFICATION_CSV
        }, self.token)
        self.assertEqual(status, 404)

    def test_logout_invalidates_session(self):
        status, _, _ = self.api.request("POST", "/api/logout", {}, self.token)
        self.assertEqual(status, 200)
        status, _, _ = self.api.request("GET", "/api/me", token=self.token)
        self.assertEqual(status, 401)

    def test_frontend_root_is_served(self):
        status, body, headers = self.api.request("GET", "/")
        self.assertEqual(status, 200)
        self.assertIn("text/html", headers.get("Content-Type", ""))
        self.assertIn(b"ModelLab", body if isinstance(body, bytes) else str(body).encode())


if __name__ == "__main__":
    unittest.main(verbosity=2)
