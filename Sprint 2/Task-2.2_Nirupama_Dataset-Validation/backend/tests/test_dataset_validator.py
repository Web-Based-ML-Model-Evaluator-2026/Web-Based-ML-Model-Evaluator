import io
import os
import sys
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from dataset_validator import validate_csv_bytes, MAX_FILE_SIZE  # noqa: E402


def codes(items):
    return [i["code"] for i in items]


def check(content, name="data.csv", mime="text/csv"):
    data = content if isinstance(content, bytes) else content.encode("utf-8")
    return validate_csv_bytes(data, name, mime)


class FileTypeTests(unittest.TestCase):
    def test_valid_csv(self):
        r = check("a,b\n1,2\n3,4\n")
        self.assertTrue(r["valid"])
        self.assertEqual(r["summary"]["row_count"], 2)
        self.assertEqual(r["summary"]["columns"], ["a", "b"])

    def test_wrong_extension(self):
        for name in ("data.txt", "data.xlsx", "data.json", "data"):
            r = check("a,b\n1,2\n", name=name)
            self.assertEqual(codes(r["errors"]), ["INVALID_FILE_TYPE"], name)

    def test_uppercase_extension_ok(self):
        self.assertTrue(check("a,b\n1,2\n", name="DATA.CSV")["valid"])

    def test_double_extension_uses_last(self):
        r = check("a,b\n1,2\n", name="data.csv.exe")
        self.assertEqual(codes(r["errors"]), ["INVALID_FILE_TYPE"])

    def test_windows_excel_mime_accepted(self):
        self.assertTrue(check("a,b\n1,2\n", mime="application/vnd.ms-excel")["valid"])

    def test_wrong_mime_rejected(self):
        r = check("a,b\n1,2\n", mime="image/png")
        self.assertEqual(codes(r["errors"]), ["INVALID_MIME_TYPE"])

    def test_xlsx_renamed_to_csv(self):
        r = check(b"PK\x03\x04" + b"\x00" * 50)
        self.assertEqual(codes(r["errors"]), ["NOT_A_TEXT_FILE"])

    def test_pdf_renamed_to_csv(self):
        r = check(b"%PDF-1.7 binary")
        self.assertEqual(codes(r["errors"]), ["NOT_A_TEXT_FILE"])

    def test_null_bytes(self):
        r = check(b"a,b\n1,\x002\n")
        self.assertEqual(codes(r["errors"]), ["NOT_A_TEXT_FILE"])


