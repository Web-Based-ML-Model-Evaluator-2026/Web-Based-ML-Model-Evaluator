import React, { useMemo, useState } from "react";
import "./ModelSelection.css";

import {
  ALGORITHMS,
  TASK_TYPES,
  getCompatibleAlgorithms,
  validateSelection,
} from "../utils/modelSelection";

export default function ModelSelection({ onSelectionChange = () => {} }) {
  const [taskType, setTaskType] = useState(TASK_TYPES.CLASSIFICATION);
  const compatibleAlgorithms = useMemo(() => getCompatibleAlgorithms(taskType), [taskType]);
  const [algorithm, setAlgorithm] = useState(ALGORITHMS.classification[0].id);
  const [message, setMessage] = useState("");

  function handleTaskTypeChange(event) {
    const nextType = event.target.value;
    const nextAlgorithms = getCompatibleAlgorithms(nextType);
    setTaskType(nextType);
    setAlgorithm(nextAlgorithms[0]?.id ?? "");
    setMessage("");
  }

  function handleSubmit(event) {
    event.preventDefault();
    const result = validateSelection(taskType, algorithm);
    if (!result.valid) {
      setMessage(result.error);
      return;
    }
    onSelectionChange({ taskType, algorithm });
    setMessage("Selection confirmed. You can continue to model configuration.");
  }

  const selected = compatibleAlgorithms.find((item) => item.id === algorithm);

  return (
    <section className="model-selection">
      <header className="model-selection__header">
        <p className="model-selection__eyebrow">SPRINT 4 · TASK 4.1</p>
        <h2>Task and Model Selection</h2>
        <p>Choose a machine-learning problem type and a compatible algorithm.</p>
      </header>

      <form onSubmit={handleSubmit} className="model-selection__form">
        <label htmlFor="task-type">Problem type</label>
        <select id="task-type" value={taskType} onChange={handleTaskTypeChange}>
          <option value={TASK_TYPES.CLASSIFICATION}>Classification</option>
          <option value={TASK_TYPES.REGRESSION}>Regression</option>
        </select>

        <label htmlFor="model-algorithm">Compatible algorithm</label>
        <select
          id="model-algorithm"
          value={algorithm}
          onChange={(event) => { setAlgorithm(event.target.value); setMessage(""); }}
        >
          {compatibleAlgorithms.map((item) => (
            <option key={item.id} value={item.id}>{item.label}</option>
          ))}
        </select>

        {selected && (
          <div className="model-selection__details">
            <h3>{selected.label}</h3>
            <p>{selected.description}</p>
            <span>{taskType === "classification" ? "Predicts a category" : "Predicts a numeric value"}</span>
          </div>
        )}

        {message && <p role="status" aria-live="polite">{message}</p>}
        <button type="submit">Confirm model selection</button>
      </form>
    </section>
  );
}
