// Task 5.3: client for the /api/preferred-model endpoints.
// Defaults to the Task 5.2 server (port 5001), where the blueprint is registered.
export const DEFAULT_API_BASE_URL = 'http://localhost:5001';

/**
 * Turns a metric label into the snake_case key used by the report generator
 * ("F1 Score" -> "f1_score", "R2 Score" -> "r2_score", "MAE" -> "mae").
 */
export function metricKey(label) {
  return String(label).trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

/**
 * Builds { metric_key: value } for one model from the /api/visualize payload shape:
 * metrics_list = ['Accuracy', ...], model.scores = [0.94, ...].
 */
export function buildMetricsMap(metricsList, scores) {
  const metrics = {};
  (metricsList ?? []).forEach((label, i) => {
    if (typeof scores?.[i] === 'number') metrics[metricKey(label)] = scores[i];
  });
  return metrics;
}

/** True when two metric maps hold the same keys and values. */
export function sameMetrics(a, b) {
  const ka = Object.keys(a ?? {});
  const kb = Object.keys(b ?? {});
  return ka.length === kb.length && ka.every((k) => a[k] === b?.[k]);
}

async function request(url, options) {
  let res;
  try {
    res = await fetch(url, options);
  } catch {
    throw new Error('Could not reach the server. Is the backend running?');
  }
  let body = null;
  try {
    body = await res.json();
  } catch {
    // non-JSON response; handled below
  }
  if (!res.ok) {
    throw new Error(body?.message || `Request failed with status ${res.status}`);
  }
  return body;
}

export async function getPreferredModel(projectId, taskType, baseUrl = DEFAULT_API_BASE_URL) {
  const qs = new URLSearchParams({ project_id: projectId, task_type: taskType });
  const body = await request(`${baseUrl}/api/preferred-model?${qs}`);
  return body.preferred_model; // null when nothing has been saved yet
}

export async function savePreferredModel(
  { projectId, taskType, modelName, metrics, hyperparameters = {} },
  baseUrl = DEFAULT_API_BASE_URL
) {
  const body = await request(`${baseUrl}/api/preferred-model`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      project_id: projectId,
      task_type: taskType,
      model_name: modelName,
      metrics,
      hyperparameters,
    }),
  });
  return body.preferred_model;
}

export async function clearPreferredModel(projectId, taskType, baseUrl = DEFAULT_API_BASE_URL) {
  const qs = new URLSearchParams({ project_id: projectId, task_type: taskType });
  await request(`${baseUrl}/api/preferred-model?${qs}`, { method: 'DELETE' });
}
