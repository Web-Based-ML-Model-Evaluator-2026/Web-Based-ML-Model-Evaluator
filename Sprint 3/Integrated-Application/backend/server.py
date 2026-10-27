from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse
import json, csv, io, os, math, random
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FRONTEND = ROOT / "frontend"
MAX_UPLOAD_BYTES = 5 * 1024 * 1024

def parse_csv(text):
    if not text.strip():
        raise ValueError("The uploaded CSV is empty.")
    try:
        reader = csv.DictReader(io.StringIO(text))
        if not reader.fieldnames or len(reader.fieldnames) < 2:
            raise ValueError("CSV must contain a header and at least two columns.")
        headers = [str(h).strip() for h in reader.fieldnames]
        if any(not h for h in headers) or len(set(headers)) != len(headers):
            raise ValueError("Column names must be non-empty and unique.")
        rows = []
        for line_no, row in enumerate(reader, start=2):
            if None in row:
                raise ValueError(f"Row {line_no} has more values than the header.")
            cleaned = {}
            for h in headers:
                v = row.get(h)
                cleaned[h] = "" if v is None else str(v).strip()
            if any(v != "" for v in cleaned.values()):
                rows.append(cleaned)
        if not rows:
            raise ValueError("CSV has a header but no data rows.")
        if len(rows) > 100000:
            raise ValueError("CSV exceeds the 100,000-row demo limit.")
        return headers, rows
    except csv.Error as exc:
        raise ValueError(f"Invalid CSV: {exc}") from exc

def numeric_values(rows, col):
    vals = []
    for r in rows:
        v = r[col]
        if v == "":
            vals.append(None)
        else:
            try:
                n = float(v)
                if not math.isfinite(n): raise ValueError()
                vals.append(n)
            except ValueError:
                return None
    return vals

def infer_types(headers, rows):
    types = {}
    for h in headers:
        vals = [r[h] for r in rows if r[h] != ""]
        nums = numeric_values(rows, h)
        types[h] = "numeric" if nums is not None and vals else "categorical"
    return types

def transform(payload):
    text = payload.get("csv", "")
    headers, rows = parse_csv(text)
    types = infer_types(headers, rows)
    missing_before = sum(1 for r in rows for h in headers if r[h] == "")
    missing_method = payload.get("missing", "mean")
    encoding = payload.get("encoding", "onehot")
    scaling = payload.get("scaling", "standard")
    target = payload.get("target") or ""
    test_pct = int(payload.get("test_size", 20))
    if missing_method not in {"mean", "mode", "zero", "drop"}: raise ValueError("Unsupported missing-value method.")
    if encoding not in {"onehot", "label", "none"}: raise ValueError("Unsupported encoding method.")
    if scaling not in {"none", "minmax", "standard"}: raise ValueError("Unsupported scaling method.")
    if test_pct not in {10,20,25,30,40,50}: raise ValueError("Test set size must be one of the supported percentages.")
    if target and target not in headers: raise ValueError("Target column does not exist in the dataset.")
    working = [dict(r) for r in rows]
    if missing_method == "drop":
        working = [r for r in working if all(r[h] != "" for h in headers)]
    else:
        for h in headers:
            blanks = [r for r in working if r[h] == ""]
            if not blanks: continue
            vals = [r[h] for r in working if r[h] != ""]
            if not vals:
                raise ValueError(f"Column '{h}' contains no non-missing values to impute.")
            if types[h] == "numeric":
                nums = [float(v) for v in vals]
                if missing_method == "mean": fill = str(sum(nums)/len(nums))
                elif missing_method == "zero": fill = "0"
                else:
                    counts = {}
                    for v in vals: counts[v] = counts.get(v,0)+1
                    fill = max(counts, key=lambda x:(counts[x], x))
            else:
                if missing_method == "zero": fill = "Unknown"
                elif missing_method == "mean": fill = "Unknown"
                else:
                    counts = {}
                    for v in vals: counts[v] = counts.get(v,0)+1
                    fill = max(counts, key=lambda x:(counts[x], x))
            for r in blanks: r[h] = fill
    if not working: raise ValueError("Dropping missing rows would leave no records.")
    missing_after = sum(1 for r in working for h in headers if r[h] == "")
    # Split before fitting encoders/scalers; keep target out of feature transforms.
    n = len(working)
    test_n = max(1, int(round(n * test_pct / 100))) if n > 1 else 0
    if n > 1: test_n = min(test_n, n-1)
    split_at = n - test_n
    train_rows, test_rows = working[:split_at], working[split_at:]
    feature_cols = [h for h in headers if h != target]
    # Fit encoders and scalers on training features only, then apply to all rows.
    encoded_headers = []
    feature_values = {h: [] for h in feature_cols}
    categorical_maps = {}
    for h in feature_cols:
        if types[h] == "numeric":
            feature_values[h] = [float(r[h]) for r in train_rows]
            encoded_headers.append(h)
        elif encoding == "none":
            encoded_headers.append(h)
        elif encoding == "label":
            cats = sorted({r[h] for r in train_rows})
            categorical_maps[h] = {v:i for i,v in enumerate(cats)}
            encoded_headers.append(h)
        else:
            cats = sorted({r[h] for r in train_rows})
            categorical_maps[h] = cats
            encoded_headers.extend([f"{h}_{c}" for c in cats])
    transformed = []
    for r in working:
        out = {}
        for h in feature_cols:
            if types[h] == "numeric":
                out[h] = float(r[h])
            elif encoding == "none":
                out[h] = r[h]
            elif encoding == "label":
                mp = categorical_maps[h]
                if r[h] not in mp: raise ValueError(f"Category '{r[h]}' in column '{h}' appears only in test rows; use a different split or data order.")
                out[h] = mp[r[h]]
            else:
                cats = categorical_maps[h]
                for c in cats: out[f"{h}_{c}"] = 1 if r[h] == c else 0
        if target: out[target] = r[target]
        transformed.append(out)
    # Scaling fitted on training split only; only numeric features, not one-hot or target.
    if scaling != "none":
        for h in feature_cols:
            if types[h] != "numeric": continue
            train_vals = [float(r[h]) for r in train_rows]
            if scaling == "minmax":
                lo, hi = min(train_vals), max(train_vals)
                for out in transformed: out[h] = 0.0 if hi == lo else (float(out[h])-lo)/(hi-lo)
            else:
                mean = sum(train_vals)/len(train_vals)
                var = sum((x-mean)**2 for x in train_vals)/len(train_vals)
                sd = math.sqrt(var)
                for out in transformed: out[h] = 0.0 if sd == 0 else (float(out[h])-mean)/sd
    # Separate target and feature matrix explicitly.
    X = [{k:v for k,v in row.items() if k != target} for row in transformed]
    y = [row.get(target) for row in transformed] if target else []
    train_X, test_X = X[:split_at], X[split_at:]
    train_y, test_y = y[:split_at], y[split_at:]
    output_headers = list(X[0].keys()) + ([target] if target else [])
    out_rows = []
    for i, x in enumerate(X):
        rr = dict(x)
        if target: rr[target] = y[i]
        out_rows.append(rr)
    return {
      "filename": payload.get("filename","uploaded.csv"),
      "rows_before": len(rows), "rows_after": len(working),
      "columns_before": len(headers), "missing_before": missing_before, "missing_after": missing_after,
      "missing_handled": missing_before-missing_after,
      "types": types, "source_columns": headers, "output_columns": output_headers,
      "feature_columns": list(X[0].keys()) if X else [], "target": target or None,
      "target_separated": bool(target), "encoding": encoding, "scaling": scaling, "missing_method": missing_method,
      "train_rows": len(train_X), "test_rows": len(test_X), "test_size": test_pct,
      "train_target_count": len(train_y), "test_target_count": len(test_y),
      "preview": out_rows[:20], "preview_rows": len(out_rows),
      "csv": rows_to_csv(output_headers, out_rows)
    }

