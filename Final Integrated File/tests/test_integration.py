"""Integration tests: verify connected backend modules and data flow."""
import unittest
from tests.helpers import isolated_database, CLASSIFICATION_CSV, REGRESSION_CSV
import server


class TestDataToModelIntegration(unittest.TestCase):
    def test_csv_parser_to_classification_training_and_metrics(self):
        headers, rows = server.csv_data(CLASSIFICATION_CSV)
        self.assertEqual(headers, ["age", "income", "segment"])
        self.assertEqual(len(rows), 12)
        result = server.run_model(CLASSIFICATION_CSV, "segment", "classification",
                                  "Decision Tree", 0.25, "mean", "onehot", "standard", 7)
        self.assertEqual(result["task"], "classification")
        self.assertIn("accuracy", result["metrics"])
        self.assertIn("confusion_matrix", result["metrics"])
        self.assertEqual(result["train_rows"] + result["test_rows"], 12)
        self.assertEqual(result["feature_count"], 2)
        self.assertTrue(result["predictions"])

    def test_csv_parser_to_regression_training_and_metrics(self):
        headers, rows = server.csv_data(REGRESSION_CSV)
        self.assertEqual(len(headers), 3)
        self.assertEqual(len(rows), 12)
        result = server.run_model(REGRESSION_CSV, "price", "regression",
                                  "Linear Regression", 0.25, "mean", "onehot", "standard", 7)
        self.assertEqual(result["task"], "regression")
        self.assertTrue({"mae", "rmse", "r2"} <= result["metrics"].keys())
        self.assertEqual(result["train_rows"] + result["test_rows"], 12)

    def test_preprocessing_options_work_in_pipeline(self):
        result = server.run_model(CLASSIFICATION_CSV, "segment", "classification",
                                  "Random Forest", 0.25, "mean", "label", "minmax", 11)
        self.assertEqual(result["config"]["encoding"], "label")
        self.assertEqual(result["config"]["scaling"], "minmax")

    def test_invalid_target_stops_pipeline_before_training(self):
        with self.assertRaisesRegex(ValueError, "Target column"):
            server.run_model(CLASSIFICATION_CSV, "missing", "classification",
                             "Decision Tree", 0.25, "mean", "onehot", "standard")

    def test_invalid_task_stops_pipeline(self):
        with self.assertRaisesRegex(ValueError, "Task must be"):
            server.run_model(CLASSIFICATION_CSV, "segment", "clustering",
                             "Decision Tree", 0.25, "mean", "onehot", "standard")


class TestDatabaseIntegration(unittest.TestCase):
    def test_user_session_project_dataset_and_experiment_relations(self):
        with isolated_database() as (_, uploads):
            password = server.hash_pw("IntegrationPassword")
            with server.connect() as conn:
                uid = conn.execute(
                    "INSERT INTO users(name,email,pw_hash,created) VALUES(?,?,?,?)",
                    ("Integration", "integration@test.local", password, server.now())
                ).lastrowid
                conn.execute("INSERT INTO sessions(token,user_id,created) VALUES(?,?,?)",
                             ("token-1", uid, server.now()))
                pid = conn.execute(
                    "INSERT INTO projects(user_id,name,description,created) VALUES(?,?,?,?)",
                    (uid, "Integrated Project", "test", server.now())
                ).lastrowid
                csv_path = uploads / "dataset.csv"
                csv_path.write_text(CLASSIFICATION_CSV, encoding="utf-8")
                did = conn.execute(
                    """INSERT INTO datasets(user_id,project_id,filename,path,rows_count,columns_count,created)
                       VALUES(?,?,?,?,?,?,?)""",
                    (uid, pid, "dataset.csv", str(csv_path), 12, 3, server.now())
                ).lastrowid
                result = server.run_model(CLASSIFICATION_CSV, "segment", "classification",
                                          "Decision Tree", .25, "mean", "onehot", "standard")
                conn.execute(
                    """INSERT INTO experiments(user_id,project_id,dataset_id,model,task,target,metrics,config,created)
                       VALUES(?,?,?,?,?,?,?,?,?)""",
                    (uid, pid, did, result["model"], result["task"], result["target"],
                     __import__("json").dumps(result["metrics"]),
                     __import__("json").dumps(result["config"]), server.now())
                )
            with server.connect() as conn:
                row = conn.execute(
                    """SELECT u.email,p.name,d.filename,e.model,e.task
                       FROM users u JOIN projects p ON p.user_id=u.id
                       JOIN datasets d ON d.project_id=p.id
                       JOIN experiments e ON e.dataset_id=d.id WHERE u.id=?""", (uid,)
                ).fetchone()
            self.assertEqual(tuple(row), ("integration@test.local", "Integrated Project",
                                           "dataset.csv", "Decision Tree", "classification"))


if __name__ == "__main__":
    unittest.main(verbosity=2)
