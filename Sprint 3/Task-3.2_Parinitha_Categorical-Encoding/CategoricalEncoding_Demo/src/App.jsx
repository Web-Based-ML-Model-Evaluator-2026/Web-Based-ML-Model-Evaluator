import React, { useState } from "react";
import CategoricalEncoding from "./components/CategoricalEncoding.jsx";
import { parseCsvText } from "./utils/categoricalEncoding.js";

const sampleRows = [
  { student: "Asha", department: "CSE", year: 2, score: 85 },
  { student: "Ravi", department: "ECE", year: 3, score: 78 },
  { student: "Mina", department: "CSE", year: 2, score: 91 },
  { student: "Dev", department: "ISE", year: 4, score: 73 },
  { student: "Asha", department: "CSE", year: 2, score: 88 },
];
export default function App() {
  const [rows, setRows] = useState(sampleRows);
  const [name, setName] = useState("categorical_sample.csv");
  const [error, setError] = useState("");
  function upload(event) {
    const file = event.target.files?.[0]; if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv")) { setError("Please choose a CSV file."); return; }
    const reader = new FileReader();
    reader.onload = () => { try { setRows(parseCsvText(String(reader.result))); setName(file.name); setError(""); }
      catch (e) { setError(e.message || "Could not read CSV."); } };
    reader.readAsText(file);
  }
  return <><div className="toolbar"><label>Load your CSV <input type="file" accept=".csv,text/csv" onChange={upload} /></label>
    <button onClick={() => { setRows(sampleRows); setName("categorical_sample.csv"); setError(""); }}>Restore sample data</button>
    {error && <span className="error">{error}</span>}</div>
    <CategoricalEncoding rows={rows} datasetName={name} /></>;
}
