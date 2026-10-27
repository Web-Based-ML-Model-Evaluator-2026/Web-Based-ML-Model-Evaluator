import React, { useState } from "react";
import Papa from "papaparse";
import FeatureScaling from "./components/FeatureScaling.jsx";

const sampleCsv = `student_id,study_hours,attendance,score,department,passed
S001,2.5,82,65,Computer Science,yes
S002,4,95,88,Computer Science,yes
S003,1.5,72,52,Electronics,no
S004,5,98,94,Electronics,yes
S005,3,86,76,Information Science,yes
S006,2,75,61,Electronics,no
S007,2.8,80,70,Information Science,no
S008,4.5,92,91,Computer Science,yes`;
function parseCsv(text) {
  const parsed = Papa.parse(text.trim(), { header: true, skipEmptyLines: true, dynamicTyping: false });
  if (parsed.errors.length) throw new Error(`CSV error: ${parsed.errors[0].message}`);
  if (!parsed.data.length || !parsed.meta.fields?.length) throw new Error("CSV must contain a header and at least one data row.");
  return parsed.data;
}
export default function App() {
  const [rows, setRows] = useState(() => parseCsv(sampleCsv));
  const [name, setName] = useState("feature_scaling_sample.csv");
  const [error, setError] = useState("");
  function upload(event) {
    const file = event.target.files?.[0]; if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv")) { setError("Please choose a CSV file."); return; }
    const reader = new FileReader();
    reader.onload = () => { try { setRows(parseCsv(String(reader.result))); setName(file.name); setError(""); } catch (err) { setError(err.message || "Could not read CSV."); } };
    reader.readAsText(file);
  }
  return <div className="app-shell"><nav className="topbar"><strong>ML Model Evaluator</strong><span>Sprint 3 / Task 3.3</span></nav><div className="loadbar"><label className="upload-label">Upload CSV <input type="file" accept=".csv,text/csv" onChange={upload} /></label><button className="secondary" onClick={() => { setRows(parseCsv(sampleCsv)); setName("feature_scaling_sample.csv"); setError(""); }}>Restore sample</button>{error && <p role="alert" className="error-banner">{error}</p>}</div><FeatureScaling rows={rows} datasetName={name} /></div>;
}
