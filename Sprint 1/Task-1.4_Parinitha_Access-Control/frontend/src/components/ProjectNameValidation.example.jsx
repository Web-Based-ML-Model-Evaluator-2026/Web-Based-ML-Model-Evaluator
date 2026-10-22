import { useState } from "react";
import { validateProjectName, validateModelName } from "../utils/validation";

// Demo only: adapt styling and submit handler to the team's real project form.
export default function ProjectNameValidationExample() {
  const [name, setName] = useState("");
  const [modelName, setModelName] = useState("Iris Flower Classifier");
  const [errors, setErrors] = useState({});

  function handleSubmit(event) {
    event.preventDefault();
    const next = { name: validateProjectName(name), modelName: validateModelName(modelName) };
    setErrors(next);
    if (next.name || next.modelName) return;
    window.alert("Inputs are valid. Connect this form to the actual project API.");
  }

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="project-name">Project name</label>
      <input id="project-name" value={name} maxLength={150}
        onChange={e => setName(e.target.value)} aria-invalid={Boolean(errors.name)} />
      {errors.name && <p role="alert">{errors.name}</p>}
      <label htmlFor="model-name">Model name</label>
      <input id="model-name" value={modelName} maxLength={150}
        onChange={e => setModelName(e.target.value)} aria-invalid={Boolean(errors.modelName)} />
      {errors.modelName && <p role="alert">{errors.modelName}</p>}
      <button type="submit">Validate project</button>
    </form>
  );
}
