import test from "node:test";
import assert from "node:assert/strict";
import {
  MODEL_CATALOG,
  buildConfigurationPayload,
  getModelDefaults,
  getModelNames,
  validateConfiguration,
} from "../src/lib/modelConfiguration.js";

test("classification catalog matches the Task 4.3 model names", () => {
  assert.deepEqual(getModelNames("classification"), [
    "Logistic Regression", "Decision Tree", "Random Forest", "SVM", "k-NN", "Naive Bayes",
  ]);
});

test("regression catalog matches the Task 4.3 model names", () => {
  assert.deepEqual(getModelNames("regression"), [
    "Linear Regression", "Ridge", "Lasso", "Decision Tree Regressor", "Random Forest Regressor",
  ]);
});

test("Logistic Regression defaults create the Task 4.3 payload shape", () => {
  const defaults = getModelDefaults("classification", "Logistic Regression");
  const payload = buildConfigurationPayload("classification", "Logistic Regression", defaults);
  assert.equal(payload.task_type, "classification");
  assert.equal(payload.model_name, "Logistic Regression");
  assert.equal(payload.hyperparameters.C, 1);
  assert.equal(payload.hyperparameters.max_iter, 1000);
  assert.equal(payload.hyperparameters.random_state, 42);
});

test("rejects a non-positive regularization parameter", () => {
  const values = { ...getModelDefaults("classification", "Logistic Regression"), C: 0 };
  const result = validateConfiguration("classification", "Logistic Regression", values);
  assert.equal(result.valid, false);
  assert.ok(result.errors.C);
});

test("rejects an unsupported model for the task", () => {
  const result = validateConfiguration("classification", "Ridge", {});
  assert.equal(result.valid, false);
});

test("uses null for unlimited tree depth", () => {
  const values = { ...getModelDefaults("classification", "Decision Tree"), max_depth: 0 };
  const result = validateConfiguration("classification", "Decision Tree", values);
  assert.equal(result.valid, true);
  assert.equal(result.hyperparameters.max_depth, null);
});

test("all catalog models have defaults and field definitions", () => {
  for (const [taskType, models] of Object.entries(MODEL_CATALOG)) {
    for (const [modelName, model] of Object.entries(models)) {
      assert.ok(model.defaults, `${taskType}/${modelName} defaults missing`);
      assert.ok(Array.isArray(model.fields), `${taskType}/${modelName} fields missing`);
    }
  }
});
