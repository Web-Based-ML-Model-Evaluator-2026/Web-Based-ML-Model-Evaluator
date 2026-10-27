// Standalone demo for Task 2.2. In the integrated app, pass the File chosen in
// Task 2.1's DatasetUpload into <DatasetValidation file={...} /> instead of
// using this file input.
import { useRef, useState } from 'react';
import { DatasetValidation } from './components/DatasetValidation';

function App() {
  const [file, setFile] = useState(null);
  const [report, setReport] = useState(null);
  const inputRef = useRef(null);

  const handleSelect = (e) => {
    setReport(null);
    setFile(e.target.files?.[0] ?? null);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-xl mx-auto mb-4 bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <h2 className="text-lg font-semibold text-slate-800 mb-3">Select a dataset to validate</h2>
        <input
          ref={inputRef}
          type="file"
          onChange={handleSelect}
          className="text-xs text-slate-600"
        />
        <p className="text-xs text-slate-400 mt-2">
          Any file type is accepted here on purpose, so you can test rejection.
        </p>
      </div>

      <DatasetValidation file={file} onValidated={setReport} />

      {report && (
        <div className="max-w-xl mx-auto mt-4 flex justify-end">
          <button
            disabled={!report.valid}
            onClick={() => console.log('Proceed to preview/statistics', report.summary)}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-medium px-3 py-1.5 rounded-md transition-colors"
          >
            Continue
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
