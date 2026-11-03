import React, { useEffect, useRef, useState } from 'react';
import { Star, Check, Loader2, Trash2 } from 'lucide-react';
import {
  DEFAULT_API_BASE_URL,
  buildMetricsMap,
  sameMetrics,
  getPreferredModel,
  savePreferredModel,
  clearPreferredModel,
} from '../lib/preferredModelApi';

/**
 * Task 5.3: lets the user pick a preferred model from the evaluated candidates and
 * saves that choice together with the results (metrics) the model had when chosen.
 *
 * Props
 *   projectId          string   project the preference belongs to
 *   taskType           string   'classification' | 'regression'
 *   visualizationData  object   same shape as POST /api/visualize (Task 5.2):
 *                               { task_type, metrics_list: [...], models: [{ name, scores: [...] }] }
 *   hyperparameters    object   optional, saved alongside the selection
 *   onPreferredChange  func     optional, called with the saved record (or null) on load/save/clear
 *   apiBaseUrl         string   optional, defaults to http://localhost:5001
 */


export default function PreferredModelSelector({
  projectId,
  taskType,
  visualizationData,
  hyperparameters = {},
  onPreferredChange,
  apiBaseUrl = DEFAULT_API_BASE_URL,
}) {
  const key = `${projectId}|${taskType}`;

  // `loaded` and `choice` remember which project/task they belong to, so switching
  // task type shows a loading state and never leaks the previous task's selection.
  const [loaded, setLoaded] = useState({ key: null, record: null });
  const [choice, setChoice] = useState({ key: null, name: null });
  const [busy, setBusy] = useState(null); // 'saving' | 'clearing' | null
  const [error, setError] = useState('');

  const onChangeRef = useRef(onPreferredChange);
  useEffect(() => {
    onChangeRef.current = onPreferredChange;
  });

  useEffect(() => {
    let cancelled = false;
    getPreferredModel(projectId, taskType, apiBaseUrl)
      .then((record) => {
        if (cancelled) return;
        setLoaded({ key, record });
        setError('');
        onChangeRef.current?.(record);
      })
      .catch((err) => {
        if (cancelled) return;
        setLoaded({ key, record: null });
        setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [key, projectId, taskType, apiBaseUrl]);

  const isLoading = loaded.key !== key;
  const saved = isLoading ? null : loaded.record;

  // Ignore results for a different task type (e.g. while a new fetch is in flight).
  const hasCandidates = visualizationData?.task_type === taskType;
  const metricsList = hasCandidates ? visualizationData.metrics_list : [];
  const candidates = hasCandidates ? visualizationData.models : [];

  const selectedName = choice.key === key ? choice.name : saved?.model_name ?? null;
  const selectedCandidate = candidates.find((m) => m.name === selectedName);
  const currentMetrics = selectedCandidate ? buildMetricsMap(metricsList, selectedCandidate.scores) : null;

  const isNewChoice = !!selectedCandidate && selectedName !== saved?.model_name;
  const resultsChanged =
    !!selectedCandidate && selectedName === saved?.model_name && !sameMetrics(currentMetrics, saved.metrics);
  const canSave = !isLoading && !busy && (isNewChoice || resultsChanged);

  const handleSave = async () => {
    setBusy('saving');
    setError('');
    try {
      const record = await savePreferredModel(
        { projectId, taskType, modelName: selectedName, metrics: currentMetrics, hyperparameters },
        apiBaseUrl
      );
      setLoaded({ key, record });
      onChangeRef.current?.(record);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  };

  const handleClear = async () => {
    setBusy('clearing');
    setError('');
    try {
      await clearPreferredModel(projectId, taskType, apiBaseUrl);
      setLoaded({ key, record: null });
      setChoice({ key, name: null });
      onChangeRef.current?.(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  };

  const formatValue = (v) => (typeof v === 'number' ? v.toFixed(taskType === 'classification' ? 3 : 2) : v);
  const savedModelMissing = !!saved && hasCandidates && !candidates.some((m) => m.name === saved.model_name);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm mt-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
            <Star className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">Preferred Model</h2>
            <p className="text-xs text-slate-500">
              Choose the model you want to go with. Your choice and its results are saved.
            </p>
          </div>
        </div>
        {isLoading && (
          <span className="flex items-center gap-2 text-xs text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading saved choice…
          </span>
        )}
      </div>

      {saved && (
        <div className="mb-5 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
          <p className="text-sm font-semibold text-emerald-800 flex items-center gap-2">
            <Check className="w-4 h-4" /> Saved: {saved.model_name}
            <span className="text-xs font-normal text-emerald-700">
              ({new Date(saved.saved_at).toLocaleString()})
            </span>
          </p>
          <div className="flex flex-wrap gap-2 mt-2">
            {Object.entries(saved.metrics).map(([k, v]) => (
              <span key={k} className="px-2 py-0.5 bg-white border border-emerald-200 rounded text-xs text-slate-700">
                <span className="text-slate-500">{k}:</span> {formatValue(v)}
              </span>
            ))}
          </div>
          {savedModelMissing && (
            <p className="text-xs text-amber-700 mt-2">
              This model is not in the current comparison, so the results above are the ones saved earlier.
            </p>
          )}
        </div>
      )}

      {candidates.length === 0 ? (
        <p className="text-sm text-slate-500">No evaluated models available to choose from yet.</p>
      ) : (
        <fieldset disabled={isLoading || !!busy} className="space-y-2">
          <legend className="sr-only">Select your preferred model</legend>
          {candidates.map((model) => {
            const isSelected = model.name === selectedName;
            const isSaved = model.name === saved?.model_name;
            return (
              <label
                key={model.name}
                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg border cursor-pointer transition ${
                  isSelected ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span className="flex items-center gap-3">
                  <input
                    type="radio"
                    name={`preferred-model-${key}`}
                    value={model.name}
                    checked={isSelected}
                    onChange={() => setChoice({ key, name: model.name })}
                    className="accent-blue-600"
                  />
                  <span className="text-sm font-semibold text-slate-800">{model.name}</span>
                  {isSaved && (
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold uppercase rounded">
                      Preferred
                    </span>
                  )}
                </span>
                <span className="flex flex-wrap gap-2">
                  {metricsList.map((label, i) => (
                    <span key={label} className="px-2 py-0.5 bg-slate-100 rounded text-xs text-slate-600">
                      <span className="text-slate-500">{label}:</span> {formatValue(model.scores[i])}
                    </span>
                  ))}
                </span>
              </label>
            );
          })}
        </fieldset>
      )}


      {resultsChanged && (
        <p className="text-xs text-amber-700 mt-3">
          The results for {selectedName} have changed since you saved it. Save again to update them.
        </p>
      )}
      {error && (
        <p role="alert" className="text-xs text-red-600 mt-3">
          {error}
        </p>
      )}


      <div className="flex gap-3 mt-5">
        <button
          onClick={handleSave}
          disabled={!canSave}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition disabled:opacity-50"
        >
          {busy === 'saving' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Star className="w-4 h-4" />}
          {resultsChanged ? 'Update saved results' : 'Save preferred model'}
        </button>
        {saved && (
          <button
            onClick={handleClear}
            disabled={!!busy}
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold border border-slate-300 rounded-lg transition disabled:opacity-50"
          >
            {busy === 'clearing' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
