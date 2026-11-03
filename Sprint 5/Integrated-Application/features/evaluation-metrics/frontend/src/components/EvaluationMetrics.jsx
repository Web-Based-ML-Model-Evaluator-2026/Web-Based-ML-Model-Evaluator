import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Loader2, AlertTriangle, BarChart3 } from 'lucide-react';

// TASK 4.4: Evaluation Metrics panel.
// Props: taskType ('classification' | 'regression'), runId (changes after each training run to re-fetch).
const API_URL = 'http://localhost:5000/api/evaluate';
const pct = (v) => (v === null || v === undefined ? '—' : `${(v * 100).toFixed(2)}%`);
const num = (v, d = 4) => (v === null || v === undefined ? '—' : Number(v).toFixed(d));

function MetricCard({ label, value, hint }) {
  return (
    <div className="border border-gray-100 rounded-lg p-4 bg-gray-50">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

function ConfusionMatrix({ labels, matrix }) {
  const max = Math.max(1, ...matrix.flat());
  return (
    <div className="overflow-x-auto">
      <table className="text-sm border-collapse">
        <thead>
          <tr>
            <th className="p-2 text-xs text-gray-500" rowSpan={2}>Actual ↓</th>
            <th className="p-2 text-xs text-gray-500 text-center" colSpan={labels.length}>Predicted →</th>
          </tr>
          <tr>
            {labels.map((l) => (
              <th key={l} className="p-2 text-xs font-semibold text-gray-700 text-center">{l}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.map((row, i) => (
            <tr key={labels[i]}>
              <th className="p-2 text-xs font-semibold text-gray-700 text-right">{labels[i]}</th>
              {row.map((count, j) => (
                <td
                  key={j}
                  className="w-16 h-12 text-center font-semibold border border-white"
                  style={{
                    backgroundColor: `rgba(37, 99, 235, ${0.08 + 0.8 * (count / max)})`,
                    color: count / max > 0.5 ? '#fff' : '#1e3a8a',
                  }}
                >
                  {count}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ActualVsPredicted({ points }) {
  const vals = points.flatMap((p) => [p.actual, p.predicted]).filter((v) => v !== null);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const span = max - min || 1;
  const size = 320, pad = 36;
  const scale = (v) => pad + ((v - min) / span) * (size - 2 * pad);
  const y = (v) => size - scale(v);
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-md border border-gray-100 rounded-lg bg-white">
      <line x1={scale(min)} y1={y(min)} x2={scale(max)} y2={y(max)} stroke="#9ca3af" strokeDasharray="4 4" />
      {points.map((p, i) => (
        <circle key={i} cx={scale(p.actual)} cy={y(p.predicted)} r="3" fill="#2563eb" fillOpacity="0.55" />
      ))}
      <text x={size / 2} y={size - 8} textAnchor="middle" fontSize="11" fill="#6b7280">Actual</text>
      <text x="10" y={size / 2} fontSize="11" fill="#6b7280" transform={`rotate(-90 10 ${size / 2})`} textAnchor="middle">Predicted</text>
      <text x={pad} y="16" fontSize="10" fill="#9ca3af">Dashed line = perfect prediction</text>
    </svg>
  );
}

export default function EvaluationMetrics({ taskType, runId }) {
  const [state, setState] = useState('loading');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setState('loading');
    axios.post(API_URL, { task_type: taskType })
      .then((res) => { if (!cancelled) { setData(res.data); setState('done'); } })
      .catch((err) => {
        if (cancelled) return;
        setError(err.response?.data?.message || 'Network error: Unable to reach the evaluation server.');
        setState('error');
      });
    return () => { cancelled = true; };
  }, [taskType, runId]);

  if (state === 'loading') {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center gap-2 text-gray-600">
        <Loader2 className="animate-spin h-4 w-4" /> Computing evaluation metrics...
      </div>
    );
  }
  if (state === 'error') {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md shadow-sm flex gap-3">
        <AlertTriangle className="h-5 w-5 text-red-500" />
        <div>
          <h3 className="text-sm font-medium text-red-800">Evaluation Failure</h3>
          <p className="mt-1 text-sm text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  const m = data.metrics;
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="bg-blue-50 border-b border-blue-100 px-6 py-4 flex items-center gap-3">
        <BarChart3 className="h-6 w-6 text-blue-600" />
        <h3 className="text-lg font-semibold text-blue-900">
          Evaluation Metrics ({data.task_type}) · {data.n_samples} test samples
        </h3>
      </div>

      <div className="p-6 space-y-6">
        {data.task_type === 'classification' ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard label="Accuracy" value={pct(m.accuracy)} />
              <MetricCard label="Precision (macro)" value={pct(m.macro.precision)} hint={`weighted: ${pct(m.weighted.precision)}`} />
              <MetricCard label="Recall (macro)" value={pct(m.macro.recall)} hint={`weighted: ${pct(m.weighted.recall)}`} />
              <MetricCard label="F1 (macro)" value={pct(m.macro.f1)} hint={`weighted: ${pct(m.weighted.f1)}`} />
            </div>
            {m.binary && (
              <p className="text-sm text-gray-600">
                Positive class <code>{m.binary.positive_label}</code>: precision {pct(m.binary.precision)}, recall {pct(m.binary.recall)}, F1 {pct(m.binary.f1)}
              </p>
            )}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Confusion Matrix</h4>
              <ConfusionMatrix labels={data.labels} matrix={data.confusion_matrix} />
            </div>
            <div className="overflow-x-auto">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Per-class Report</h4>
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase text-gray-500 border-b">
                    <th className="py-2 pr-4">Class</th><th className="pr-4">Precision</th><th className="pr-4">Recall</th><th className="pr-4">F1</th><th>Support</th>
                  </tr>
                </thead>
                <tbody>
                  {data.per_class.map((c) => (
                    <tr key={c.label} className="border-b border-gray-50">
                      <td className="py-2 pr-4 font-medium">{c.label}</td>
                      <td className="pr-4">{pct(c.precision)}</td>
                      <td className="pr-4">{pct(c.recall)}</td>
                      <td className="pr-4">{pct(c.f1)}</td>
                      <td>{c.support}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard label="RMSE" value={num(m.rmse)} hint="same units as target" />
              <MetricCard label="MAE" value={num(m.mae)} />
              <MetricCard label="MSE" value={num(m.mse)} />
              <MetricCard label="R² Score" value={num(m.r2)} hint="1.0 = perfect fit" />
              <MetricCard label="Median AE" value={num(m.median_ae)} />
              <MetricCard label="Max Error" value={num(m.max_error)} />
              <MetricCard label="Mean Residual" value={num(m.mean_residual)} hint="bias (actual − predicted)" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Actual vs Predicted</h4>
              <ActualVsPredicted points={data.points} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}