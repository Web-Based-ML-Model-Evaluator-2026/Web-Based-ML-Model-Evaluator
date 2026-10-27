
import React from "react";
import {
  inferColumnType,
  normalizeColumns,
  getColumnValues,
} from "../utils/datasetPreview";

export default function DatasetPreview({
  dataset = null,
  loading = false,
  error = "",
  previewLimit = 10,
}) {
  if (loading) {
    return (
      <section className="rounded-lg border p-4" aria-live="polite">
        Loading dataset preview...
      </section>
    );
  }

  if (error) {
    return (
      <section
        className="rounded-lg border border-red-300 p-4"
        role="alert"
      >
        <h2 className="font-semibold">
          Could not load dataset preview
        </h2>
        <p>{error}</p>
      </section>
    );
  }

  if (!dataset) {
    return (
      <section className="rounded-lg border p-4">
        <h2 className="text-xl font-semibold">
          Dataset Preview
        </h2>
        <p>No dataset selected. Upload a valid CSV file to preview it.</p>
      </section>
    );
  }

  const rows = Array.isArray(dataset.rows) ? dataset.rows : [];
  const rawColumns = Array.isArray(dataset.columns)
    ? dataset.columns
    : [];

  const normalizedColumns = normalizeColumns(rawColumns);

  const columnNames = normalizedColumns.length
    ? normalizedColumns.map((column) => column.name)
    : Object.keys(rows[0] ?? {});

  const metadata = columnNames.map((name) => {
    const provided = normalizedColumns.find(
      (column) => column.name === name
    );

    const inferred = inferColumnType(
      getColumnValues(rows, name)
    );

    return {
      name,
      dataType:
        provided && provided.dataType !== "Unknown"
          ? provided.dataType
          : inferred,
    };
  });

  const totalRows =
    dataset.totalRows ??
    dataset.total_rows ??
    dataset.row_count ??
    rows.length;

  const totalColumns =
    dataset.totalColumns ??
    dataset.total_columns ??
    columnNames.length;

  const limit = Math.max(
    1,
    Math.min(10, Number(previewLimit) || 10)
  );

  const previewRows = rows.slice(0, limit);

  const datasetName =
    dataset.name ??
    dataset.filename ??
    dataset.file_name ??
    dataset.original_name ??
    "Uploaded dataset";

  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold">Dataset Preview</h2>
        <p className="text-sm text-gray-600">{datasetName}</p>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-lg border p-4">
          <p className="text-sm text-gray-500">Total rows</p>
          <p className="text-2xl font-semibold">{totalRows}</p>
        </div>

        <div className="rounded-lg border p-4">
          <p className="text-sm text-gray-500">Total columns</p>
          <p className="text-2xl font-semibold">{totalColumns}</p>
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-lg font-semibold">
          Column information
        </h3>

        {metadata.length === 0 ? (
          <p className="text-sm text-gray-600">
            No column headers were returned for this dataset.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr>
                  <th className="border bg-gray-50 p-2">
                    Column name
                  </th>
                  <th className="border bg-gray-50 p-2">
                    Data type
                  </th>
                </tr>
              </thead>

              <tbody>
                {metadata.map((column, index) => (
                  <tr key={`${column.name}-${index}`}>
                    <td className="border p-2">{column.name}</td>
                    <td className="border p-2">{column.dataType}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div>
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-lg font-semibold">
            First {limit} rows
          </h3>

          <span className="text-sm text-gray-500">
            Showing {previewRows.length} of {totalRows} rows
          </span>
        </div>

        {columnNames.length === 0 ? (
          <p className="text-sm text-gray-600">
            No data columns to preview.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr>
                  {columnNames.map((column, index) => (
                    <th
                      key={`${column}-${index}`}
                      className="border-b bg-gray-50 p-2"
                    >
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {previewRows.length === 0 ? (
                  <tr>
                    <td
                      className="p-3 text-gray-500"
                      colSpan={columnNames.length}
                    >
                      The dataset has headers but no rows to display.
                    </td>
                  </tr>
                ) : (
                  previewRows.map((row, index) => (
                    <tr key={index}>
                      {columnNames.map((column, columnIndex) => {
                        const value = row?.[column];

                        return (
                          <td
                            key={`${column}-${columnIndex}`}
                            className="border-t p-2"
                          >
                            {value === null ||
                            value === undefined ||
                            String(value).trim() === ""
                              ? "—"
                              : String(value)}
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
