export const MODEL_CATALOG = {
  classification: {
    "Logistic Regression": {
      defaults: { C: 1, max_iter: 1000, solver: "lbfgs", random_state: 42 },
      fields: [
        { name: "C", label: "Regularization strength (C)", type: "number", min: 0.000001, step: 0.1, help: "Must be greater than zero." },
        { name: "max_iter", label: "Maximum iterations", type: "number", min: 1, step: 100 },
        { name: "solver", label: "Solver", type: "select", options: ["lbfgs", "liblinear", "newton-cg", "sag", "saga"] },
      ],
    },
    "Decision Tree": {
      defaults: { criterion: "gini", max_depth: 8, min_samples_split: 2, min_samples_leaf: 1, random_state: 42 },
      fields: [
        { name: "criterion", label: "Split criterion", type: "select", options: ["gini", "entropy", "log_loss"] },
        { name: "max_depth", label: "Maximum depth (0 = unlimited)", type: "number", min: 0, step: 1 },
        { name: "min_samples_split", label: "Minimum samples to split", type: "number", min: 2, step: 1 },
        { name: "min_samples_leaf", label: "Minimum samples per leaf", type: "number", min: 1, step: 1 },
      ],
    },
    "Random Forest": {
      defaults: { n_estimators: 100, criterion: "gini", max_depth: 0, min_samples_split: 2, min_samples_leaf: 1, random_state: 42 },
      fields: [
        { name: "n_estimators", label: "Number of trees", type: "number", min: 1, step: 10 },
        { name: "criterion", label: "Split criterion", type: "select", options: ["gini", "entropy", "log_loss"] },
        { name: "max_depth", label: "Maximum depth (0 = unlimited)", type: "number", min: 0, step: 1 },
        { name: "min_samples_split", label: "Minimum samples to split", type: "number", min: 2, step: 1 },
        { name: "min_samples_leaf", label: "Minimum samples per leaf", type: "number", min: 1, step: 1 },
      ],
    },
    "SVM": {
      defaults: { C: 1, kernel: "rbf", gamma: "scale", random_state: 42 },
      fields: [
        { name: "C", label: "Regularization strength (C)", type: "number", min: 0.000001, step: 0.1 },
        { name: "kernel", label: "Kernel", type: "select", options: ["linear", "poly", "rbf", "sigmoid"] },
        { name: "gamma", label: "Gamma", type: "select", options: ["scale", "auto"] },
      ],
    },
    "k-NN": {
      defaults: { n_neighbors: 5, weights: "uniform", p: 2 },
      fields: [
        { name: "n_neighbors", label: "Number of neighbors", type: "number", min: 1, step: 1 },
        { name: "weights", label: "Neighbor weights", type: "select", options: ["uniform", "distance"] },
        { name: "p", label: "Minkowski power (1 = Manhattan, 2 = Euclidean)", type: "select-number", options: [1, 2] },
      ],
    },
    "Naive Bayes": {
      defaults: { var_smoothing: 1e-9 },
      fields: [
        { name: "var_smoothing", label: "Variance smoothing", type: "number", min: 0, step: 1e-10 },
      ],
    },
  },
  regression: {
    "Linear Regression": {
      defaults: { fit_intercept: true },
      fields: [{ name: "fit_intercept", label: "Fit intercept", type: "boolean" }],
    },
    Ridge: {
      defaults: { alpha: 1, fit_intercept: true, random_state: 42 },
      fields: [
        { name: "alpha", label: "Regularization strength (alpha)", type: "number", min: 0, step: 0.1 },
        { name: "fit_intercept", label: "Fit intercept", type: "boolean" },
      ],
    },
    Lasso: {
      defaults: { alpha: 1, max_iter: 1000, fit_intercept: true, random_state: 42 },
      fields: [
        { name: "alpha", label: "Regularization strength (alpha)", type: "number", min: 0, step: 0.1 },
        { name: "max_iter", label: "Maximum iterations", type: "number", min: 1, step: 100 },
        { name: "fit_intercept", label: "Fit intercept", type: "boolean" },
      ],
    },
    "Decision Tree Regressor": {
      defaults: { criterion: "squared_error", max_depth: 8, min_samples_split: 2, min_samples_leaf: 1, random_state: 42 },
      fields: [
        { name: "criterion", label: "Split criterion", type: "select", options: ["squared_error", "friedman_mse", "absolute_error", "poisson"] },
        { name: "max_depth", label: "Maximum depth (0 = unlimited)", type: "number", min: 0, step: 1 },
        { name: "min_samples_split", label: "Minimum samples to split", type: "number", min: 2, step: 1 },
        { name: "min_samples_leaf", label: "Minimum samples per leaf", type: "number", min: 1, step: 1 },
      ],
    },
    "Random Forest Regressor": {
      defaults: { n_estimators: 100, criterion: "squared_error", max_depth: 0, min_samples_split: 2, min_samples_leaf: 1, random_state: 42 },
      fields: [
        { name: "n_estimators", label: "Number of trees", type: "number", min: 1, step: 10 },
        { name: "criterion", label: "Split criterion", type: "select", options: ["squared_error", "absolute_error", "friedman_mse", "poisson"] },
        { name: "max_depth", label: "Maximum depth (0 = unlimited)", type: "number", min: 0, step: 1 },
        { name: "min_samples_split", label: "Minimum samples to split", type: "number", min: 2, step: 1 },
        { name: "min_samples_leaf", label: "Minimum samples per leaf", type: "number", min: 1, step: 1 },
      ],
    },
  },
};

