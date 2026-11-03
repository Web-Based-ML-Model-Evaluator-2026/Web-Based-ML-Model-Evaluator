import React, { useState } from 'react';
import { FileText, Download, Table as TableIcon, Loader2 } from 'lucide-react';

export default function ReportDownload({ projectMetadata, summaryStats }) {
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isDownloadingCsv, setIsDownloadingCsv] = useState(false);

  const downloadFile = async (format) => {
    const isPdf = format === 'pdf';
    if (isPdf) setIsDownloadingPdf(true);
    else setIsDownloadingCsv(true);

    try {
      const response = await fetch(`http://localhost:5001/api/report/${format}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectMetadata)
      });

      if (!response.ok) {
        throw new Error(`Download failed with server status ${response.status}`);
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `Evaluation_Report.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      alert(`Error downloading ${format.toUpperCase()} report: ` + err.message);
    } finally {
      if (isPdf) setIsDownloadingPdf(false);
      else setIsDownloadingCsv(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm mt-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              Evaluation Summary & Dataset Details
            </h2>
            <p className="text-xs text-slate-500">
              Summary statistics, dataset sample, and downloadable report exports
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => downloadFile('pdf')}
            disabled={isDownloadingPdf}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition disabled:opacity-50"
          >
            {isDownloadingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Download PDF
          </button>
          <button
            onClick={() => downloadFile('csv')}
            disabled={isDownloadingCsv}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-sm font-semibold rounded-lg shadow-sm transition disabled:opacity-50"
          >
            {isDownloadingCsv ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Download CSV
          </button>
        </div>
      </div>

      {/* Dataset Dimension & Configuration Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
          <p className="text-xs text-slate-500 uppercase font-bold">Total Tuples (N)</p>
          <p className="text-xl font-extrabold text-slate-800 mt-1">{summaryStats?.total_tuples || 0}</p>
        </div>
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
          <p className="text-xs text-slate-500 uppercase font-bold">Total Columns (M)</p>
          <p className="text-xl font-extrabold text-slate-800 mt-1">{summaryStats?.total_columns || 0}</p>
        </div>
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
          <p className="text-xs text-slate-500 uppercase font-bold">Target Column</p>
          <p className="text-xl font-extrabold text-blue-600 mt-1">{projectMetadata?.target_column || 'target'}</p>
        </div>
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
          <p className="text-xs text-slate-500 uppercase font-bold">Selected Model</p>
          <p className="text-xl font-extrabold text-emerald-600 mt-1">{projectMetadata?.model_name || 'Random Forest'}</p>
        </div>
      </div>

      {/* Numerical Means */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-slate-700 mb-2">Calculated Numerical Feature Means</h3>
        <div className="flex flex-wrap gap-2">
          {summaryStats?.means && Object.entries(summaryStats.means).map(([col, meanVal]) => (
            <span key={col} className="px-3 py-1 bg-slate-100 border border-slate-200 rounded-md text-xs font-medium text-slate-700">
              <span className="text-slate-500">{col}:</span> {meanVal}
            </span>
          ))}
        </div>
      </div>

      {/* 10 Sample Tuples Table */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <TableIcon className="w-4 h-4 text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-700">Dataset Preview (First 10 Sample Tuples)</h3>
        </div>
        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-100 text-slate-700 uppercase font-semibold">
              <tr>
                {summaryStats?.columns?.map((col) => (
                  <th key={col} className="px-4 py-2 border-b border-slate-200">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {summaryStats?.sample_tuples?.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  {summaryStats.columns.map((col) => (
                    <td key={col} className="px-4 py-2 font-mono text-slate-800">{row[col]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}