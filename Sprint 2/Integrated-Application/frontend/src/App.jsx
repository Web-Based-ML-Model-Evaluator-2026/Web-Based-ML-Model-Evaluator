import { useMemo, useRef, useState } from "react";
import { DatasetValidation } from "./components/DatasetValidation.jsx";
import DatasetPreview from "./components/DatasetPreview.jsx";
import { calculateDatasetStatistics, reportToCsv } from "./utils/datasetStatistics.js";

const API = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:5000";
const TABS = ["Upload & Validate", "Dataset Preview", "Statistics"];
const fmt = (value) => value === null || value === undefined ? "—" : Number(value).toLocaleString(undefined, { maximumFractionDigits: 4 });

export default function App() {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [validation, setValidation] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [dataset, setDataset] = useState(null);
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");

  const statistics = useMemo(() => {
    if (!dataset?.rows || !dataset?.columns?.length) return null;
    try { return calculateDatasetStatistics(dataset.rows, dataset.columns); }
    catch (err) { return { error: err.message }; }
  }, [dataset]);

  const selectFile = (nextFile) => {
    setFile(nextFile || null); setValidation(null); setDataset(null); setError(""); setNotice("");
    if (nextFile) setActiveTab(TABS[0]);
  };

  const uploadValidatedFile = async () => {
    if (!file || !validation?.valid || uploading) return;
    setUploading(true); setError(""); setNotice("");
    try {
      const body = new FormData(); body.append("file", file);
      const response = await fetch(`${API}/api/upload-dataset`, { method: "POST", body });
      const result = await response.json();
      if (!response.ok) {
        const message = result?.errors?.map((item) => item.message).join(" ") || result?.error || "Upload failed.";
        throw new Error(message);
      }
      const previewResponse = await fetch(`${API}/api/datasets/${encodeURIComponent(result.file_id)}/preview`);
      const preview = await previewResponse.json();
      if (!previewResponse.ok) throw new Error(preview.error || "Upload succeeded, but the dataset preview could not be loaded.");
      setDataset({ ...preview, uploadMetadata: result });
      setNotice("Dataset validated, securely stored, and ready for preview and statistics.");
      setActiveTab(TABS[1]);
    } catch (err) {
      setError(err.message || "Could not connect to the backend. Check that the API is running.");
    } finally { setUploading(false); }
  };

  const downloadStatistics = () => {
    if (!statistics || statistics.error) return;
    const blob = new Blob([reportToCsv(statistics)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob); const anchor = document.createElement("a");
    anchor.href = url; anchor.download = `${(dataset?.name || "dataset").replace(/\.csv$/i, "")}-statistics.csv`;
    document.body.appendChild(anchor); anchor.click(); anchor.remove(); URL.revokeObjectURL(url);
  };

  const filteredColumns = statistics?.columns?.filter((column) => {
    const matchesQuery = column.name.toLowerCase().includes(query.toLowerCase());
    const matchesType = typeFilter === "All" || column.inferredType === typeFilter;
    return matchesQuery && matchesType;
  }) || [];

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand-mark">ME</div><div className="brand-copy"><strong>Model Evaluator</strong><span>DATA WORKSPACE</span></div>
      <div className="sidebar-rule" />
      <p className="nav-label">SPRINT 2 WORKFLOW</p>
      <nav>{TABS.map((tab, index) => <button key={tab} className={`nav-item ${activeTab === tab ? "active" : ""}`} onClick={() => setActiveTab(tab)}><span className="nav-number">0{index + 1}</span><span>{tab}</span>{dataset && index < 3 && <span className="nav-check">✓</span>}</button>)}</nav>
      <div className="sidebar-bottom"><span className="status-dot"/><span>Local workspace</span><small>CSV · max 10 MB</small></div>
    </aside>
    <main className="main-content">
      <header className="topbar"><div><span className="crumb">Workspace</span><span className="slash">/</span><strong>{activeTab}</strong></div><div className="user-chip"><span className="avatar">ML</span><span>Dataset Analyst</span></div></header>
      <section className="page-intro"><div><p className="eyebrow">DATASET INTELLIGENCE <span>·</span> SPRINT 2</p><h1>{activeTab === TABS[0] ? "Prepare your dataset" : activeTab === TABS[1] ? "Explore dataset structure" : "Understand your data"}</h1><p className="intro-subtitle">{activeTab === TABS[0] ? "Upload a CSV and validate its quality before using it downstream." : activeTab === TABS[1] ? "Inspect dimensions, column types, and a safe preview of your validated dataset." : "Review distributions, missing values, duplicates, and descriptive metrics."}</p></div>{dataset && <div className="dataset-pill"><span className="status-dot"/><span>{dataset.name}</span></div>}</section>
      {error && <div className="banner error-banner" role="alert"><strong>Something needs attention</strong><span>{error}</span><button onClick={() => setError("")} aria-label="Dismiss error">×</button></div>}
      {notice && <div className="banner success-banner" role="status"><strong>✓</strong><span>{notice}</span><button onClick={() => setNotice("")} aria-label="Dismiss notice">×</button></div>}

      {activeTab === TABS[0] && <>
        <section className="panel upload-panel"><div className="panel-heading"><div><span className="step-label">STEP 01</span><h2>Upload a CSV dataset</h2><p>Choose a file from your computer. Validation runs before the server stores it.</p></div><div className="heading-icon">↑</div></div>
          <button className={`dropzone ${file ? "has-file" : ""}`} onClick={() => inputRef.current?.click()} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); selectFile(event.dataTransfer.files?.[0]); }}><span className="upload-icon">↑</span><strong>{file ? file.name : "Choose a CSV file or drag it here"}</strong><span>{file ? `${(file.size / 1024).toFixed(1)} KB · Selected` : "Comma-separated values · UTF-8 · up to 10 MB"}</span><span className="browse-label">{file ? "Choose another file" : "Browse files"}</span></button>
          <input ref={inputRef} className="hidden-input" type="file" accept=".csv,text/csv" onChange={(event) => selectFile(event.target.files?.[0])}/>
          <div className="flow-steps"><div className="flow-step current"><span>1</span><div><strong>Select</strong><small>CSV file</small></div></div><div className="flow-connector"/><div className={`flow-step ${validation ? "complete" : ""}`}><span>2</span><div><strong>Validate</strong><small>Structure & quality</small></div></div><div className="flow-connector"/><div className={`flow-step ${dataset ? "complete" : ""}`}><span>3</span><div><strong>Analyze</strong><small>Preview & statistics</small></div></div></div>
        </section>
        {file && <DatasetValidation key={`${file.name}-${file.size}-${file.lastModified}`} file={file} apiUrl={`${API}/api/validate-dataset`} onValidated={setValidation}/>}
        <div className="bottom-actions"><button className="button-secondary" onClick={() => { selectFile(null); if (inputRef.current) inputRef.current.value = ""; }}>Clear selection</button><button className="button-primary" disabled={!file || !validation?.valid || uploading} onClick={uploadValidatedFile}>{uploading ? "Uploading…" : "Upload & continue →"}</button></div>
      </>}

      {activeTab === TABS[1] && <>{dataset ? <><div className="metric-grid"><Metric label="Total rows" value={fmt(dataset.totalRows)} detail="Data records"/><Metric label="Total columns" value={fmt(dataset.totalColumns)} detail="Validated headers"/><Metric label="Preview rows" value={fmt(dataset.rows.length)} detail="Maximum 10 rows"/><Metric label="File size" value={`${fmt(dataset.uploadMetadata?.file_size_kb)} KB`} detail="Stored safely"/></div><section className="panel"><div className="panel-heading"><div><span className="step-label">TASK 2.3</span><h2>Dataset preview</h2><p>First 10 records and inferred column types.</p></div><span className="mini-badge">✓ Validated</span></div><DatasetPreview dataset={dataset} previewLimit={10}/></section><div className="bottom-actions"><button className="button-secondary" onClick={() => setActiveTab(TABS[0])}>← Upload another</button><button className="button-primary" onClick={() => setActiveTab(TABS[2])}>View statistics →</button></div></> : <EmptyState title="No dataset to preview yet" detail="Upload and validate a CSV first. The preview will appear here." onAction={() => setActiveTab(TABS[0])}/>}</>}

      {activeTab === TABS[2] && <>{!dataset ? <EmptyState title="Statistics are waiting for a dataset" detail="Upload and validate a CSV first so all metrics use the same shared dataset." onAction={() => setActiveTab(TABS[0])}/> : statistics?.error ? <div className="banner error-banner">Could not calculate statistics: {statistics.error}</div> : <>
        <div className="stats-toolbar"><div><span className="step-label">TASK 2.4</span><h2>Dataset statistics</h2><p>Computed from the validated, shared dataset.</p></div><button className="button-primary" onClick={downloadStatistics}>↓ Export summary CSV</button></div>
        <div className="metric-grid four"><Metric label="Total rows" value={fmt(statistics.overview.rowCount)} detail="Observations"/><Metric label="Total columns" value={fmt(statistics.overview.columnCount)} detail={`${statistics.overview.numericColumns} numeric · ${statistics.overview.categoricalColumns} categorical`}/><Metric label="Missing cells" value={fmt(statistics.overview.missingCells)} detail={`${statistics.overview.missingPercent}% of all cells`}/><Metric label="Duplicate rows" value={fmt(statistics.overview.duplicateRows)} detail="Exact repeated records"/></div>
        {statistics.warnings.map((warning, index) => <div className="banner info-banner" key={index}>{warning}</div>)}
        <section className="panel"><div className="panel-heading"><div><h2>Column profiles</h2><p>Type, missing values, completeness, and descriptive summaries.</p></div></div><div className="explorer-controls"><input aria-label="Search columns" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search columns…"/><select aria-label="Filter columns by type" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}><option>All</option><option>Numeric</option><option>Categorical</option><option>Empty</option></select></div><div className="table-scroll"><table className="data-table"><thead><tr><th>Column</th><th>Type</th><th>Distinct</th><th>Missing</th><th>Complete</th><th>Summary</th></tr></thead><tbody>{filteredColumns.map((column) => <tr key={column.name}><td className="column-name">{column.name}</td><td><span className={`type-tag ${column.inferredType.toLowerCase()}`}>{column.inferredType}</span></td><td>{fmt(column.distinctCount)}</td><td>{column.missing} <span className="muted">({column.missingPercent}%)</span></td><td><div className="completeness"><span><i style={{ width: `${column.completenessPercent}%` }}/></span><small>{column.completenessPercent}%</small></div></td><td>{column.numeric ? `Mean ${fmt(column.numeric.mean)} · median ${fmt(column.numeric.median)} · outliers ${column.numeric.outlierCount}` : column.categorical?.mostFrequent ? `Mode: ${column.categorical.mostFrequent.value} (${column.categorical.mostFrequent.count})` : "No non-missing values"}</td></tr>)}</tbody></table>{filteredColumns.length === 0 && <p className="empty-table">No columns match this search/filter.</p>}</div></section>
        <section className="panel category-panel"><div className="panel-heading"><div><h2>Categorical value frequencies</h2><p>Most frequent non-missing values per categorical column.</p></div></div>{statistics.columns.filter((column) => column.categorical && column.inferredType !== "Empty").length === 0 ? <p className="muted">No categorical columns were detected.</p> : <div className="frequency-grid">{statistics.columns.filter((column) => column.categorical && column.inferredType !== "Empty").map((column) => <article className="frequency-card" key={column.name}><div className="frequency-title"><strong>{column.name}</strong><span>{column.categorical.count} values</span></div>{column.categorical.frequencies.slice(0, 6).map((frequency) => <div className="frequency-row" key={frequency.value}><span title={frequency.value}>{frequency.value || "(blank)"}</span><span className="frequency-track"><i style={{ width: `${Math.max(4, frequency.count / Math.max(1, column.categorical.frequencies[0]?.count) * 100)}%` }}/></span><strong>{frequency.count}</strong></div>)}</article>)}</div>}</section>
      </>}</>}
      <footer className="footer"><span>Web-Based ML Model Evaluator</span><span>Sprint 2 · CSV upload, validation, preview & statistics</span></footer>
    </main>
  </div>;
}

function Metric({ label, value, detail }) { return <article className="metric-card"><span>{label}</span><strong>{value}</strong><small>{detail}</small></article>; }
function EmptyState({ title, detail, onAction }) { return <section className="panel empty-state"><div className="empty-symbol">▤</div><h2>{title}</h2><p>{detail}</p><button className="button-primary" onClick={onAction}>Go to upload →</button></section>; }