const RANDOM_STATE_MODELS = new Set([
  "Logistic Regression", "Decision Tree", "Random Forest", "SVM",
  "Ridge", "Lasso", "Decision Tree Regressor", "Random Forest Regressor",
]);

export function getModelNames(taskType) {
  return Object.keys(MODEL_CATALOG[taskType] ?? {});
}

export function getModelDefaults(taskType, modelName) {
  const model = MODEL_CATALOG[taskType]?.[modelName];
  if (!model) throw new Error("Select a supported task type and model.");
  return { ...model.defaults };
}

export function validateConfiguration(taskType, modelName, values) {
  const model = MODEL_CATALOG[taskType]?.[modelName];
  if (!model) return { valid: false, errors: { model_name: "Select a supported model for this task." } };

  const errors = {};
  const hyperparameters = {};
  for (const field of model.fields) {
    const raw = values[field.name];
    if (field.type === "boolean") {
      hyperparameters[field.name] = Boolean(raw);
      continue;
    }
    if (field.type === "select") {
      if (!field.options.includes(raw)) errors[field.name] = "Choose one of the listed options.";
      else hyperparameters[field.name] = raw;
      continue;
    }
    if (field.type === "select-number") {
      const parsed = Number(raw);
      if (!field.options.includes(parsed)) errors[field.name] = "Choose a supported value.";
      else hyperparameters[field.name] = parsed;
      continue;
    }
    if (raw === "" || raw === null || raw === undefined || !Number.isFinite(Number(raw))) {
      errors[field.name] = "Enter a valid number.";
      continue;
    }
    const number = Number(raw);
    if (field.min !== undefined && number < field.min) {
      errors[field.name] = `Value must be ${field.min === 0 ? "at least" : "greater than or equal to"} ${field.min}.`;
      continue;
    }
    if (Number.isInteger(field.step) && field.step === 1 && !Number.isInteger(number)) {
      errors[field.name] = "Enter a whole number.";
      continue;
    }
    if (field.name === "max_depth" && number === 0) hyperparameters[field.name] = null;
    else hyperparameters[field.name] = number;
  }

  if (RANDOM_STATE_MODELS.has(modelName)) hyperparameters.random_state = 42;
  return { valid: Object.keys(errors).length === 0, errors, hyperparameters };
}

export function buildConfigurationPayload(taskType, modelName, values) {
  const result = validateConfiguration(taskType, modelName, values);
  if (!result.valid) {
    const message = Object.values(result.errors).join(" ");
    throw new Error(message || "Invalid model configuration.");
  }
  return {
    task_type: taskType,
    model_name: modelName,
    hyperparameters: result.hyperparameters,
  };
}