class SizeTests(unittest.TestCase):
    def test_zero_bytes(self):
        self.assertEqual(codes(check(b"")["errors"]), ["EMPTY_FILE"])

    def test_too_large(self):
        r = check(b"a,b\n" + b"1,2\n" * (MAX_FILE_SIZE // 4 + 10))
        self.assertEqual(codes(r["errors"]), ["FILE_TOO_LARGE"])

    def test_exactly_max_size_allowed(self):
        header = b"a,b\n"
        row = b"1,2\n"
        n = (MAX_FILE_SIZE - len(header)) // len(row)
        data = header + row * n
        data += b"x" * (MAX_FILE_SIZE - len(data)) if len(data) < MAX_FILE_SIZE else b""
        self.assertLessEqual(len(data), MAX_FILE_SIZE)
        self.assertNotIn("FILE_TOO_LARGE", codes(check(data)["errors"]))


class EncodingTests(unittest.TestCase):
    def test_invalid_utf8(self):
        r = check(b"name,city\nJos\xe9,Madrid\n")   # latin-1 e-acute
        self.assertEqual(codes(r["errors"]), ["INVALID_ENCODING"])

    def test_utf8_bom_accepted_and_stripped(self):
        r = check(b"\xef\xbb\xbfa,b\n1,2\n")
        self.assertTrue(r["valid"])
        self.assertEqual(r["summary"]["columns"], ["a", "b"])

    def test_unicode_content_ok(self):
        self.assertTrue(check("name,city\nJosé,Zürich\n")["valid"])


class EmptyContentTests(unittest.TestCase):
    def test_whitespace_only(self):
        self.assertEqual(codes(check("   \n\n  \t\n")["errors"]), ["EMPTY_CONTENT"])

    def test_only_commas(self):
        self.assertEqual(codes(check(",,\n,,\n")["errors"]), ["EMPTY_CONTENT"])

    def test_header_only(self):
        r = check("a,b,c\n")
        self.assertEqual(codes(r["errors"]), ["NO_DATA_ROWS"])

    def test_header_plus_blank_rows_only(self):
        r = check("a,b,c\n\n\n")
        self.assertEqual(codes(r["errors"]), ["NO_DATA_ROWS"])


class MalformedTests(unittest.TestCase):
    def test_unclosed_quote(self):
        r = check('a,b\n1,"unterminated\n3,4\n')
        self.assertEqual(codes(r["errors"]), ["MALFORMED_CSV"])

    def test_text_after_closing_quote(self):
        r = check('a,b\n1,"ab"cd\n')
        self.assertEqual(codes(r["errors"]), ["MALFORMED_CSV"])

    def test_row_too_short(self):
        r = check("a,b,c\n1,2,3\n4,5\n")
        self.assertEqual(codes(r["errors"]), ["INCONSISTENT_ROW_LENGTH"])
        self.assertEqual(r["errors"][0]["row"], 3)

    def test_row_too_long(self):
        r = check("a,b\n1,2,3\n")
        self.assertEqual(codes(r["errors"]), ["INCONSISTENT_ROW_LENGTH"])

    def test_many_ragged_rows_are_capped(self):
        body = "a,b\n" + "1\n" * 50
        r = check(body)
        # 10 listed + 1 summary line
        self.assertEqual(len(r["errors"]), 11)
        self.assertIn("40 more", r["errors"][-1]["message"])

    def test_quoted_commas_and_newlines_ok(self):
        r = check('a,b\n"x, y","line1\nline2"\n')
        self.assertTrue(r["valid"])
        self.assertEqual(r["summary"]["row_count"], 1)

    def test_semicolon_delimited(self):
        r = check("a;b;c\n1;2;3\n4;5;6\n")
        self.assertEqual(codes(r["errors"]), ["UNSUPPORTED_DELIMITER"])

    def test_tab_delimited(self):
        r = check("a\tb\n1\t2\n")
        self.assertEqual(codes(r["errors"]), ["UNSUPPORTED_DELIMITER"])

    def test_crlf_line_endings(self):
        self.assertTrue(check("a,b\r\n1,2\r\n3,4\r\n")["valid"])


class HeaderTests(unittest.TestCase):
    def test_blank_header_name(self):
        r = check("a,,c\n1,2,3\n")
        self.assertEqual(codes(r["errors"]), ["BLANK_HEADER"])

    def test_duplicate_header(self):
        r = check("a,b,a\n1,2,3\n")
        self.assertEqual(codes(r["errors"]), ["DUPLICATE_HEADER"])

    def test_duplicate_header_case_insensitive(self):
        r = check("Age,age\n1,2\n")
        self.assertEqual(codes(r["errors"]), ["DUPLICATE_HEADER"])

    def test_header_whitespace_trimmed(self):
        r = check(" a , b \n1,2\n")
        self.assertEqual(r["summary"]["columns"], ["a", "b"])


class WarningTests(unittest.TestCase):
    def test_blank_rows_warn_but_valid(self):
        r = check("a,b\n1,2\n\n3,4\n\n")
        self.assertTrue(r["valid"])
        self.assertIn("BLANK_ROWS", codes(r["warnings"]))
        self.assertEqual(r["summary"]["row_count"], 2)

    def test_single_column(self):
        r = check("a\n1\n2\n")
        self.assertTrue(r["valid"])
        self.assertIn("SINGLE_COLUMN", codes(r["warnings"]))

    def test_numeric_header(self):
        r = check("1,2,3\n4,5,6\n")
        self.assertTrue(r["valid"])
        self.assertIn("HEADER_LOOKS_LIKE_DATA", codes(r["warnings"]))

    def test_empty_column(self):
        r = check("a,b\n1,\n2,\n")
        self.assertTrue(r["valid"])
        self.assertIn("EMPTY_COLUMNS", codes(r["warnings"]))

    def test_formula_injection(self):
        r = check('a,b\n=SUM(A1),2\n@cmd,-5\n+x,3\n')
        self.assertTrue(r["valid"])
        w = [w for w in r["warnings"] if w["code"] == "FORMULA_CELLS"][0]
        self.assertEqual(w["count"], 3)   # -5 is a legitimate number

    def test_clean_file_has_no_warnings(self):
        self.assertEqual(check("a,b\n1,2\n3,4\n")["warnings"], [])

    def test_missing_values_are_not_errors(self):
        r = check("a,b\n1,\n,4\n")
        self.assertTrue(r["valid"])


class ReportShapeTests(unittest.TestCase):
    def test_always_has_all_keys(self):
        for content, name in [("a,b\n1,2\n", "x.csv"), (b"", "x.csv"), ("hi", "x.txt")]:
            r = check(content, name=name)
            self.assertEqual(set(r), {"valid", "errors", "warnings", "summary"})
            self.assertIn("columns", r["summary"])

    def test_never_raises_on_garbage(self):
        import random
        rnd = random.Random(7)
        for _ in range(200):
            blob = bytes(rnd.getrandbits(8) for _ in range(rnd.randint(1, 300)))
            r = check(blob)
            self.assertIn("valid", r)


class FlaskEndpointTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        import tempfile
        import safe_storage
        cls.tmp = tempfile.TemporaryDirectory()
        safe_storage.UPLOAD_DIR = cls.tmp.name
        from server import app
        app.testing = True
        cls.client = app.test_client()
        cls.storage_dir = cls.tmp.name

    @classmethod
    def tearDownClass(cls):
        cls.tmp.cleanup()

    def _post(self, url, content, name="d.csv", mime="text/csv"):
        data = {"file": (io.BytesIO(content), name, mime)}
        return self.client.post(url, data=data, content_type="multipart/form-data")

    def test_validate_no_file(self):
        self.assertEqual(self.client.post("/api/validate-dataset").status_code, 400)

    def test_validate_valid(self):
        res = self._post("/api/validate-dataset", b"a,b\n1,2\n")
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.get_json()["valid"])

    def test_validate_invalid_returns_report(self):
        res = self._post("/api/validate-dataset", b"a,b\n1,2,3\n")
        self.assertEqual(res.status_code, 200)
        self.assertFalse(res.get_json()["valid"])

    def test_upload_invalid_is_422_and_not_stored(self):
        before = set(os.listdir(self.storage_dir))
        res = self._post("/api/upload-dataset", b"a,b\n1\n")
        self.assertEqual(res.status_code, 422)
        self.assertFalse(res.get_json()["valid"])
        self.assertEqual(set(os.listdir(self.storage_dir)), before)

    def test_upload_valid_is_stored_without_path_leak(self):
        res = self._post("/api/upload-dataset", b"a,b\n1,2\n3,4\n")
        self.assertEqual(res.status_code, 201)
        body = res.get_json()
        self.assertEqual(body["row_count"], 2)
        self.assertNotIn("file_path", body)
        self.assertIn(body["stored_name"], os.listdir(self.storage_dir))

    def test_upload_path_traversal_filename_sanitized(self):
        res = self._post("/api/upload-dataset", b"a,b\n1,2\n", name="../../evil.csv")
        self.assertEqual(res.status_code, 201)
        self.assertNotIn("..", res.get_json()["stored_name"])

    def test_oversize_body_returns_413(self):
        big = b"a,b\n" + b"1,2\n" * (MAX_FILE_SIZE // 4 + 400000)
        res = self._post("/api/validate-dataset", big)
        self.assertEqual(res.status_code, 413)


if __name__ == "__main__":
    unittest.main()
