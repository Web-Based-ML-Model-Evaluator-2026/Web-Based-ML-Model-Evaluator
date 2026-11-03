import sys, unittest
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "backend"))
from server import transform

SAMPLE = """id,age,city,label
1,10,East,A
2,,West,B
3,30,East,A
4,40,North,B
5,50,West,A
6,60,North,B
"""

class Sprint3PipelineTests(unittest.TestCase):
    def test_missing_values_imputed_and_counted(self):
        r = transform({"csv": SAMPLE, "missing":"mean", "encoding":"onehot", "scaling":"none", "target":"label", "test_size":20})
        self.assertEqual(r["rows_after"], 6)
        self.assertEqual(r["missing_before"], 1)
        self.assertEqual(r["missing_after"], 0)
        self.assertEqual(r["missing_handled"], 1)

    def test_target_excluded_from_features(self):
        r = transform({"csv": SAMPLE, "target":"label", "test_size":20, "scaling":"none"})
        self.assertNotIn("label", r["feature_columns"])
        self.assertIn("label", r["output_columns"])
        self.assertTrue(r["target_separated"])

    def test_split_counts(self):
        r = transform({"csv": SAMPLE, "target":"label", "test_size":25})
        self.assertEqual(r["train_rows"] + r["test_rows"], 6)
        self.assertEqual(r["test_rows"], 2)

    def test_onehot_encoding(self):
        r = transform({"csv": SAMPLE, "target":"label", "encoding":"onehot", "scaling":"none"})
        self.assertIn("city_East", r["feature_columns"])
        self.assertIn("city_West", r["feature_columns"])
        self.assertNotIn("city", r["feature_columns"])

    def test_minmax_numeric_scaling(self):
        r = transform({"csv": SAMPLE, "target":"label", "encoding":"onehot", "scaling":"minmax"})
        vals = [row["age"] for row in r["preview"][:r["train_rows"]]]
        self.assertTrue(all(0 <= x <= 1 for x in vals))

    def test_bad_target_rejected(self):
        with self.assertRaises(ValueError):
            transform({"csv": SAMPLE, "target":"missing_column"})

    def test_invalid_csv_rejected(self):
        with self.assertRaises(ValueError):
            transform({"csv":"onlyheader\\n"})

    def test_drop_missing_rows(self):
        r = transform({"csv": SAMPLE, "missing":"drop", "target":"label"})
        self.assertEqual(r["rows_after"], 5)
        self.assertEqual(r["missing_after"], 0)

if __name__ == "__main__":
    unittest.main()
