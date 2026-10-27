import React, { useEffect, useMemo, useState } from "react";
import { SCALING_METHODS, detectNumericColumns, rowsToCsv, scaleDataset } from "../utils/featureScaling.js";

export default function FeatureScaling({ rows = [], datasetName = "dataset.csv", onScalingComplete }) {
  const numericColumns = useMemo(() => {
    try { return rows.length ? detectNumericColumns(rows) : []; } catch { return []; }
  }, [rows]);
  const [method, setMethod] = useState("standard");
  const [selected, setSelected] = useState([]);
  const [minRange, setMinRange] = useState("0");
  const [maxRange, setMaxRange] = useState("1");
  const [outcome, setOutcome] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => { setSelected(numericColumns); setOutcome(null); setError(""); }, [rows, numericColumns]);

  function toggle(column) { setSelected((current) => current.includes(column) ? current.filter((c) => c !== column) : [...current, column]); setOutcome(null); }
  function apply() {
    setError(""); setOutcome(null);
    try {
      const result = scaleDataset(rows, { method, columns: selected, minRange: Number(minRange), maxRange: Number(maxRange) });
      setOutcome(result); onScalingComplete?.(result);
    } catch (err) { setError(err.message || "Unable to scale the selected features."); }
  }
  function download() {
    if (!outcome) return;
    const blob = new Blob([rowsToCsv(outcome.rows)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob); const link = document.createElement("a");
    link.href = url; link.download = `${datasetName.replace(/\.csv$/i, "")}_scaled.csv`; link.click(); URL.revokeObjectURL(url);
  }
  return <main className="fs-page">
    <header className="fs-header"><div><p className="fs-eyebrow">SPRINT 3 · DATA PREPROCESSING · TASK 3.3</p><h1>Feature Scaling</h1><p>Standardize or normalize numerical columns and validate the transformed output.</p></div><span className="fs-chip">{datasetName}</span></header>
    <section className="fs-card"><h2>1. Select numerical features</h2>
      {!rows.length ? <p role="status">No dataset loaded. Provide dataset rows to begin.</p> : !numericColumns.length ? <p>No numeric columns were detected.</p> : <div className="fs-columns">{numericColumns.map((column) => <label className="fs-check" key={column}><input type="checkbox" checked={selected.includes(column)} onChange={() => toggle(column)} />{column}</label>)}</div>}
      <p className="fs-muted">Only selected numeric columns are transformed. Other columns and row order are preserved. Missing values are retained.</p>
    </section>
    <section className="fs-card"><h2>2. Choose a method</h2><div className="fs-form-grid"><label>Scaling method<select value={method} onChange={(e) => { setMethod(e.target.value); setOutcome(null); }}>
      {SCALING_METHODS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select></label>{method === "minmax" && <><label>Minimum output<input type="number" value={minRange} onChange={(e) => setMinRange(e.target.value)} /></label><label>Maximum output<input type="number" value={maxRange} onChange={(e) => setMaxRange(e.target.value)} /></label></>}</div>
      <p className="fs-muted">Standard scaling uses (x − mean) / standard deviation. Min-max normalization maps values to the selected range.</p><button className="fs-button" disabled={!rows.length || !selected.length} onClick={apply}>Scale and validate</button>{error && <p role="alert" className="fs-error">{error}</p>}
    </section>
    {outcome && <><section className="fs-card"><h2>3. Validation</h2><p role="status" className={outcome.validation.valid ? "fs-success" : "fs-error"}>{outcome.validation.valid ? "All validation checks passed." : "One or more validation checks failed."}</p><ul className="fs-checks">{outcome.validation.checks.map((check) => <li key={check.id}><span>{check.passed ? "✓" : "✗"} {check.label}</span><small>{check.detail}</small></li>)}</ul>{outcome.constantColumns.length > 0 && <p className="fs-muted">Constant columns handled deterministically: {outcome.constantColumns.join(", ")}.</p>}<button className="fs-button" onClick={download}>Download scaled CSV</button></section>
      <section className="fs-card"><h2>4. Scaled data preview</h2><div className="fs-table-wrap"><table><thead><tr>{Object.keys(outcome.rows[0] || {}).map((column) => <th key={column}>{column}</th>)}</tr></thead><tbody>{outcome.rows.slice(0, 10).map((row, i) => <tr key={i}>{Object.keys(outcome.rows[0]).map((column) => <td key={column}>{row[column] === null || row[column] === undefined ? "" : String(row[column])}</td>)}</tr>)}</tbody></table></div><p className="fs-muted">Showing up to 10 of {outcome.rows.length} rows.</p></section></>}
  </main>;
}
