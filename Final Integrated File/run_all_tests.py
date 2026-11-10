#!/usr/bin/env python3
"""Run each ModelLab testing level once and generate consolidated HTML reports."""
from __future__ import annotations
import importlib
import json
import sys
import time
from datetime import datetime, timezone
from html import escape
from io import StringIO
from pathlib import Path
import unittest
import coverage

ROOT = Path(__file__).resolve().parent
REPORTS = ROOT / "reports"
REPORTS.mkdir(exist_ok=True)
CATEGORIES = [
    ("Unit testing", "tests.test_unit"),
    ("Component / functional testing", "tests.test_functional"),
    ("Integration testing", "tests.test_integration"),
    ("System testing", "tests.test_system"),
    ("End-to-end testing", "tests.test_end_to_end"),
]

def main():
    started = datetime.now(timezone.utc)
    cov = coverage.Coverage(source=[str(ROOT / "backend")], branch=True, data_file=str(ROOT / ".coverage"))
    category_results = []
    all_output = []
    print("=" * 76)
    print("MODELLAB — COMPLETE SOFTWARE TESTING")
    print("=" * 76)
    print(f"Project directory: {ROOT}")
    print(f"Started: {started.astimezone().isoformat(timespec='seconds')}")
    cov.start()

    try:
        for label, module_name in CATEGORIES:
            print(f"\n{'=' * 20} {label} {'=' * 20}")
            module = importlib.import_module(module_name)
            suite = unittest.defaultTestLoader.loadTestsFromModule(module)
            stream = StringIO()
            result = unittest.TextTestRunner(stream=stream, verbosity=2).run(suite)
            output = stream.getvalue()
            print(output, end="" if output.endswith("\n") else "\n")
            all_output.append(f"{label}\n{output}")
            status = "PASSED" if result.wasSuccessful() else "FAILED"
            count = result.testsRun
            category_results.append({
                "category": label, "module": module_name, "status": status,
                "tests": count, "failures": len(result.failures),
                "errors": len(result.errors),
                "details": [str(x[0]) + ": " + x[1] for x in result.failures + result.errors]
            })
            print(f"--> {label}: {status}; {count} tests; "
                  f"{len(result.failures)} failures; {len(result.errors)} errors")
    finally:
        cov.stop()
        cov.save()

    print("\n" + "=" * 76 + "\nSTATEMENT AND BRANCH COVERAGE\n" + "=" * 76)
    coverage_stream = StringIO()
    try:
        cov.report(file=coverage_stream, show_missing=True)
        cov.html_report(directory=str(REPORTS / "coverage_html"))
        cov.json_report(outfile=str(REPORTS / "coverage.json"))
        coverage_ok = True
    except Exception as exc:
        coverage_stream.write(f"Coverage report generation failed: {exc}\n")
        coverage_ok = False
    print(coverage_stream.getvalue())
    all_output.append("COVERAGE\n" + coverage_stream.getvalue())

    totals = {}
    cov_json_path = REPORTS / "coverage.json"
    if cov_json_path.exists():
        totals = json.loads(cov_json_path.read_text(encoding="utf-8")).get("totals", {})
    finished = datetime.now(timezone.utc)
    total_tests = sum(x["tests"] for x in category_results)
    all_passed = all(x["status"] == "PASSED" for x in category_results)
    final_status = "PASSED" if all_passed and coverage_ok else "FAILED"
    statement_pct = totals.get("percent_covered", "N/A")
    covered_branches = totals.get("covered_branches", 0)
    num_branches = totals.get("num_branches", 0)
    branch_pct = round(covered_branches / num_branches * 100, 2) if num_branches else "N/A"
    summary = {
        "project": "ModelLab",
        "started": started.isoformat(),
        "finished": finished.isoformat(),
        "status": final_status,
        "total_test_cases": total_tests,
        "categories": category_results,
        "coverage": totals,
        "branch_coverage_percent": branch_pct,
        "coverage_report": "coverage_html/index.html"
    }
    (REPORTS / "test_results.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")
    (REPORTS / "test_execution.log").write_text("\n\n".join(all_output), encoding="utf-8")
    rows = "".join(
        f"<tr><td>{escape(x['category'])}</td><td>{x['tests']}</td>"
        f"<td class='{x['status'].lower()}'>{x['status']}</td>"
        f"<td>{x['failures']}</td><td>{x['errors']}</td></tr>"
        for x in category_results
    )
    html = f"""<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>ModelLab Testing Report</title><style>
body{{font-family:Arial,sans-serif;margin:36px;background:#f5f7fb;color:#172033}}
main{{max-width:1050px;margin:auto}}h1{{margin-bottom:6px}}.muted{{color:#64748b}}
.cards{{display:flex;gap:14px;flex-wrap:wrap;margin:24px 0}}
.card{{background:white;padding:18px 22px;border-radius:10px;min-width:170px;box-shadow:0 1px 5px #0001}}
.value{{font-size:28px;font-weight:700;margin-top:8px}}table{{border-collapse:collapse;width:100%;background:white}}
th,td{{padding:13px;text-align:left;border-bottom:1px solid #e5e7eb}}th{{background:#eaf0f8}}
.passed{{color:#087443;font-weight:bold}}.failed{{color:#b42318;font-weight:bold}}
a{{color:#175cd3}}.panel{{background:white;padding:20px;border-radius:10px;margin-top:20px}}
</style></head><body><main><h1>ModelLab — Software Testing Report</h1>
<p class="muted">Generated {escape(finished.astimezone().isoformat(timespec='seconds'))}</p>
<div class="cards">
<div class="card">Overall result<div class="value {final_status.lower()}">{final_status}</div></div>
<div class="card">Test cases<div class="value">{total_tests}</div></div>
<div class="card">Statement coverage<div class="value">{statement_pct}%</div></div>
<div class="card">Branch coverage<div class="value">{branch_pct}%</div></div>
</div>
<section class="panel"><h2>Testing category results</h2><table><thead><tr>
<th>Category</th><th>Tests</th><th>Result</th><th>Failures</th><th>Errors</th>
</tr></thead><tbody>{rows}</tbody></table></section>
<section class="panel"><h2>Detailed reports</h2><ul>
<li><a href="coverage_html/index.html">Line-by-line statement and branch coverage</a></li>
<li><a href="test_results.json">Machine-readable test summary (JSON)</a></li>
<li><a href="test_execution.log">Complete test execution log</a></li>
</ul><p class="muted">Python coverage measures backend/server.py. It does not measure browser-side JavaScript coverage.</p></section>
</main></body></html>"""
    (REPORTS / "index.html").write_text(html, encoding="utf-8")
    print("\n" + "=" * 76)
    print(f"FINAL RESULT: {final_status}")
    print(f"Total tests: {total_tests}")
    print(f"Statement coverage: {statement_pct}%")
    print(f"Branch coverage: {branch_pct}%")
    print(f"Dashboard: {REPORTS / 'index.html'}")
    print("=" * 76)
    return 0 if final_status == "PASSED" else 1

if __name__ == "__main__":
    raise SystemExit(main())
