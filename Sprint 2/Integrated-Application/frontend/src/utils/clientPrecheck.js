// Instant, client-side pre-check (type / size / empty) so users get feedback
// before any network call. This is a convenience only: the Flask validator
// (backend/dataset_validator.py) is the authority and re-checks everything.

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB, same as backend

const ALLOWED_MIME = new Set([
  'text/csv',
  'application/csv',
  'application/vnd.ms-excel', // Windows/Excel reports CSVs this way
  'text/plain',
  'application/octet-stream',
  '',
]);

/**
 * @param {{name?: string, size?: number, type?: string} | null | undefined} file
 * @returns {{ok: boolean, code?: string, message?: string}}
 */
export function precheckFile(file) {
  if (!file) {
    return { ok: false, code: 'NO_FILE', message: 'No file selected.' };
  }

  const name = file.name || '';
  const dot = name.lastIndexOf('.');
  const ext = dot >= 0 ? name.slice(dot).toLowerCase() : '';
  if (ext !== '.csv') {
    return {
      ok: false,
      code: 'INVALID_FILE_TYPE',
      message: `Invalid file type. Only .csv files are supported${
        ext ? ` (received '${ext}')` : ' (the file has no extension)'
      }.`,
    };
  }

  if (!ALLOWED_MIME.has((file.type || '').toLowerCase())) {
    return {
      ok: false,
      code: 'INVALID_MIME_TYPE',
      message: `The file's content type '${file.type}' is not a CSV type.`,
    };
  }

  if (file.size === 0) {
    return { ok: false, code: 'EMPTY_FILE', message: 'The file is empty (0 bytes).' };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      ok: false,
      code: 'FILE_TOO_LARGE',
      message: 'The file exceeds the 10 MB size limit.',
    };
  }

  return { ok: true };
}

/** Wrap a pre-check failure in the same shape the backend returns. */
export function precheckToReport(file, failure) {
  return {
    valid: false,
    errors: [{ code: failure.code, message: failure.message }],
    warnings: [],
    summary: {
      file_name: file?.name ?? null,
      file_size_bytes: file?.size ?? 0,
      encoding: null,
      delimiter: null,
      row_count: 0,
      column_count: 0,
      columns: [],
    },
  };
}
