import { useEffect, useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  FileSpreadsheet,
} from 'lucide-react';
import { precheckFile, precheckToReport } from '../utils/clientPrecheck';

const DEFAULT_API_URL = 'http://127.0.0.1:5000/api/validate-dataset';

/**
 * Validates a CSV File and shows the result.
 *
 * Props
 *  - file:        File object to validate (from Task 2.1's upload widget).
 *  - apiUrl:      validation endpoint (default: local Flask server).
 *  - onValidated: called with the full report once validation finishes
 *                 (report.valid tells the parent whether to continue).
 */
export function DatasetValidation({ file, apiUrl = DEFAULT_API_URL, onValidated }) {
  // Result is stored together with the file it belongs to, so "validating"
  // is derived (result.file !== file) instead of set synchronously in the
  // effect, and a slow response for an old file can never overwrite a new one.
  const [result, setResult] = useState({ file: null, report: null });

  useEffect(() => {
    if (!file) return undefined;

    const controller = new AbortController();
    let cancelled = false;

    const finish = (report) => {
      if (cancelled) return;
      setResult({ file, report });
      if (onValidated) onValidated(report);
    };

    const run = async () => {
      // Step 1: instant client-side pre-check (type / size / empty)
      const pre = precheckFile(file);
      if (!pre.ok) {
        finish(precheckToReport(file, pre));
        return;
      }

      // Step 2: authoritative server-side validation
      try {
        const formData = new FormData();
        formData.append('file', file);
        const response = await fetch(apiUrl, {
          method: 'POST',
          body: formData,
          signal: controller.signal,
        });
        const data = await response.json();

        if (data && Array.isArray(data.errors)) {
          finish(data); // validation report (200 or 413)
        } else {
          throw new Error(data?.error || 'Unexpected response from server.');
        }
      } catch (err) {
        if (err.name === 'AbortError') return;
        finish({
          valid: false,
          errors: [{
            code: 'SERVER_UNREACHABLE',
            message: 'Could not reach the validation server. Make sure the backend is running and try again.',
          }],
          warnings: [],
          summary: null,
        });
      }
    };

    run();
    return () => {
      cancelled = true;
      controller.abort();
    };
    // onValidated intentionally omitted: parents commonly pass inline
    // callbacks and we only want to re-validate when the file/URL changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file, apiUrl]);

  if (!file) return null;

  const isValidating = result.file !== file;
  const report = isValidating ? null : result.report;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 max-w-xl mx-auto">
      <h3 className="text-lg font-semibold text-slate-800 mb-3">Dataset Validation</h3>

      <div className="flex items-center gap-2.5 mb-3 text-xs">
        <div className="p-1.5 bg-blue-100 text-blue-600 rounded-md shrink-0">
          <FileSpreadsheet size={16} />
        </div>
        <span className="font-semibold text-slate-800 truncate">{file.name}</span>
        <span className="text-slate-500 shrink-0">
          {(file.size / 1024).toFixed(1)} KB
        </span>
      </div>

      {isValidating && (
        <div
          role="status"
          className="flex items-center gap-2 p-2.5 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg"
        >
          <Loader2 size={15} className="animate-spin shrink-0" />
          Validating dataset...
        </div>
      )}

      {report && (
        <>
          {/* Overall status banner */}
          <div
            role="status"
            className={`flex items-center gap-2 p-2.5 text-xs font-medium rounded-lg border ${
              report.valid
                ? 'text-emerald-800 bg-emerald-50 border-emerald-200'
                : 'text-red-700 bg-red-50 border-red-200'
            }`}
          >
            {report.valid ? (
              <CheckCircle2 size={16} className="shrink-0" />
            ) : (
              <XCircle size={16} className="shrink-0" />
            )}
            {report.valid
              ? report.warnings.length
                ? `Dataset is valid with ${report.warnings.length} warning${report.warnings.length > 1 ? 's' : ''}.`
                : 'Dataset is valid.'
              : `Validation failed with ${report.errors.length} error${report.errors.length > 1 ? 's' : ''}.`}
          </div>

          {/* Errors */}
          {report.errors.length > 0 && (
            <ul className="mt-3 space-y-1.5" aria-label="Validation errors">
              {report.errors.map((e, i) => (
                <li
                  key={`${e.code}-${i}`}
                  className="flex items-start gap-2 text-xs text-red-700"
                >
                  <XCircle size={14} className="mt-0.5 shrink-0" />
                  <span>{e.message}</span>
                </li>
              ))}
            </ul>
          )}

          {/* Warnings */}
          {report.warnings.length > 0 && (
            <ul className="mt-3 space-y-1.5" aria-label="Validation warnings">
              {report.warnings.map((w, i) => (
                <li
                  key={`${w.code}-${i}`}
                  className="flex items-start gap-2 text-xs text-amber-700"
                >
                  <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                  <span>{w.message}</span>
                </li>
              ))}
            </ul>
          )}

          {/* Summary (only meaningful when valid) */}
          {report.valid && report.summary && (
            <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-slate-700 p-3 rounded-lg border border-slate-200 bg-slate-50">
              <div><span className="text-slate-500">Rows:</span> {report.summary.row_count}</div>
              <div><span className="text-slate-500">Columns:</span> {report.summary.column_count}</div>
              <div><span className="text-slate-500">Encoding:</span> {report.summary.encoding}</div>
              <div><span className="text-slate-500">Delimiter:</span> comma</div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
