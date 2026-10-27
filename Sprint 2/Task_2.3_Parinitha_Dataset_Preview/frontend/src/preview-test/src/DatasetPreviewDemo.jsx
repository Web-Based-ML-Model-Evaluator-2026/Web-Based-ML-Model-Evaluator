
import React, { useState } from "react";
import DatasetPreview from "./components/DatasetPreview";

const sampleDataset = {
  name: "iris_sample.csv",
  columns: [
    "sepal_length",
    "sepal_width",
    "petal_length",
    "petal_width",
    "species",
  ],
  rows: [
    {
      sepal_length: 5.1,
      sepal_width: 3.5,
      petal_length: 1.4,
      petal_width: 0.2,
      species: "setosa",
    },
    {
      sepal_length: 4.9,
      sepal_width: 3.0,
      petal_length: 1.4,
      petal_width: 0.2,
      species: "setosa",
    },
    {
      sepal_length: 6.2,
      sepal_width: 3.4,
      petal_length: 5.4,
      petal_width: 2.3,
      species: "virginica",
    },
    {
      sepal_length: 5.9,
      sepal_width: 3.0,
      petal_length: 5.1,
      petal_width: 1.8,
      species: "virginica",
    },
  ],
  totalRows: 4,
  totalColumns: 5,
};

export default function DatasetPreviewDemo() {
  const [mode, setMode] = useState("dataset");

  return (
    <main className="p-6">
      <h1 className="text-3xl font-bold">Dataset Preview Demo</h1>

      <div className="my-4 flex flex-wrap gap-2">
        <button onClick={() => setMode("dataset")}>Show dataset</button>
        <button onClick={() => setMode("empty")}>Test empty state</button>
        <button onClick={() => setMode("loading")}>Test loading state</button>
        <button onClick={() => setMode("error")}>Test error state</button>
      </div>

      <DatasetPreview
        dataset={mode === "dataset" ? sampleDataset : null}
        loading={mode === "loading"}
        error={mode === "error" ? "Unable to retrieve dataset." : ""}
      />
    </main>
  );
}
