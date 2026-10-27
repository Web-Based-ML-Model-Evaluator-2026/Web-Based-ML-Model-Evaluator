import React, { useState, useEffect } from 'react';
// Lucide icons
import { Sliders, Play, CheckCircle2, AlertCircle, Sparkles, ChevronDown, ChevronUp, Database } from 'lucide-react';

const API_BASE = 'http://127.0.0.1:5001/api';

export default function TargetAndSplit() {
  // Schema State
  const [columns, setColumns] = useState([]);
  const [selectedTarget, setSelectedTarget] = useState('');
  const [totalRows, setTotalRows] = useState(0);
  const [datasetStatus, setDatasetStatus] = useState('loading'); // 'loading', 'empty', or 'ready'

  // Partition Configuration
  const [testSize, setTestSize] = useState(0.2);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [randomState, setRandomState] = useState(42);
  const [shuffle, setShuffle] = useState(true);

  // Status & Telemetry
  const [loading, setLoading] = useState(false);
  const [splitResult, setSplitResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchActiveDatasetInfo();
  }, []);

  /**
   * Queries the backend to check if an upstream dataset is available in the pipeline.
   */
  const fetchActiveDatasetInfo = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/dataset-info`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to check pipeline status');

      if (data.status === 'empty' || data.columns.length === 0) {
        setDatasetStatus('empty');
        setColumns([]);
        setTotalRows(0);
      } else {
        setDatasetStatus('ready');
        setColumns(data.columns);
        setTotalRows(data.total_rows);
        // Default target to the last column
        setSelectedTarget(data.columns[data.columns.length - 1] || '');
      }
    } catch (err) {
      setError(err.message);
      setDatasetStatus('empty');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Executes the train/test split.
   */
  const handleExecuteSplit = async () => {
    if (!selectedTarget) {
      setError('Please select a target column (y) to predict');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/split`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_column: selectedTarget,
          test_size: parseFloat(testSize),
          random_state: parseInt(randomState, 10),
          shuffle: shuffle,
          auto_stratify: true
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Data partitioning failed');

      setSplitResult(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const trainRatioPercent = Math.round((1 - testSize) * 100);
  const testRatioPercent = Math.round(testSize * 100);
  const isReady = datasetStatus === 'ready' && columns.length > 0;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Task Header */}
      <div className="pb-6 border-b border-slate-700">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Sliders className="w-6 h-6 text-indigo-400" />
          Task 3.4: Target Selection & Data Splitting
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Separate the target label (y) from the feature matrix (X) and generate train/test partitions for model training.
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-rose-950/50 border border-rose-500/40 text-rose-200 p-4 rounded-xl flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Empty State Banner (Shown when no data is in the pipeline yet) */}
      {!isReady && !loading && (
        <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-8 text-center space-y-3">
          <Database className="w-10 h-10 text-slate-500 mx-auto" />
          <h3 className="text-base font-semibold text-slate-200">No Preprocessed Dataset in Pipeline</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Task 3.4 receives preprocessed data from upstream tasks (Task 3.1 Imputation, Task 3.2 Encoding, and Task 3.3 Scaling).
          </p>
        </div>
      )}

      {/* Main Configuration Card */}
      <div className={`bg-slate-800/80 border border-slate-700/60 rounded-xl p-6 space-y-6 ${!isReady ? 'opacity-50 pointer-events-none' : ''}`}>
        
        {/* Step 1: Target Selection */}
        <div>
          <label className="block text-sm font-semibold text-slate-200 mb-1">
            1. Select Target Column (y)
          </label>
          <p className="text-xs text-slate-400 mb-2">
            This column will be isolated as the prediction label. All remaining columns will form the feature matrix (X).
          </p>
          <select
            value={selectedTarget}
            onChange={(e) => setSelectedTarget(e.target.value)}
            disabled={!isReady}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 font-medium disabled:cursor-not-allowed"
          >
            {columns.length > 0 ? (
              columns.map((col) => (
                <option key={col} value={col}>
                  {col} {col === selectedTarget ? '— (Selected Target y)' : ''}
                </option>
              ))
            ) : (
              <option value="">No columns available</option>
            )}
          </select>
        </div>

        {/* Step 2: Split Ratio Slider */}
        <div className="space-y-3">
          <div className="flex justify-between items-center text-sm font-semibold text-slate-200">
            <span>2. Train / Test Split Ratio</span>
            <span className="text-indigo-400 font-mono text-xs bg-indigo-950/70 border border-indigo-500/30 px-2 py-0.5 rounded">
              {trainRatioPercent}% Train / {testRatioPercent}% Test
            </span>
          </div>

          <input
            type="range"
            min="0.1"
            max="0.4"
            step="0.05"
            value={testSize}
            onChange={(e) => setTestSize(parseFloat(e.target.value))}
            disabled={!isReady}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500 disabled:cursor-not-allowed"
          />

          <div className="grid grid-cols-2 gap-4 pt-1">
            <div className="bg-slate-900/70 border border-slate-700/60 p-3 rounded-lg text-center">
              <span className="text-xs text-slate-400 block font-medium">Training Partition (X_train, y_train)</span>
              <span className="text-lg font-bold text-emerald-400">{trainRatioPercent}%</span>
              <span className="text-xs text-slate-500 block mt-0.5">
                ~{Math.round(totalRows * (1 - testSize))} rows
              </span>
            </div>
            <div className="bg-slate-900/70 border border-slate-700/60 p-3 rounded-lg text-center">
              <span className="text-xs text-slate-400 block font-medium">Testing Partition (X_test, y_test)</span>
              <span className="text-lg font-bold text-amber-400">{testRatioPercent}%</span>
              <span className="text-xs text-slate-500 block mt-0.5">
                ~{Math.round(totalRows * testSize)} rows
              </span>
            </div>
          </div>
        </div>

        {/* Automated Safeguards Indicator */}
        <div className="bg-indigo-950/30 border border-indigo-500/20 rounded-lg p-3.5 flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-slate-300">
            <span className="font-semibold text-indigo-300">Automated Pipeline Safeguards: </span>
            Row shuffling, reproducible pseudorandom seed, and automatic class stratification are applied during the split.
          </div>
        </div>

        {/* Optional Overrides */}
        <div className="border-t border-slate-700/60 pt-4">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 font-medium focus:outline-none"
          >
            {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {showAdvanced ? 'Hide Advanced Configuration' : 'Advanced Configuration (Optional)'}
          </button>

          {showAdvanced && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 bg-slate-900/50 p-4 rounded-lg border border-slate-700/40">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Random Seed</label>
                <input
                  type="number"
                  value={randomState}
                  onChange={(e) => setRandomState(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-4">
                <input
                  type="checkbox"
                  id="shuffle"
                  checked={shuffle}
                  onChange={(e) => setShuffle(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700 focus:ring-0"
                />
                <label htmlFor="shuffle" className="text-xs text-slate-300 cursor-pointer">
                  Shuffle rows before split
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Action Button */}
        <button
          onClick={handleExecuteSplit}
          disabled={!isReady || loading}
          className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-medium py-3 rounded-lg transition flex items-center justify-center gap-2 text-sm shadow-md"
        >
          <Play className="w-4 h-4 fill-current" />
          {loading ? 'Partitioning Dataset...' : 'Split & Export Dataset'}
        </button>
      </div>

      {/* Results Display */}
      {splitResult && (
        <div className="bg-slate-800/80 border border-emerald-500/30 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
              <CheckCircle2 className="w-5 h-5" />
              Partition Complete & Artifacts Cached to backend/splits/
            </div>
            <span className="text-xs bg-slate-900 border border-slate-700 text-indigo-300 px-2.5 py-1 rounded-full font-mono">
              {splitResult.detected_problem_type}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-700">
              <span className="text-xs text-slate-400 block">X_train Rows</span>
              <span className="text-xl font-bold text-white">{splitResult.splits.train.rows}</span>
            </div>
            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-700">
              <span className="text-xs text-slate-400 block">X_train Features</span>
              <span className="text-xl font-bold text-white">{splitResult.splits.train.features}</span>
            </div>
            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-700">
              <span className="text-xs text-slate-400 block">X_test Rows</span>
              <span className="text-xl font-bold text-white">{splitResult.splits.test.rows}</span>
            </div>
            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-700">
              <span className="text-xs text-slate-400 block">Target Column (y)</span>
              <span className="text-sm font-bold text-indigo-400 truncate block mt-0.5">
                {splitResult.target_column}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}