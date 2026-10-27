const NULL_TOKENS = new Set(["na", "n/a", "null", "none", "nan", "undefined"]);

export function isMissing(value) {
  if (value === null || value === undefined) return true;
  if (typeof value === "number") return !Number.isFinite(value);
  const text = String(value).trim();
  return text.length === 0 || NULL_TOKENS.has(text.toLowerCase());
}

function asNumber(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (isMissing(value)) return null;
  const normalized = String(value).trim().replace(/,/g, "");
  if (normalized === "") return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function quantile(sorted, q) {
  if (!sorted.length) return null;
  if (sorted.length === 1) return sorted[0];
  const position = (sorted.length - 1) * q;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower);
}

function round(value, digits = 6) {
  if (value === null || value === undefined || !Number.isFinite(value)) return null;
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function modeOf(values) {
  const counts = new Map();
  for (const value of values) {
    const label = String(value).trim();
    counts.set(label, (counts.get(label) || 0) + 1);
  }
  return [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
}

function getCell(row, header, index) {
  if (Array.isArray(row)) return row[index];
  if (row && typeof row === "object") return row[header];
  return undefined;
}

export function calculateDatasetStatistics(inputRows, inputHeaders) {
  if (!Array.isArray(inputRows) || !Array.isArray(inputHeaders)) {
    throw new TypeError("Rows and headers must be arrays.");
  }
  const headers = inputHeaders.map((h, i) => String(h ?? "").trim() || `Column ${i + 1}`);
  if (headers.length === 0) throw new Error("The dataset has no columns to analyze.");
  const duplicateHeaderNames = headers.filter((h, i) => headers.indexOf(h) !== i);
  const rows = inputRows.map((row) => headers.map((header, i) => getCell(row, header, i)));
  const warnings = [];
  if (duplicateHeaderNames.length) {
    warnings.push(`Duplicate column names detected: ${[...new Set(duplicateHeaderNames)].join(", ")}. Use unique headers before integration.`);
  }
  if (rows.length === 0) warnings.push("The dataset contains headers but no data rows.");

  const rowKeys = new Set();
  let duplicateRows = 0;
  for (const row of rows) {
    const key = JSON.stringify(row.map((v) => isMissing(v) ? null : String(v).trim()));
    if (rowKeys.has(key)) duplicateRows++;
    else rowKeys.add(key);
  }

  const columns = headers.map((name, index) => {
    const values = rows.map((row) => row[index]);
    const present = values.filter((value) => !isMissing(value));
    const numericValues = present.map(asNumber);
    const isNumeric = present.length > 0 && numericValues.every((value) => value !== null);
    const inferredType = present.length === 0 ? "Empty" : isNumeric ? "Numeric" : "Categorical";
    const missing = values.length - present.length;
    const base = {
      name,
      inferredType,
      total: values.length,
      missing,
      missingPercent: values.length ? round((missing / values.length) * 100, 2) : 0,
      distinctCount: new Set(present.map((v) => String(v).trim())).size,
      completenessPercent: values.length ? round((present.length / values.length) * 100, 2) : 0
    };

    if (isNumeric) {
      const sorted = [...numericValues].sort((a, b) => a - b);
      const count = sorted.length;
      const sum = sorted.reduce((acc, n) => acc + n, 0);
      const mean = sum / count;
      const median = quantile(sorted, 0.5);
      const variance = count > 1
        ? sorted.reduce((acc, n) => acc + (n - mean) ** 2, 0) / (count - 1)
        : 0;
      const q1 = quantile(sorted, 0.25);
      const q3 = quantile(sorted, 0.75);
      const iqr = q3 - q1;
      const lowerFence = q1 - 1.5 * iqr;
      const upperFence = q3 + 1.5 * iqr;
      base.numeric = {
        count,
        mean: round(mean),
        median: round(median),
        standardDeviation: round(Math.sqrt(variance)),
        min: round(sorted[0]),
        q1: round(q1),
        q3: round(q3),
        max: round(sorted[sorted.length - 1]),
        outlierCount: sorted.filter((n) => n < lowerFence || n > upperFence).length
      };
    } else {
      const frequencies = modeOf(present);
      base.categorical = {
        count: present.length,
        mostFrequent: frequencies[0] || null,
        frequencies: frequencies.slice(0, 10),
        frequenciesTruncated: frequencies.length > 10
      };
    }
    return base;
  });

  const totalCells = rows.length * headers.length;
  const missingCells = columns.reduce((sum, col) => sum + col.missing, 0);
  return {
    overview: {
      rowCount: rows.length,
      columnCount: headers.length,
      totalCells,
      missingCells,
      missingPercent: totalCells ? round((missingCells / totalCells) * 100, 2) : 0,
      duplicateRows,
      numericColumns: columns.filter((c) => c.inferredType === "Numeric").length,
      categoricalColumns: columns.filter((c) => c.inferredType === "Categorical").length,
      emptyColumns: columns.filter((c) => c.inferredType === "Empty").length
    },
    columns,
    warnings
  };
}

export function reportToCsv(report) {
  const escape = (value) => {
    const text = value === null || value === undefined ? "" : String(value);
    return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const header = ["Column", "Type", "Rows", "Missing", "Missing %", "Distinct", "Completeness %", "Count", "Mean", "Median", "Std Dev", "Min", "Q1", "Q3", "Max", "Outliers", "Most Frequent"];
  const lines = [header.map(escape).join(",")];
  for (const c of report.columns) {
    const n = c.numeric || {};
    const cat = c.categorical || {};
    lines.push([
      c.name, c.inferredType, c.total, c.missing, c.missingPercent, c.distinctCount,
      c.completenessPercent, n.count ?? cat.count ?? 0, n.mean, n.median,
      n.standardDeviation, n.min, n.q1, n.q3, n.max, n.outlierCount,
      cat.mostFrequent ? `${cat.mostFrequent.value} (${cat.mostFrequent.count})` : ""
    ].map(escape).join(","));
  }
  return lines.join("\r\n");
}
