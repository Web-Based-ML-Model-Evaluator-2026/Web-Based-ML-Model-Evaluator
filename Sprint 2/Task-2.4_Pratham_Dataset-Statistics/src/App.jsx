import { useMemo, useRef, useState } from "react";
import Papa from "papaparse";
import {
  Activity, AlertCircle, BarChart3, CheckCircle2, ChevronDown, CircleHelp,
  Database, Download, FileSpreadsheet, FileUp, Filter, Info, Layers3,
  Search, ShieldCheck, Table2, X
} from "lucide-react";
import {
  Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis
} from "recharts";
import { calculateDatasetStatistics, reportToCsv } from "./utils/datasetStatistics.js";

const SAMPLE = `student_id,study_hours,attendance,score,department,passed
S001,2.5,82,65,Computer Science,yes
S002,4,95,88,Computer Science,yes
S003,1.5,70,52,Electronics,no
S004,5,98,94,Computer Science,yes
S005,3,86,76,Information Science,yes
S006,,75,61,Electronics,no
S007,2,80,58,Information Science,no
S008,4.5,92,91,Computer Science,yes
S009,3.5,89,83,Electronics,yes
S010,1,60,45,Information Science,no
S011,2.5,82,65,Computer Science,yes`;

const fmt = (value) => value === null || value === undefined || Number.isNaN(value)
  ? "—" : typeof value === "number" ? value.toLocaleString(undefined, { maximumFractionDigits: 3 }) : value;

function StatCard({ icon: Icon, label, value, note }) {
  return <article className="stat-card"><div className="stat-card-top"><span>{label}</span><span className="stat-icon"><Icon size={18} /></span></div><strong>{value}</strong><small>{note}</small></article>;
}

function EmptyState({ onSample }) {
  return <div className="empty-state"><div className="empty-icon"><FileSpreadsheet size={28}/></div><h2>Understand your data before modelling</h2><p>Upload a CSV file to calculate descriptive statistics, completeness, distributions, and potential outliers.</p><div className="empty-actions"><button className="primary" onClick={() => document.getElementById("csv-file").click()}><FileUp size={16}/> Choose CSV</button><button className="secondary" onClick={onSample}>Explore sample dataset</button></div><small>CSV only · maximum 10 MB · processed locally in this demo</small></div>;
}

