import React, { useMemo, useState } from "react";
import { encodeCategoricalColumn, identifyCategoricalColumns } from "../utils/categoricalEncoding";

export default function CategoricalEncoding({ rows = [], datasetName = "Dataset", onEncodingComplete }) {
  const categoricalColumns = useMemo(() => identifyCategoricalColumns(rows), [rows]);
  const [columnName, setColumnName] = useState("");
  const [method, setMethod] = useState("one-hot");
  const [dropFirst, setDropFirst] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const selectedColumn = columnName || categoricalColumns[0]?.name || "";

  function handleEncode() {
    setError(""); setResult(null);
    try {
      const encoded = encodeCategoricalColumn(rows, selectedColumn, method, { dropFirst });
      setResult(encoded);
      onEncodingComplete?.(encoded);
    } catch (err) { setError(err.message || "Encoding failed."); }
  }

  const shownRows = result?.rows ?? [];
  const shownColumns = shownRows.length ? Object.keys(shownRows[0]) : [];

  return <main className="ce-page">
    <header className="ce-header">
      <div><p className="ce-eyebrow">SPRINT 3 · DATA PREPROCESSING · TASK 3.2</p>
        <h1>Categorical Encoding</h1>
        <p className="ce-muted">Identify categorical columns and convert categories into numeric features.</p></div>
      <span className="ce-chip">{datasetName}</span>
    </header>
    <div className="ce-stats">
      <div className="ce-stat"><span>Rows</span><strong>{rows.length}</strong></div>
      <div className="ce-stat"><span>Columns</span><strong>{rows.length ? Object.keys(rows[0]).length : 0}</strong></div>
      <div className="ce-stat"><span>Categorical columns</span><strong>{categoricalColumns.length}</strong></div>
    </div>
    <section className="ce-card">
      <h2>1. Detected categorical columns</h2>
      {!rows.length ? <p className="ce-muted">No dataset loaded. Provide dataset rows to begin.</p> :
        categoricalColumns.length === 0 ? <p className="ce-muted">No categorical columns detected.</p> :
        <div className="ce-table-wrap"><table className="ce-table"><thead><tr><th>Column</th><th>Unique categories</th><th>Values</th></tr></thead>
          <tbody>{categoricalColumns.map((c) => <tr key={c.name}><td>{c.name}</td><td>{c.uniqueCount}</td><td>{c.uniqueValues.slice(0, 8).join(", ")}{c.uniqueCount > 8 ? "…" : ""}</td></tr>)}</tbody>
        </table></div>}
    </section>
    <section className="ce-card">
      <h2>2. Choose an encoding method</h2>
      <div className="ce-form-grid">
        <label>Categorical column<select value={selectedColumn} onChange={(e) => setColumnName(e.target.value)}>
          {!categoricalColumns.length && <option value="">No categorical columns</option>}
          {categoricalColumns.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
        </select></label>
        <label>Encoding method<select value={method} onChange={(e) => setMethod(e.target.value)}>
          <option value="one-hot">One-Hot Encoding</option><option value="label">Label Encoding</option>
        </select></label>
      </div>
      {method === "one-hot" && <label className="ce-checkbox"><input type="checkbox" checked={dropFirst} onChange={(e) => setDropFirst(e.target.checked)} />
        Drop first category (optional)</label>}
      <button className="ce-button" onClick={handleEncode} disabled={!rows.length || !selectedColumn}>Encode selected column</button>
      {error && <p role="alert" className="ce-error">{error}</p>}
    </section>
    {result && <section className="ce-card"><h2>3. Encoded dataset preview</h2>
      <p className="ce-success">{result.method === "one-hot" ? "One-hot encoding" : "Label encoding"} applied to <strong>{result.sourceColumn || selectedColumn}</strong>.</p>
      {result.method === "label" && <p className="ce-muted">Mapping: {Object.entries(result.mapping).map(([k, v]) => `${k} → ${v}`).join(" · ")}</p>}
      <div className="ce-table-wrap"><table className="ce-table"><thead><tr>{shownColumns.map((c) => <th key={c}>{c}</th>)}</tr></thead>
        <tbody>{shownRows.slice(0, 10).map((row, i) => <tr key={i}>{shownColumns.map((c) => <td key={c}>{row[c] === null || row[c] === "" ? "—" : String(row[c])}</td>)}</tr>)}</tbody>
      </table></div><p className="ce-muted">Showing {Math.min(10, shownRows.length)} of {shownRows.length} rows.</p>
    </section>}
  </main>;
}
