import React, { useState } from "react";
import Papa from "papaparse";
import MissingValueHandling from "./components/MissingValueHandling.jsx";

const sampleCsv = `student_id,study_hours,attendance,score,department,passed
S001,2.5,82,65,Computer Science,yes
S002,4,95,88,Computer Science,yes
S003,1.5,,52,Electronics,no
S004,5,98,94,,yes
S005,3,86,76,Information Science,yes
S006,,75,61,Electronics,no
S007,2,80,NA,Information Science,no
S008,4.5,92,91,Computer Science,yes
S009,3.5,89,83,Electronics,
S010,1,60,45,Information Science,no`;

function parse(text) {
  const out = Papa.parse(text.trim(), { header: true, skipEmptyLines: true });
  if (out.errors.length) throw new Error(`CSV error on row ${(out.errors[0].row ?? 0) + 1}: ${out.errors[0].message}`);
  if (!out.data.length) throw new Error("CSV must contain a header and at least one data row.");
  return out.data;
}

export default function App() {
  const [rows, setRows] = useState(() => parse(sampleCsv));
  const [name, setName] = useState("missing_sample.csv");
  const [error, setError] = useState("");
  function upload(event) {
    const file = event.target.files?.[0]; if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv")) { setError("Please choose a CSV file."); return; }
    const reader = new FileReader();
    reader.onload = () => { try { setRows(parse(String(reader.result))); setName(file.name); setError(""); }
      catch (e) { setError(e.message || "Could not read CSV."); } };
    reader.readAsText(file);
  }
  return <><div className="toolbar"><label>Load your CSV <input type="file" accept=".csv,text/csv" onChange={upload} /></label>
    <button onClick={() => { setRows(parse(sampleCsv)); setName("missing_sample.csv"); setError(""); }}>Restore sample data</button>
    {error && <span className="error">{error}</span>}</div>
    <MissingValueHandling rows={rows} datasetName={name} /></>;
}