def rows_to_csv(headers, rows):
    buf = io.StringIO()
    w = csv.DictWriter(buf, fieldnames=headers, extrasaction="ignore")
    w.writeheader()
    for row in rows:
        w.writerow({h: row.get(h, "") for h in headers})
    return buf.getvalue()

class Handler(BaseHTTPRequestHandler):
    def _send(self, status, data, ctype="application/json; charset=utf-8"):
        if isinstance(data, str): body = data.encode()
        else: body = json.dumps(data).encode()
        self.send_response(status); self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body))); self.send_header("X-Content-Type-Options","nosniff")
        self.send_header("Access-Control-Allow-Origin","http://127.0.0.1:8000")
        self.send_header("Access-Control-Allow-Headers","Content-Type")
        self.end_headers(); self.wfile.write(body)
    def do_OPTIONS(self):
        self.send_response(204); self.send_header("Access-Control-Allow-Origin","http://127.0.0.1:8000")
        self.send_header("Access-Control-Allow-Headers","Content-Type"); self.send_header("Access-Control-Allow-Methods","POST, GET, OPTIONS"); self.end_headers()
    def do_GET(self):
        path = urlparse(self.path).path
        if path == "/api/health":
            return self._send(200, {"status":"ok","service":"Sprint 3 preprocessing API"})
        if path == "/":
            p = FRONTEND / "index.html"
            return self._send(200,p.read_text(encoding="utf-8"),"text/html; charset=utf-8")
        if path in ("/app.js","/styles.css"):
            p = FRONTEND / path.lstrip("/")
            if not p.exists(): return self._send(404, {"error":"Not found"})
            return self._send(200,p.read_text(encoding="utf-8"),"text/javascript; charset=utf-8" if path.endswith(".js") else "text/css; charset=utf-8")
        return self._send(404, {"error":"Not found"})
    def do_POST(self):
        if urlparse(self.path).path != "/api/preprocess": return self._send(404,{"error":"Not found"})
        try:
            length = int(self.headers.get("Content-Length","0"))
            if length <= 0 or length > MAX_UPLOAD_BYTES: return self._send(413,{"error":"Upload must be between 1 byte and 5 MB."})
            payload = json.loads(self.rfile.read(length).decode("utf-8"))
            result = transform(payload)
            return self._send(200,result)
        except (ValueError, json.JSONDecodeError, UnicodeDecodeError) as e:
            return self._send(400,{"error":str(e)})
        except Exception:
            return self._send(500,{"error":"Unexpected server error. Check the CSV format and options."})
    def log_message(self, fmt, *args):
        print("[server]", fmt % args)

def main():
    host = os.environ.get("HOST","127.0.0.1")
    port = int(os.environ.get("PORT","8000"))
    print(f"Sprint 3 Integrated Application running at http://{host}:{port}")
    print("Press Ctrl+C to stop.")
    ThreadingHTTPServer((host,port), Handler).serve_forever()

if __name__ == "__main__": main()
