import { useState, useRef } from 'react';
// Lucide icons for UI feedback states (dropzone, file details, security, database)
import {
  UploadCloud,
  FileSpreadsheet,
  AlertCircle,
  X,
  ArrowRight,
  ShieldCheck,
  Database
} from 'lucide-react';

export function DatasetUpload({ onUploadSuccess }) {
  // -------------------------------------------------------------
  // STATE MANAGEMENT
  // -------------------------------------------------------------
  // Tracks hover state when dragging a file over the drop zone
  const [isDragging, setIsDragging] = useState(false);

  // Holds the selected File object from drag-and-drop or browse dialog
  const [file, setFile] = useState(null);

  // User-facing validation or server error messages
  const [errorMessage, setErrorMessage] = useState('');

  // Numerical indicator (0-100) for file dispatch progress
  const [uploadProgress, setUploadProgress] = useState(0);

  // Active network request indicator to prevent duplicate submissions
  const [isUploading, setIsUploading] = useState(false);

  // Response payload returned by the backend safe storage engine
  const [storageResult, setStorageResult] = useState(null);

  // Reference to trigger hidden <input type="file" /> programmatically
  const fileInputRef = useRef(null);

  // Maximum allowed file size threshold: 10 MB in binary bytes
  const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

  // -------------------------------------------------------------
  // CLIENT-SIDE VALIDATION & SELECTION HANDLER
  // -------------------------------------------------------------
  const validateAndSelectFile = (selectedFile) => {
    // Reset previous interaction states
    setErrorMessage('');
    setStorageResult(null);
    setUploadProgress(0);

    if (!selectedFile) return;

    // Check 1: File extension and MIME type validation (.csv only)
    const isCsv = selectedFile.name.toLowerCase().endsWith('.csv') || selectedFile.type === 'text/csv';
    if (!isCsv) {
      setErrorMessage('Invalid file format. Please upload a valid .csv file.');
      return;
    }

    // Check 2: 0-byte blank file guard
    if (selectedFile.size === 0) {
      setErrorMessage('The selected file is empty (0 bytes).');
      return;
    }

    // Check 3: 10 MB size ceiling boundary guard
    if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
      setErrorMessage('File size exceeds the 10 MB limit.');
      return;
    }

    // Retain validated file in state
    setFile(selectedFile);
  };

  // -------------------------------------------------------------
  // DRAG & DROP EVENT HANDLERS
  // -------------------------------------------------------------
  const handleDragOver = (e) => {
    e.preventDefault(); // Prevent browser default file open behavior
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    // Ingest the first dropped file from DataTransfer object
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSelectFile(e.dataTransfer.files[0]);
    }
  };

  // -------------------------------------------------------------
  // BACKEND DISPATCH & SAFE STORAGE INTEGRATION
  // -------------------------------------------------------------
  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(30); // Initial dispatch indicator

    // Pack file into multipart/form-data payload
    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploadProgress(65);

      // Send multipart request to the local Flask safe storage API
      const response = await fetch('http://127.0.0.1:5000/api/upload-dataset', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      // Catch backend-side validation rejections
      if (!response.ok) {
        throw new Error(data.error || 'Server rejected file upload.');
      }

      // Finalize progress and store result
      setUploadProgress(100);
      setIsUploading(false);
      setStorageResult(data);

      // Cache dataset metadata in sessionStorage for downstream teammates
      sessionStorage.setItem('current_dataset_metadata', JSON.stringify(data));

      // Invoke optional parent callback
      if (onUploadSuccess) onUploadSuccess(data);
    } catch (err) {
      setIsUploading(false);
      setUploadProgress(0);
      setErrorMessage(err.message || 'Unable to connect to safe storage server.');
    }
  };

  // -------------------------------------------------------------
  // RESET HANDLER
  // -------------------------------------------------------------
  const handleRemoveFile = () => {
    setFile(null);
    setErrorMessage('');
    setStorageResult(null);
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
    sessionStorage.removeItem('current_dataset_metadata');
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 max-w-xl mx-auto">
      {/* Clean, modular section header without redundant sprint subtitles */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-800">Upload Dataset</h3>
      </div>

      {/* Compact drag & drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg py-6 px-4 flex flex-col items-center justify-center cursor-pointer transition-all ${
          isDragging
            ? 'border-blue-500 bg-blue-50/50 scale-[1.01]'
            : 'border-slate-300 hover:border-blue-500 hover:bg-slate-50/70'
        }`}
      >
        {/* Hidden native file input element */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={(e) => validateAndSelectFile(e.target.files?.[0])}
          className="hidden"
        />

        {/* Compact upload cloud icon */}
        <div className="p-2.5 bg-blue-50 text-blue-600 rounded-full mb-2">
          <UploadCloud size={24} />
        </div>

        {/* Selection prompt */}
        <p className="text-sm font-medium text-slate-700 text-center">
          <span className="text-blue-600 font-semibold">Click to browse</span> or drag & drop CSV
        </p>
        <p className="text-xs text-slate-400 mt-1">
          Max 10 MB (.csv)
        </p>
      </div>

      {/* Error alert banner */}
      {errorMessage && (
        <div className="mt-3 flex items-center gap-2 p-2.5 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle size={15} className="shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Selected file information row */}
      {file && (
        <div className="mt-4 p-3 rounded-lg border border-slate-200 bg-slate-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 truncate">
              <div className="p-1.5 bg-blue-100 text-blue-600 rounded-md shrink-0">
                <FileSpreadsheet size={18} />
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-slate-800 truncate">{file.name}</p>
                <p className="text-[11px] text-slate-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
              </div>
            </div>

            {/* Cancel/Remove button (accessible prior to saving) */}
            {!isUploading && !storageResult && (
              <button
                onClick={handleRemoveFile}
                className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-600 transition-colors"
                title="Remove file"
              >
                <X size={15} />
              </button>
            )}

            {/* Success badge once confirmed written to disk */}
            {storageResult && (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                <ShieldCheck size={13} /> Saved
              </span>
            )}
          </div>

          {/* Transfer progress bar */}
          {isUploading && (
            <div className="mt-2.5">
              <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                <span>Saving file...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-blue-600 h-1.5 rounded-full transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Action button to execute safe storage */}
          {!storageResult && !isUploading && (
            <div className="mt-3 flex justify-end">
              <button
                onClick={handleUpload}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3 py-1.5 rounded-md transition-colors"
              >
                Upload <ArrowRight size={14} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Stored metadata card */}
      {storageResult && (
        <div className="mt-3 p-3 rounded-lg border border-emerald-200 bg-emerald-50/60">
          <div className="flex items-center gap-1.5 text-emerald-800 font-semibold text-xs mb-2">
            <Database size={15} /> File Stored
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-700">
            <div><span className="text-slate-500">ID:</span> {storageResult.file_id}</div>
            <div><span className="text-slate-500">Size:</span> {storageResult.file_size_kb} KB</div>
            <div><span className="text-slate-500">Rows:</span> {storageResult.row_count}</div>
            <div><span className="text-slate-500">Cols:</span> {storageResult.columns.length}</div>
          </div>
        </div>
      )}
    </div>
  );
}