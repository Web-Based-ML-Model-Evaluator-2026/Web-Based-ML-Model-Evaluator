import React, { useEffect, useMemo, useState } from "react";
import {
  MODEL_CATALOG,
  buildConfigurationPayload,
  getModelDefaults,
  getModelNames,
  validateConfiguration,
} from "../lib/modelConfiguration";

const inputClass =
  "mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100";
const labelClass = "block text-sm font-medium text-slate-700";

export default function ModelConfiguration({
  initialTaskType = "classification",
  initialModelName,
  onSubmit,
}) {
  const [taskType, setTaskType] = useState(initialTaskType);
  const initialNames = getModelNames(initialTaskType);
  const [modelName, setModelName] = useState(
    initialModelName && initialNames.includes(initialModelName)
      ? initialModelName
      : initialNames[0],
  );
  const [values, setValues] = useState(() =>
    getModelDefaults(
      initialTaskType,
      initialModelName && initialNames.includes(initialModelName)
        ? initialModelName
        : initialNames[0],
    ),
  );
  const [submitted, setSubmitted] = useState(false);
  const [notice, setNotice] = useState("");

  const modelDefinition = MODEL_CATALOG[taskType][modelName];
  const validation = useMemo(
    () => validateConfiguration(taskType, modelName, values),
    [taskType, modelName, values],
  );

  useEffect(() => {
    const names = getModelNames(taskType);
    const nextName = names.includes(modelName) ? modelName : names[0];
    setModelName(nextName);
    setValues(getModelDefaults(taskType, nextName));
    setSubmitted(false);
    setNotice("");
  // Reset model-specific fields when the task type changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskType]);

  function changeModel(nextModel) {
    setModelName(nextModel);
    setValues(getModelDefaults(taskType, nextModel));
    setSubmitted(false);
    setNotice("");
  }

  function changeValue(name, value) {
    setValues((current) => ({ ...current, [name]: value }));
    setSubmitted(false);
    setNotice("");
  }

  function handleSubmit(event) {
    event.preventDefault();
    setSubmitted(true);
    if (!validation.valid) {
      setNotice("Correct the highlighted fields before continuing.");
      return;
    }
    const configuration = buildConfigurationPayload(taskType, modelName, values);
    setNotice("Configuration validated and ready for Task 4.3.");
    onSubmit?.(configuration);
  }

  function resetDefaults() {
    setValues(getModelDefaults(taskType, modelName));
    setSubmitted(false);
    setNotice("");
  }

  return (
    <section className="mx-auto w-full max-w-4xl rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
          Sprint 4 · Task 4.2
        </p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
          Model Configuration
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Choose the learning task and algorithm, adjust its supported
          hyperparameters, and validate the configuration before training.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="model-task-type">
              Learning task
            </label>
            <select
              id="model-task-type"
              className={inputClass}
              value={taskType}
              onChange={(event) => setTaskType(event.target.value)}
            >
              <option value="classification">Classification</option>
              <option value="regression">Regression</option>
            </select>
          </div>

          <div>
            <label className={labelClass} htmlFor="model-name">
              Algorithm
            </label>
            <select
              id="model-name"
              className={inputClass}
              value={modelName}
              onChange={(event) => changeModel(event.target.value)}
            >
              {getModelNames(taskType).map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6 rounded-xl bg-slate-50 p-4 sm:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-slate-900">
                Hyperparameters
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Values reset to the selected model's defaults when the model changes.
              </p>
            </div>
            <button
              type="button"
              onClick={resetDefaults}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              Reset defaults
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {modelDefinition.fields.map((field) => {
              const error = submitted ? validation.errors[field.name] : "";
              const id = `model-param-${field.name}`;
              return (
                <div key={field.name}>
                  {field.type === "boolean" ? (
                    <label className="flex min-h-10 items-center gap-3 text-sm font-medium text-slate-700" htmlFor={id}>
                      <input
                        id={id}
                        type="checkbox"
                        checked={Boolean(values[field.name])}
                        onChange={(event) => changeValue(field.name, event.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      {field.label}
                    </label>
                  ) : (
                    <>
                      <label className={labelClass} htmlFor={id}>{field.label}</label>
                      {field.type === "select" || field.type === "select-number" ? (
                        <select
                          id={id}
                          className={inputClass}
                          value={values[field.name]}
                          aria-invalid={Boolean(error)}
                          aria-describedby={error ? `${id}-error` : undefined}
                          onChange={(event) => changeValue(
                            field.name,
                            field.type === "select-number" ? Number(event.target.value) : event.target.value,
                          )}
                        >
                          {field.options.map((option) => (
                            <option key={option} value={option}>{String(option)}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          id={id}
                          className={inputClass}
                          type="number"
                          min={field.min}
                          step={field.step ?? "any"}
                          value={values[field.name] ?? ""}
                          aria-invalid={Boolean(error)}
                          aria-describedby={error ? `${id}-error` : undefined}
                          onChange={(event) => changeValue(field.name, event.target.value)}
                        />
                      )}
                    </>
                  )}
                  {field.help && <p className="mt-1 text-xs text-slate-500">{field.help}</p>}
                  {error && (
                    <p id={`${id}-error`} role="alert" className="mt-1 text-xs font-medium text-red-700">
                      {error}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {notice && (
          <p
            role="status"
            className={`mt-4 rounded-lg px-3 py-2 text-sm ${
              validation.valid
                ? "bg-emerald-50 text-emerald-800"
                : "bg-amber-50 text-amber-800"
            }`}
          >
            {notice}
          </p>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            className="rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
          >
            Validate configuration
          </button>
          <span className="text-xs text-slate-500">
            The validated payload is passed to the parent through <code>onSubmit</code>.
          </span>
        </div>
      </form>
    </section>
  );
}
