export const SCALING_METHODS = Object.freeze([
  { value: "standard", label: "Standard scaling (z-score)" },
  { value: "minmax", label: "Min-max normalization" },
]);

const MISSING_TOKENS = new Set(["", "na", "n/a", "null", "none", "nan", "undefined"]);
const isMissing = (value) => value === null || value === undefined ||
  (typeof value === "string" && MISSING_TOKENS.has(value.trim().toLowerCase())) ||
  (typeof value === "number" && Number.isNaN(value));

function numericValue(value, column, rowIndex) {
  if (isMissing(value)) return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value))) return Number(value);
  throw new Error(`Column "${column}" contains a non-numeric value at data row ${rowIndex + 1}. Choose a numeric column or handle invalid values first.`);
}

function assertRows(rows) {
  if (!Array.isArray(rows) || rows.length === 0) throw new Error("Load a dataset containing at least one data row.");
  if (!rows.every((row) => row && typeof row === "object" && !Array.isArray(row))) throw new Error("Each dataset row must be an object.");
  const columns = Object.keys(rows[0]);
  if (!columns.length) throw new Error("The dataset has no columns.");
  if (!rows.every((row) => columns.every((column) => Object.hasOwn(row, column)))) throw new Error("Dataset rows must have the same columns.");
  return columns;
}

export function detectNumericColumns(rows) {
  const columns = assertRows(rows);
  return columns.filter((column) => {
    try {
      const values = rows.map((row, i) => numericValue(row[column], column, i));
      return values.some((value) => value !== null);
    } catch {
      return false;
    }
  });
}

export function profileNumericColumns(rows) {
  const columns = assertRows(rows);
  return columns.map((name) => {
    let values;
    try { values = rows.map((row, i) => numericValue(row[name], name, i)); }
    catch { return { name, numeric: false, presentCount: rows.filter((row) => !isMissing(row[name])).length, missingCount: rows.filter((row) => isMissing(row[name])).length, min: null, max: null, uniqueCount: new Set(rows.map((row) => row[name])).size }; }
    const present = values.filter((value) => value !== null);
    const numeric = present.length > 0;
    const min = present.length ? Math.min(...present) : null;
    const max = present.length ? Math.max(...present) : null;
    return { name, numeric, presentCount: present.length, missingCount: values.length - present.length, min, max, uniqueCount: new Set(present).size };
  });
}

export function fitScalingParameters(rows, { method = "standard", columns, minRange = 0, maxRange = 1 } = {}) {
  const available = detectNumericColumns(rows);
  const selected = columns ?? available;
  if (!Array.isArray(selected) || selected.length === 0) throw new Error("Select at least one numeric column to scale.");
  if (new Set(selected).size !== selected.length) throw new Error("A column can only be selected once.");
  const allColumns = Object.keys(rows[0]);
  for (const column of selected) {
    if (!allColumns.includes(column)) throw new Error(`Column "${column}" does not exist in the dataset.`);
    // Validate explicitly selected columns here so mixed numeric/text data produces a row-specific message.
    rows.forEach((row, index) => numericValue(row[column], column, index));
  }
  if (!new Set(["standard", "minmax"]).has(method)) throw new Error("Choose a supported scaling method.");
  if (method === "minmax" && (!Number.isFinite(minRange) || !Number.isFinite(maxRange) || minRange >= maxRange)) {
    throw new Error("Min-max range must use finite numbers, with minimum less than maximum.");
  }
  const parameters = {};
  const constantColumns = [];
  for (const column of selected) {
    const values = rows.map((row, i) => numericValue(row[column], column, i)).filter((value) => value !== null);
    if (!values.length) throw new Error(`Column "${column}" has no numeric values.`);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
    const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
    const std = Math.sqrt(variance);
    const constant = min === max;
    if (constant) constantColumns.push(column);
    parameters[column] = { min, max, mean, std, count: values.length, constant, minRange, maxRange };
  }
  return { method, columns: [...selected], parameters, constantColumns };
}