export default function App() {
  const [dataset, setDataset] = useState(null);
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [activeTab, setActiveTab] = useState("overview");
  const [busy, setBusy] = useState(false);
  const inputRef = useRef(null);

  const parseText = (text, name) => {
    setBusy(true); setError(""); setNotice("");
    Papa.parse(text, {
      skipEmptyLines: "greedy",
      dynamicTyping: false,
      complete: (result) => {
        try {
          const parsed = result.data;
          if (!parsed || parsed.length < 1) throw new Error("The CSV is empty or has no readable header.");
          if (result.errors?.length) {
            const severe = result.errors.filter(e => e.code !== "TooManyFields" && e.code !== "TooFewFields");
            if (severe.length) throw new Error(`CSV parsing failed: ${severe[0].message}`);
          }
          const headers = parsed[0].map((v) => String(v ?? "").trim());
          if (!headers.length || headers.every((h) => !h)) throw new Error("The CSV must contain a non-empty header row.");
          if (headers.some((h) => !h)) throw new Error("One or more column headers are blank. Give every column a name.");
          const body = parsed.slice(1);
          const inconsistent = body.findIndex(row => row.length !== headers.length);
          if (inconsistent >= 0) throw new Error(`Row ${inconsistent + 2} has ${body[inconsistent].length} fields; expected ${headers.length}. Check the CSV delimiter or row structure.`);
          const rows = body.map(row => Object.fromEntries(headers.map((h, i) => [h, row[i] ?? ""])));
          const calculated = calculateDatasetStatistics(rows, headers);
          setDataset({ name, headers, rows });
          setReport(calculated);
          setActiveTab("overview");
          setNotice(`Statistics calculated for ${name}.`);
        } catch (e) { setError(e.message || "Could not analyze this CSV."); }
        finally { setBusy(false); }
      },
      error: (e) => { setError(e.message || "Unable to parse the CSV file."); setBusy(false); }
    });
  };

  const handleFile = (file) => {
    if (!file) return;
    setError(""); setNotice("");
    if (!file.name.toLowerCase().endsWith(".csv")) { setError("Unsupported file type. Please choose a .csv file."); return; }
    if (file.size === 0) { setError("This file is empty (0 bytes). Choose a CSV containing a header and data."); return; }
    if (file.size > 10 * 1024 * 1024) { setError("File exceeds the 10 MB demo limit."); return; }
    const reader = new FileReader();
    reader.onload = () => parseText(String(reader.result || ""), file.name);
    reader.onerror = () => setError("The file could not be read by the browser.");
    reader.readAsText(file);
  };

  const loadSample = () => parseText(SAMPLE, "student-performance-sample.csv");
  const filteredColumns = useMemo(() => (report?.columns || []).filter(c =>
    c.name.toLowerCase().includes(query.toLowerCase()) &&
    (typeFilter === "All" || c.inferredType === typeFilter)
  ), [report, query, typeFilter]);

  const downloadReport = () => {
    if (!report) return;
    const blob = new Blob([reportToCsv(report)], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = "dataset-statistics.csv"; link.click();
    URL.revokeObjectURL(url);
  };

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><BarChart3 size={20}/></div><div><strong>ModelScope</strong><small>ML WORKSPACE</small></div></div>
      <div className="workspace-label">WORKSPACE</div>
      <div className="nav-item"><Layers3 size={17}/> Projects</div>
      <div className="nav-item"><FileSpreadsheet size={17}/> Datasets</div>
      <div className="nav-item selected"><BarChart3 size={17}/> Dataset statistics</div>
      <div className="sidebar-bottom"><div className="sidebar-tip"><ShieldCheck size={18}/><strong>Data quality first</strong><p>Review missing values, distributions, and unusual observations before training a model.</p></div><small>SPRINT 2 · TASK 2.4</small></div>
    </aside>
    <main className="main">
      <header className="topbar"><div><span className="breadcrumb">Datasets</span><span className="crumb-slash">/</span><strong>Statistics</strong></div><div className="profile"><span className="avatar">PK</span><span>Pratham Kumar</span><ChevronDown size={14}/></div></header>
      <section className="page-heading"><div><div className="eyebrow"><Activity size={14}/> DATASET INTELLIGENCE</div><h1>Dataset statistics</h1><p>Explore data quality, distributions, and descriptive metrics before model evaluation.</p></div>{report && <button className="primary export" onClick={downloadReport}><Download size={16}/> Export summary</button>}</section>

      <div className="upload-strip">
        <div className="upload-copy"><div className="upload-icon"><FileSpreadsheet size={21}/></div><div><strong>{dataset?.name || "Analyze a dataset"}</strong><p>{dataset ? `${report.overview.rowCount.toLocaleString()} rows · ${report.overview.columnCount} columns` : "Choose a CSV or use the sample dataset to explore this feature."}</p></div></div>
        <div className="upload-actions"><input id="csv-file" ref={inputRef} type="file" accept=".csv,text/csv" onChange={e => handleFile(e.target.files?.[0])}/><button className="secondary" onClick={() => inputRef.current?.click()}><FileUp size={16}/> Upload CSV</button>{dataset && <button className="icon-button" title="Clear dataset" onClick={() => {setDataset(null);setReport(null);setError("");setNotice("");}}><X size={16}/></button>}</div>
      </div>

      {error && <div role="alert" className="alert error"><AlertCircle size={18}/><span>{error}</span><button onClick={() => setError("")} aria-label="Dismiss error"><X size={16}/></button></div>}
      {notice && <div role="status" className="alert success"><CheckCircle2 size={18}/>{notice}</div>}
      {busy && <div className="alert info"><Activity size={18}/> Parsing CSV and calculating statistics…</div>}

      {!report ? <EmptyState onSample={loadSample}/> : <>
        <div className="stat-grid">
          <StatCard icon={Table2} label="Total rows" value={fmt(report.overview.rowCount)} note="Observations in dataset"/>
          <StatCard icon={Layers3} label="Total columns" value={fmt(report.overview.columnCount)} note={`${report.overview.numericColumns} numeric · ${report.overview.categoricalColumns} categorical`}/>
          <StatCard icon={AlertCircle} label="Missing cells" value={fmt(report.overview.missingCells)} note={`${report.overview.missingPercent}% of all cells`}/>
          <StatCard icon={Database} label="Duplicate rows" value={fmt(report.overview.duplicateRows)} note="Exact repeated rows"/>
        </div>
        {report.warnings.length > 0 && <div className="alert info"><Info size={18}/><div>{report.warnings.map((w,i)=><p key={i}>{w}</p>)}</div></div>}
        <div className="tabs" role="tablist">
          {[["overview","Overview"],["numeric","Numeric analysis"],["categorical","Categorical analysis"],["quality","Data quality"]].map(([id,label])=><button role="tab" aria-selected={activeTab===id} className={activeTab===id?"tab active":"tab"} key={id} onClick={()=>setActiveTab(id)}>{label}</button>)}
        </div>

        {activeTab === "overview" && <div className="panel-grid">
          <section className="panel"><div className="panel-heading"><div><h2>Column profile</h2><p>Type and completeness for every column</p></div><Table2 size={18}/></div><div className="table-wrap"><table><thead><tr><th>Column</th><th>Type</th><th>Missing</th><th>Complete</th></tr></thead><tbody>{report.columns.map(c=><tr key={c.name}><td className="column-name">{c.name}</td><td><span className={`type-pill ${c.inferredType.toLowerCase()}`}>{c.inferredType}</span></td><td>{c.missing} <small>({c.missingPercent}%)</small></td><td><div className="progress-cell"><div className="progress"><span style={{width:`${c.completenessPercent}%`}}/></div><small>{c.completenessPercent}%</small></div></td></tr>)}</tbody></table></div></section>
          <section className="panel"><div className="panel-heading"><div><h2>Dataset composition</h2><p>Column type distribution</p></div><BarChart3 size={18}/></div><div className="composition"><div className="composition-number">{report.overview.columnCount}<small>columns</small></div><div className="composition-legend"><div><span className="dot numeric-dot"/><span>Numeric</span><strong>{report.overview.numericColumns}</strong></div><div><span className="dot category-dot"/><span>Categorical</span><strong>{report.overview.categoricalColumns}</strong></div><div><span className="dot empty-dot"/><span>Empty</span><strong>{report.overview.emptyColumns}</strong></div></div></div><div className="quality-callout"><Info size={17}/><p>{report.overview.missingCells ? `${report.overview.missingPercent}% of cells are missing. Review the Data quality tab before model training.` : "No missing cells detected. Continue reviewing distributions and duplicates before training."}</p></div></section>
        </div>}

        {activeTab === "numeric" && <section className="panel"><div className="panel-heading"><div><h2>Numerical summary</h2><p>Distribution measures and potential outliers</p></div><Activity size={18}/></div>{report.columns.filter(c=>c.numeric).length===0?<div className="empty-inline">No numeric columns were detected.</div>:<div className="table-wrap"><table><thead><tr>{["Column","Count","Mean","Median","Std. dev.","Min","Q1","Q3","Max","Outliers"].map(x=><th key={x}>{x}</th>)}</tr></thead><tbody>{report.columns.filter(c=>c.numeric).map(c=><tr key={c.name}><td className="column-name">{c.name}</td><td>{fmt(c.numeric.count)}</td><td>{fmt(c.numeric.mean)}</td><td>{fmt(c.numeric.median)}</td><td>{fmt(c.numeric.standardDeviation)}</td><td>{fmt(c.numeric.min)}</td><td>{fmt(c.numeric.q1)}</td><td>{fmt(c.numeric.q3)}</td><td>{fmt(c.numeric.max)}</td><td>{c.numeric.outlierCount}</td></tr>)}</tbody></table></div>}</section>}

        {activeTab === "categorical" && <section className="panel"><div className="panel-heading"><div><h2>Categorical distributions</h2><p>Most frequent values per column (up to 10)</p></div><BarChart3 size={18}/></div><div className="category-grid">{report.columns.filter(c=>c.categorical && c.inferredType!=="Empty").map(c=><article className="category-card" key={c.name}><div className="category-title"><strong>{c.name}</strong><span>{c.categorical.count} values</span></div>{c.categorical.frequencies.length ? <div className="frequency-list">{c.categorical.frequencies.slice(0,6).map((f,i)=><div className="frequency-row" key={f.value}><span title={f.value}>{f.value || "(blank)"}</span><div className="frequency-track"><span style={{width:`${Math.max(3,(f.count/Math.max(1,c.categorical.frequencies[0].count))*100)}%`}}/></div><strong>{f.count}</strong></div>)}</div>:<p className="muted">No non-missing values.</p>}{c.categorical.frequenciesTruncated && <small className="muted">Showing top values only.</small>}</article>)}</div>{report.columns.every(c=>!c.categorical || c.inferredType==="Empty")&&<div className="empty-inline">No categorical columns were detected.</div>}</section>}

        {activeTab === "quality" && <section className="panel"><div className="panel-heading"><div><h2>Data quality report</h2><p>Completeness and missing-value review</p></div><ShieldCheck size={18}/></div><div className="quality-summary"><div><span>Missing cells</span><strong>{report.overview.missingCells}</strong></div><div><span>Missing percentage</span><strong>{report.overview.missingPercent}%</strong></div><div><span>Duplicate rows</span><strong>{report.overview.duplicateRows}</strong></div></div><div className="table-wrap"><table><thead><tr><th>Column</th><th>Non-missing</th><th>Missing</th><th>Missing %</th><th>Quality signal</th></tr></thead><tbody>{report.columns.map(c=><tr key={c.name}><td className="column-name">{c.name}</td><td>{c.total-c.missing}</td><td>{c.missing}</td><td>{c.missingPercent}%</td><td><span className={`quality-pill ${c.missingPercent===0?"good":c.missingPercent<20?"warn":"bad"}`}>{c.missingPercent===0?"Complete":c.missingPercent<20?"Review":"High missingness"}</span></td></tr>)}</tbody></table></div><p className="footnote"><CircleHelp size={14}/> Outliers use the 1.5×IQR rule. Missing-value thresholds are indicators for review, not automatic rejection criteria.</p></section>}

        <section className="panel column-explorer"><div className="panel-heading"><div><h2>Column explorer</h2><p>Search and filter the computed column profiles</p></div><Filter size={18}/></div><div className="explorer-controls"><label className="search-box"><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search columns…"/></label><select value={typeFilter} onChange={e=>setTypeFilter(e.target.value)} aria-label="Filter by type"><option>All</option><option>Numeric</option><option>Categorical</option><option>Empty</option></select></div><div className="table-wrap"><table><thead><tr><th>Column</th><th>Type</th><th>Distinct</th><th>Missing</th><th>Completeness</th><th>Summary</th></tr></thead><tbody>{filteredColumns.map(c=><tr key={c.name}><td className="column-name">{c.name}</td><td><span className={`type-pill ${c.inferredType.toLowerCase()}`}>{c.inferredType}</span></td><td>{c.distinctCount}</td><td>{c.missing} ({c.missingPercent}%)</td><td>{c.completenessPercent}%</td><td>{c.numeric?`Mean ${fmt(c.numeric.mean)} · median ${fmt(c.numeric.median)}`:c.categorical?.mostFrequent?`Mode: ${c.categorical.mostFrequent.value}`:"No values"}</td></tr>)}</tbody></table>{filteredColumns.length===0&&<div className="empty-inline">No columns match this filter.</div>}</div></section>
      </>}
      <footer><span>Dataset Statistics · Sprint 2 / Task 2.4</span><span>Descriptive analytics · CSV demo</span></footer>
    </main>
  </div>;
}
