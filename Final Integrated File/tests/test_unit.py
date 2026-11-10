"""Unit tests: isolated functions, validation rules, metrics and persistence helpers."""
import unittest
from unittest.mock import Mock
from tests.helpers import isolated_database, CLASSIFICATION_CSV
import server


class TestPasswordUtilities(unittest.TestCase):
    def test_hash_returns_salt_separator_digest(self):
        value = server.hash_pw("StrongPass123")
        self.assertEqual(len(value.split("$")), 2)

    def test_hash_uses_unique_random_salts(self):
        self.assertNotEqual(server.hash_pw("same"), server.hash_pw("same"))

    def test_hash_accepts_supplied_salt(self):
        self.assertEqual(server.hash_pw("pw", "fixed"), server.hash_pw("pw", "fixed"))

    def test_check_password_correct(self):
        self.assertTrue(server.check_pw("abc12345", server.hash_pw("abc12345")))

    def test_check_password_incorrect(self):
        self.assertFalse(server.check_pw("wrong123", server.hash_pw("abc12345")))

    def test_check_password_malformed_empty(self):
        self.assertFalse(server.check_pw("pw", ""))

    def test_check_password_malformed_no_separator(self):
        self.assertFalse(server.check_pw("pw", "malformed"))

    def test_check_password_malformed_extra_separator(self):
        self.assertFalse(server.check_pw("pw", "salt$digest$extra"))


class TestCsvValidation(unittest.TestCase):
    def test_csv_valid_returns_headers_and_rows(self):
        headers, rows = server.csv_data("name,age\nA,1\nB,2\n")
        self.assertEqual(headers, ["name", "age"])
        self.assertEqual(len(rows), 2)

    def test_csv_missing_cell_is_normalized_to_empty_string(self):
        _, rows = server.csv_data("name,age\nAlice,\n")
        self.assertEqual(rows[0], {"name": "Alice", "age": ""})

    def test_csv_trims_cell_whitespace(self):
        _, rows = server.csv_data("name,age\n A , 20 \n")
        self.assertEqual(rows[0], {"name": "A", "age": "20"})

    def test_csv_empty_input_rejected(self):
        with self.assertRaisesRegex(ValueError, "empty"):
            server.csv_data("  \n")

    def test_csv_missing_header_rejected(self):
        with self.assertRaises(ValueError):
            server.csv_data("")

    def test_csv_single_column_rejected(self):
        with self.assertRaisesRegex(ValueError, "at least two"):
            server.csv_data("name\nAlice\n")

    def test_csv_duplicate_headers_rejected(self):
        with self.assertRaisesRegex(ValueError, "unique"):
            server.csv_data("name,name\nA,B\n")

    def test_csv_blank_header_rejected(self):
        with self.assertRaisesRegex(ValueError, "unique"):
            server.csv_data("name, \nA,B\n")

    def test_csv_no_data_rows_rejected(self):
        with self.assertRaisesRegex(ValueError, "no data"):
            server.csv_data("name,age\n")

    def test_csv_blank_rows_ignored(self):
        _, rows = server.csv_data("name,age\nA,1\n,\nB,2\n")
        self.assertEqual(len(rows), 2)

    def test_csv_extra_values_rejected(self):
        with self.assertRaisesRegex(ValueError, "extra values"):
            server.csv_data("a,b\n1,2,3\n")


class TestMetrics(unittest.TestCase):
    def test_classification_metrics_contains_expected_keys(self):
        result = server.metrics_for(["a", "b"], ["a", "b"], "classification")
        self.assertTrue({"accuracy", "precision_weighted", "recall_weighted",
                         "f1_weighted", "confusion_matrix"} <= result.keys())

    def test_classification_accuracy_perfect(self):
        result = server.metrics_for([0, 1, 1], [0, 1, 1], "classification")
        self.assertEqual(result["accuracy"], 1.0)

    def test_classification_accuracy_zero(self):
        result = server.metrics_for([0, 0], [1, 1], "classification")
        self.assertEqual(result["accuracy"], 0.0)

    def test_classification_confusion_matrix_shape(self):
        result = server.metrics_for(["a", "b", "a"], ["a", "b", "b"], "classification")
        self.assertEqual(len(result["confusion_matrix"]), 2)

    def test_regression_metrics_contains_expected_keys(self):
        result = server.metrics_for([1, 2, 3], [1, 2, 3], "regression")
        self.assertEqual(set(result), {"mae", "rmse", "r2"})

    def test_regression_perfect_error_is_zero(self):
        result = server.metrics_for([1, 2, 3], [1, 2, 3], "regression")
        self.assertEqual(result["mae"], 0.0)
        self.assertEqual(result["rmse"], 0.0)
        self.assertEqual(result["r2"], 1.0)

    def test_regression_error_non_negative(self):
        result = server.metrics_for([1, 2, 3], [2, 2, 4], "regression")
        self.assertGreaterEqual(result["mae"], 0)
        self.assertGreaterEqual(result["rmse"], 0)

    def test_single_sample_regression_r2_is_none(self):
        result = server.metrics_for([1], [2], "regression")
        self.assertIsNone(result["r2"])


class TestDatabaseUtilities(unittest.TestCase):
    def test_now_returns_timezone_aware_iso_timestamp(self):
        from datetime import datetime
        value = datetime.fromisoformat(server.now())
        self.assertIsNotNone(value.tzinfo)

    def test_init_db_creates_required_tables(self):
        with isolated_database():
            with server.connect() as conn:
                names = {r["name"] for r in conn.execute(
                    "SELECT name FROM sqlite_master WHERE type='table'")}
            self.assertTrue({"users", "sessions", "projects", "datasets", "experiments"} <= names)

    def test_connect_enables_foreign_keys(self):
        with isolated_database():
            with server.connect() as conn:
                self.assertEqual(conn.execute("PRAGMA foreign_keys").fetchone()[0], 1)

    def test_owned_returns_only_matching_user_record(self):
        with isolated_database():
            with server.connect() as conn:
                cur = conn.execute("INSERT INTO users(name,email,pw_hash,created) VALUES(?,?,?,?)",
                                   ("A", "a@test.local", "x", server.now()))
                uid = cur.lastrowid
                cur = conn.execute("INSERT INTO projects(user_id,name,description,created) VALUES(?,?,?,?)",
                                   (uid, "P", "", server.now()))
                pid = cur.lastrowid
                self.assertIsNotNone(server.owned(conn, "projects", pid, uid))
                self.assertIsNone(server.owned(conn, "projects", pid, uid + 1))

    def test_auth_user_without_authorization_is_none(self):
        handler = Mock()
        handler.headers = {"Authorization": ""}
        self.assertIsNone(server.auth_user(handler))


if __name__ == "__main__":
    unittest.main(verbosity=2)
