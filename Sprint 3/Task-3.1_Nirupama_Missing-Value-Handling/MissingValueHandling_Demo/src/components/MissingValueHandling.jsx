import React, { useEffect, useMemo, useState } from "react";
import {
  STRATEGY_OPTIONS, applyMissingStrategy, profileMissingValues, rowsToCsv, validateProcessedDataset
} from "../utils/missingValueHandling";

export default function MissingValueHandling({ rows = [], datasetName = "Dataset", onHandlingComplete }) {
  const profile = useMemo(() => (rows.length ? profileMissingValues(rows) : null), [rows]);
  const withMissing = useMemo(() => profile?.columns.filter((c) => c.missing > 0).map((c) => c.name) ?? [], [profile]);
  const [strategy, setStrategy] = useState("mean");
  const [picked, setPicked] = useState(null); // null = default (all columns with missing values)
  const [fillValue, setFillValue] = useState("");
  const [outcome, setOutcome] = useState(null);
  const [error, setError] = useState("");
  const selected = picked ?? withMissing;

  useEffect(() => { setPicked(null); setOutcome(null); setError(""); }, [rows]);

  function toggle(name) {
    setPicked(selected.includes(name) ? selected.filter((n) => n !== name) : [...selected, name]);
  }

  function handleApply() {
    setError(""); setOutcome(null);
    try {
      const result = applyMissingStrategy(rows, { strategy, columns: selected, fillValue });
      const validation = validateProcessedDataset(rows, result);
      setOutcome({ result, validation });
      onHandlingComplete?.({ ...result, validation });
    } catch (err) { setError(err.message || "Could not handle missing values."); }
  }

  function download() {
    const blob = new Blob([rowsToCsv(outcome.result.rows)], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${datasetName.replace(/\.csv$/i, "")}_processed.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  const processed = outcome?.result.rows ?? [];
  const shownColumns = processed.length ? Object.keys(processed[0]) : [];

  return <main className="mv-page">
    <header className="mv-header">
      <div><p className="mv-eyebrow">SPRINT 3 · DATA PREPROCESSING · TASK 3.1</p>
        <h1>Missing Value Handling</h1>
        <p className="mv-muted">Find missing values, apply a simple strategy, and validate the processed dataset.</p></div>
      <span className="mv-chip">{datasetName}</span>
    </header>
    <div className="mv-stats">
      <div className="mv-stat"><span>Rows</span><strong>{profile?.rowCount ?? 0}</strong></div>
      <div className="mv-stat"><span>Missing cells</span><strong>{profile?.missingCells ?? 0}</strong></div>
      <div className="mv-stat"><span>Rows with missing</span><strong>{profile?.rowsWithMissing ?? 0}</strong></div>
      <div className="mv-stat"><span>Columns affected</span><strong>{withMissing.length}</strong></div>
    </div>

    <section className="mv-card">
      <h2>1. Missing values by column</h2>
      {!profile ? <p className="mv-muted">No dataset loaded. Provide dataset rows to begin.</p> :
        withMissing.length === 0 ? <p className="mv-success">No missing values found. Nothing to handle.</p> :
        <div className="mv-table-wrap"><table className="mv-table">
          <thead><tr><th>Apply</th><th>Column</th><th>Type</th><th>Missing</th><th>Missing %</th></tr></thead>
          <tbody>{profile.columns.map((c) => <tr key={c.name}>
            <td><input type="checkbox" aria-label={`Select ${c.name}`} disabled={c.missing === 0}
              checked={selected.includes(c.name)} onChange={() => toggle(c.name)} /></td>
            <td>{c.name}</td><td>{c.type}</td><td>{c.missing}</td><td>{c.missingPercent}%</td></tr>)}</tbody>
        </table></div>}
    </section>

    <section className="mv-card">
      <h2>2. Choose a strategy</h2>
      <div className="mv-form-grid">
        <label>Strategy<select value={strategy} onChange={(e) => setStrategy(e.target.value)}>
          {STRATEGY_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</select></label>
        {strategy === "constant" && <label>Constant value<input value={fillValue} onChange={(e) => setFillValue(e.target.value)} placeholder="e.g. 0 or Unknown" /></label>}
      </div>
      <p className="mv-muted">Mean and median only apply to numeric columns; incompatible columns are skipped and reported.
        Dropping rows or columns removes data — check the row-loss warning afterwards.</p>
      <button className="mv-button" onClick={handleApply} disabled={!withMissing.length || !selected.length}>Apply strategy</button>
      {error && <p role="alert" className="mv-error">{error}</p>}
    </section>

    {outcome && <section className="mv-card">
      <h2>3. Validation</h2>
      <p className={outcome.validation.valid ? "mv-success" : "mv-error"} role="status">
        {outcome.validation.valid ? "Processed dataset passed all required checks." : "Processed dataset failed validation."}</p>
      <ul className="mv-checks">{outcome.validation.checks.map((c) =>
        <li key={c.id} className={c.passed ? "ok" : c.severity === "error" ? "fail" : "warn"}>
          <strong>{c.passed ? "✓" : c.severity === "error" ? "✗" : "!"} {c.label}</strong><span>{c.detail}</span></li>)}</ul>
      {outcome.result.warnings.map((w) => <p key={w} className="mv-warn">{w}</p>)}
      {outcome.result.imputations.length > 0 && <p className="mv-muted">Filled: {outcome.result.imputations
        .map((i) => `${i.column} → ${i.value} (${i.filled} cell${i.filled === 1 ? "" : "s"})`).join(" · ")}</p>}
      {outcome.result.droppedColumns.length > 0 && <p className="mv-muted">Dropped columns: {outcome.result.droppedColumns.join(", ")}</p>}
      <p className="mv-muted">Rows: {outcome.result.before.rowCount} → {outcome.result.after.rowCount} · Missing cells: {outcome.result.before.missingCells} → {outcome.result.after.missingCells}</p>
      <div className="mv-table-wrap"><table className="mv-table"><thead><tr>{shownColumns.map((c) => <th key={c}>{c}</th>)}</tr></thead>
        <tbody>{processed.slice(0, 10).map((row, i) => <tr key={i}>{shownColumns.map((c) => <td key={c}>{row[c] === null || row[c] === "" ? "—" : String(row[c])}</td>)}</tr>)}</tbody></table></div>
      <p className="mv-muted">Showing {Math.min(10, processed.length)} of {processed.length} rows.</p>
      <button className="mv-button" onClick={download} disabled={!processed.length}>Download processed CSV</button>
    </section>}
  </main>;
}
