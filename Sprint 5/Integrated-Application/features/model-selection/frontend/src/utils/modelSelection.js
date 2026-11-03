export const TASK_TYPES = {
  CLASSIFICATION: "classification",
  REGRESSION: "regression",
};

export const ALGORITHMS = {
  classification: [
    { id: "logistic_regression", label: "Logistic Regression", description: "A classification model commonly used to estimate class probabilities." },
    { id: "decision_tree_classifier", label: "Decision Tree Classifier", description: "Uses decision rules arranged in a tree to predict a class." },
    { id: "knn_classifier", label: "K-Nearest Neighbors (KNN) Classifier", description: "Predicts a class using nearby training examples." },
    { id: "random_forest_classifier", label: "Random Forest Classifier", description: "Combines multiple decision trees to predict a class." },
  ],
  regression: [
    { id: "linear_regression", label: "Linear Regression", description: "Predicts a numeric value using a linear relationship." },
    { id: "decision_tree_regressor", label: "Decision Tree Regressor", description: "Uses decision rules to predict a numeric value." },
    { id: "knn_regressor", label: "K-Nearest Neighbors (KNN) Regressor", description: "Predicts a numeric value from nearby training examples." },
    { id: "random_forest_regressor", label: "Random Forest Regressor", description: "Combines multiple decision trees to predict a numeric value." },
  ],
};

export function getCompatibleAlgorithms(taskType) {
  return ALGORITHMS[taskType] ?? [];
}

export function isCompatibleSelection(taskType, algorithmId) {
  return getCompatibleAlgorithms(taskType).some((item) => item.id === algorithmId);
}

export function validateSelection(taskType, algorithmId) {
  if (!Object.values(TASK_TYPES).includes(taskType)) {
    return { valid: false, error: "Please select a valid task type." };
  }
  if (!algorithmId) {
    return { valid: false, error: "Please select an algorithm." };
  }
  if (!isCompatibleSelection(taskType, algorithmId)) {
    return { valid: false, error: "The selected algorithm is not compatible with this task type." };
  }
  return { valid: true, error: "" };
}
