import React, { useMemo, useState } from 'react';
import { METRICS, validateComparison, rankModels, formatMetric } from '../lib/modelComparison';

export default function ModelComparison({ taskType = 'classification', models = [], apiBase = '' }) {
  const [metric, setMetric] = useState(taskType === 'classification' ? 'f1_score' : 'rmse');
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const ranked = useMemo(() => rankModels(models, metric), [models, metric]);
  const runComparison = async () => {
    const validation = validateComparison(taskType, models, metric);
    if (validation) { setError(validation); setResult(null); return; }
    try {
      const response = await fetch(`${apiBase}/api/compare`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task_type: taskType, models, primary_metric: metric })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Comparison failed');
      setResult(data); setError('');
    } catch (e) { setError(e.message || 'Unable to compare models'); setResult(null); }
  };
  return <section aria-label="Model comparison" className="model-comparison">
    <header><h2>Model comparison</h2>
      <label>Primary metric
        <select value={metric} onChange={e => { setMetric(e.target.value); setResult(null); }}>
          {METRICS[taskType].map(m => <option key={m} value={m}>{m.replace('_', ' ').toUpperCase()}</option>)}
        </select>
      </label>
      <button type="button" onClick={runComparison}>Compare models</button>
    </header>
    {error && <p role="alert">{error}</p>}
    {result && <p role="status">Best model: <strong>{result.best_model}</strong> ({result.direction} {metric})</p>}
    <table><thead><tr><th>Rank</th><th>Model</th><th>{metric}</th></tr></thead>
      <tbody>{ranked.map((model, i) => <tr key={model.name} className={i === 0 ? 'best-model' : ''}>
        <td>{i + 1}</td><td>{model.name}</td><td>{formatMetric(model.metrics?.[metric])}</td>
      </tr>)}</tbody></table>
  </section>;
}