export function applyScalingParameters(rows, fitted) {
  assertRows(rows);
  if (!fitted || !["standard", "minmax"].includes(fitted.method) || !fitted.parameters) throw new Error("Valid fitted scaling parameters are required.");
  const transformed = rows.map((row, rowIndex) => {
    const next = { ...row };
    for (const column of fitted.columns) {
      if (!Object.hasOwn(row, column)) throw new Error(`Column "${column}" is missing from the dataset.`);
      const value = numericValue(row[column], column, rowIndex);
      if (value === null) { next[column] = row[column]; continue; }
      const p = fitted.parameters[column];
      if (!p) throw new Error(`Scaling parameters for "${column}" are missing.`);
      if (fitted.method === "standard") next[column] = p.constant ? 0 : (value - p.mean) / p.std;
      else next[column] = p.constant ? p.minRange : ((value - p.min) / (p.max - p.min)) * (p.maxRange - p.minRange) + p.minRange;
    }
    return next;
  });
  return transformed;
}

export function validateScaledDataset(originalRows, scaledRows, fitted, tolerance = 1e-8) {
  const checks = [];
  const add = (id, label, passed, detail) => checks.push({ id, label, passed, detail });
  const originalColumns = Array.isArray(originalRows) && originalRows.length ? Object.keys(originalRows[0]) : [];
  const outputColumns = Array.isArray(scaledRows) && scaledRows.length ? Object.keys(scaledRows[0]) : [];
  add("non-empty", "Output dataset is non-empty", Array.isArray(scaledRows) && scaledRows.length > 0, `${scaledRows?.length ?? 0} rows`);
  add("row-count", "Row count preserved", Array.isArray(originalRows) && Array.isArray(scaledRows) && originalRows.length === scaledRows.length, `${originalRows?.length ?? 0} → ${scaledRows?.length ?? 0}`);
  add("columns", "Column names and order preserved", JSON.stringify(originalColumns) === JSON.stringify(outputColumns), outputColumns.join(", "));
  const unselected = originalColumns.filter((column) => !fitted.columns.includes(column));
  const unchanged = Array.isArray(originalRows) && Array.isArray(scaledRows) && originalRows.length === scaledRows.length && originalRows.every((row, i) => unselected.every((column) => Object.is(row[column], scaledRows[i][column])));
  add("unselected", "Unselected columns unchanged", unchanged, unselected.join(", ") || "No unselected columns");
  const numeric = fitted.columns.every((column) => scaledRows.every((row) => isMissing(row[column]) || (typeof row[column] === "number" && Number.isFinite(row[column]))));
  add("finite", "Scaled values are finite numbers or preserved missing values", numeric, "No non-finite scaled values detected");
  let methodCorrect = true;
  for (const column of fitted.columns) {
    const values = scaledRows.map((row, i) => numericValue(row[column], column, i)).filter((value) => value !== null);
    if (!values.length) { methodCorrect = false; break; }
    const p = fitted.parameters[column];
    if (fitted.method === "standard" && !p.constant) {
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const sd = Math.sqrt(values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length);
      if (Math.abs(mean) > tolerance || Math.abs(sd - 1) > tolerance) methodCorrect = false;
    } else if (fitted.method === "minmax") {
      const low = Math.min(...values), high = Math.max(...values);
      if (!p.constant && (Math.abs(low - p.minRange) > tolerance || Math.abs(high - p.maxRange) > tolerance)) methodCorrect = false;
      if (values.some((v) => v < p.minRange - tolerance || v > p.maxRange + tolerance)) methodCorrect = false;
    } else if (fitted.method === "standard" && p.constant && values.some((v) => v !== 0)) methodCorrect = false;
  }
  add("method", "Scaling output matches the selected method", methodCorrect, fitted.method === "standard" ? "Standardized columns checked" : "Normalized bounds checked");
  return { valid: checks.every((check) => check.passed), checks };
}

export function scaleDataset(rows, options = {}) {
  const fitted = fitScalingParameters(rows, options);
  const scaledRows = applyScalingParameters(rows, fitted);
  const validation = validateScaledDataset(rows, scaledRows, fitted);
  if (!validation.valid) throw new Error(`Scaled dataset validation failed: ${validation.checks.filter((c) => !c.passed).map((c) => c.label).join(", ")}`);
  return { rows: scaledRows, method: fitted.method, columns: fitted.columns, parameters: fitted.parameters, profiles: profileNumericColumns(scaledRows), constantColumns: fitted.constantColumns, validation };
}

export function rowsToCsv(rows) {
  if (!Array.isArray(rows) || !rows.length) throw new Error("There are no rows to export.");
  const columns = Object.keys(rows[0]);
  const escape = (value) => {
    const text = value === null || value === undefined ? "" : String(value);
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  return [columns.map(escape).join(","), ...rows.map((row) => columns.map((column) => escape(row[column])).join(","))].join("\r\n");
}
