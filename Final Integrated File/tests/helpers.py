"""Shared isolated test infrastructure for ModelLab."""
import json
import sys
import tempfile
import threading
from http.server import ThreadingHTTPServer
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import HTTPError
from contextlib import contextmanager
from unittest.mock import patch

PROJECT_ROOT = Path(__file__).resolve().parents[1]
APP_ROOT = PROJECT_ROOT
BACKEND_DIR = APP_ROOT / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))
import server


@contextmanager
def isolated_database():
    with tempfile.TemporaryDirectory(prefix="modellab-test-") as tmp:
        db = Path(tmp) / "test.sqlite3"
        uploads = Path(tmp) / "uploads"
        uploads.mkdir()
        with patch.object(server, "DB", db), patch.object(server, "DATA", uploads):
            server.init_db()
            yield db, uploads


class ApiServer:
    def __init__(self):
        self.temp = tempfile.TemporaryDirectory(prefix="modellab-api-")
        self.db = Path(self.temp.name) / "api.sqlite3"
        self.uploads = Path(self.temp.name) / "uploads"
        self.uploads.mkdir()
        self.stack = patch.object(server, "DB", self.db)
        self.stack_data = patch.object(server, "DATA", self.uploads)
        self.stack.start()
        self.stack_data.start()
        server.init_db()
        self.httpd = ThreadingHTTPServer(("127.0.0.1", 0), server.Handler)
        self.thread = threading.Thread(target=self.httpd.serve_forever, daemon=True)
        self.thread.start()
        self.base = f"http://127.0.0.1:{self.httpd.server_port}"

    def close(self):
        self.httpd.shutdown()
        self.httpd.server_close()
        self.thread.join(timeout=2)
        self.stack_data.stop()
        self.stack.stop()
        self.temp.cleanup()

    def request(self, method, path, payload=None, token=None):
        data = None if payload is None else json.dumps(payload).encode()
        headers = {"Content-Type": "application/json"}
        if token:
            headers["Authorization"] = f"Bearer {token}"
        req = Request(self.base + path, data=data, headers=headers, method=method)
        try:
            with urlopen(req, timeout=10) as response:
                body = response.read()
                headers_out = dict(response.headers)
                parsed = json.loads(body) if body and "application/json" in headers_out.get("Content-Type", "") else body
                return response.status, parsed, headers_out
        except HTTPError as exc:
            body = exc.read()
            headers_out = dict(exc.headers)
            parsed = json.loads(body) if body and "application/json" in headers_out.get("Content-Type", "") else body
            return exc.code, parsed, headers_out


CLASSIFICATION_CSV = """age,income,segment
21,25000,A
22,27000,A
23,28000,A
24,30000,A
25,32000,A
26,34000,A
41,65000,B
42,67000,B
43,69000,B
44,71000,B
45,73000,B
46,75000,B
"""
REGRESSION_CSV = """size,rooms,price
800,2,160
900,2,180
1000,3,200
1100,3,220
1200,3,240
1300,4,260
1400,4,280
1500,4,300
1600,5,320
1700,5,340
1800,5,360
1900,6,380
"""
