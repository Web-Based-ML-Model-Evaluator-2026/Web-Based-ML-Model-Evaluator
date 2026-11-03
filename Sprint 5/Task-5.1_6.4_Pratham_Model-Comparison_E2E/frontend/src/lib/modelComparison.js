export const METRICS = {
  classification: ['accuracy', 'precision', 'recall', 'f1_score'],
  regression: ['mae', 'mse', 'rmse', 'r2_score']
};
export const LOWER_IS_BETTER = new Set(['mae', 'mse', 'rmse']);

export function validateComparison(taskType, models, metric) {
  if (!METRICS[taskType]) return 'Unsupported task type';
  if (!Array.isArray(models) || models.length < 2) return 'Select at least two evaluated models';
  if (!METRICS[taskType].includes(metric)) return 'Unsupported comparison metric';
  const names = new Set();
  for (const model of models) {
    if (!model?.name?.trim() || names.has(model.name.trim())) return 'Model names must be present and unique';
    names.add(model.name.trim());
    const value = model.metrics?.[metric];
    if (typeof value !== 'number' || !Number.isFinite(value)) return `${model.name}: metric ${metric} is missing or invalid`;
    if (taskType === 'classification' && (value < 0 || value > 1)) return `${model.name}: classification metrics must be in [0, 1]`;
    if (LOWER_IS_BETTER.has(metric) && value < 0) return `${model.name}: error metrics cannot be negative`;
  }
  return null;
}
export function rankModels(models, metric) {
  return [...models].sort((a, b) => LOWER_IS_BETTER.has(metric)
    ? a.metrics[metric] - b.metrics[metric]
    : b.metrics[metric] - a.metrics[metric]);
}
export function formatMetric(value) {
  return Number.isFinite(value) ? value.toFixed(4) : '—';
}
