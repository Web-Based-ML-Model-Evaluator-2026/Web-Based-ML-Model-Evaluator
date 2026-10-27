// Task 3.1 — Missing value handling (simple strategies + validation).
// Dependency-free so it can run in the browser, in Node tests, or be ported to the backend.

const NULL_TOKENS = new Set(["na", "n/a", "null", "none", "nan", "undefined"]);

export const STRATEGY_OPTIONS = [
  { value: "drop-rows", label: "Drop rows with missing values", numericOnly: false },
  { value: "drop-columns", label: "Drop columns with missing values", numericOnly: false },
  { value: "mean", label: "Fill with mean (numeric columns)", numericOnly: true },
  { value: "median", label: "Fill with median (numeric columns)", numericOnly: true },
  { value: "mode", label: "Fill with most frequent value", numericOnly: false },
  { value: "constant", label: "Fill with a constant value", numericOnly: false }
];

// Same missing-value definition as Task 2.4 so both tasks agree on what "missing" means.
export function isMissing(value) {
  if (value === null || value === undefined) return true;
  if (typeof value === "number") return !Number.isFinite(value);
  const text = String(value).trim();
  return text.length === 0 || NULL_TOKENS.has(text.toLowerCase());
}

function toNumber(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (isMissing(value)) return null;
  const parsed = Number(String(value).trim().replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function round(value, digits = 6) {
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

export function getColumnNames(rows = []) {
  const names = [];
  const seen = new Set();
  for (const row of rows) {
    for (const key of Object.keys(row ?? {})) {
      if (!seen.has(key)) { seen.add(key); names.push(key); }
    }
  }
  return names;
}

function summarize(rows, columns) {
  const stats = columns.map((name) => {
    const values = rows.map((row) => row?.[name]);
    const present = values.filter((v) => !isMissing(v));
    const missing = values.length - present.length;
    const type = present.length === 0 ? "Empty"
      : present.every((v) => toNumber(v) !== null) ? "Numeric" : "Categorical";
    return {
      name, type, total: values.length, missing,
      missingPercent: values.length ? round((missing / values.length) * 100, 2) : 0
    };
  });
  const totalCells = rows.length * columns.length;
  const missingCells = stats.reduce((sum, c) => sum + c.missing, 0);
  const rowsWithMissing = rows.filter((row) => columns.some((c) => isMissing(row?.[c]))).length;
  return {
    rowCount: rows.length, columnCount: columns.length, totalCells, missingCells,
    missingPercent: totalCells ? round((missingCells / totalCells) * 100, 2) : 0,
    rowsWithMissing, columns: stats
  };
}

export function profileMissingValues(rows = [], columns = getColumnNames(rows)) {
  if (!Array.isArray(rows)) throw new TypeError("Dataset rows must be an array.");
  return summarize(rows, columns);
}

function modeOf(values) {
  const counts = new Map();
  for (const v of values) counts.set(v, (counts.get(v) || 0) + 1);
  const ranked = [...counts.entries()].sort((a, b) =>
    b[1] - a[1] || (typeof a[0] === "number" && typeof b[0] === "number" ? a[0] - b[0] : String(a[0]).localeCompare(String(b[0]))));
  return ranked.length ? ranked[0][0] : null;
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Apply one missing-value strategy to the selected columns. Never mutates `rows`.
 * options: { strategy, columns?, fillValue? }  (columns defaults to every column with missing values)
 */
export function applyMissingStrategy(rows, options = {}) {
  const { strategy, fillValue } = options;
  if (!Array.isArray(rows) || rows.length === 0) throw new Error("There are no dataset rows to process.");
  if (!STRATEGY_OPTIONS.some((s) => s.value === strategy)) throw new Error("Choose a valid missing-value strategy.");

  const allColumns = getColumnNames(rows);
  const before = summarize(rows, allColumns);
  const info = new Map(before.columns.map((c) => [c.name, c]));

  if (Array.isArray(options.columns) && options.columns.length === 0) throw new Error("Select at least one column.");
  const selected = [...new Set(options.columns ?? before.columns.filter((c) => c.missing > 0).map((c) => c.name))];
  const unknown = selected.filter((name) => !info.has(name));
  if (unknown.length) throw new Error(`Column(s) not found: ${unknown.join(", ")}.`);
  // Columns with nothing missing need no work.
  const targets = selected.filter((name) => info.get(name).missing > 0);

  const warnings = [];
  const skipped = [];
  const imputations = [];
  let droppedColumns = [];
  let keptRowIndexes = rows.map((_, i) => i);
  let outRows = rows.map((row) => ({ ...row }));

  if (strategy === "drop-rows") {
    keptRowIndexes = keptRowIndexes.filter((i) => !targets.some((c) => isMissing(rows[i]?.[c])));
    outRows = keptRowIndexes.map((i) => ({ ...rows[i] }));
  } else if (strategy === "drop-columns") {
    droppedColumns = targets;
    outRows = outRows.map((row) => { for (const c of droppedColumns) delete row[c]; return row; });
  } else {
    const constantText = fillValue === undefined || fillValue === null ? "" : String(fillValue).trim();
    if (strategy === "constant" && constantText === "") throw new Error("Enter a constant fill value.");

    for (const name of targets) {
      const col = info.get(name);
      const present = rows.map((r) => r?.[name]).filter((v) => !isMissing(v));
      let fill;
      let numeric = col.type === "Numeric";

      if (strategy === "constant") {
        const asNum = toNumber(constantText);
        if (col.type === "Numeric" && asNum === null) {
          skipped.push({ column: name, reason: `"${constantText}" is not numeric, but "${name}" is a numeric column.` });
          continue;
        }
        numeric = col.type !== "Categorical" && asNum !== null;
        fill = numeric ? asNum : constantText;
      } else if (col.type === "Empty") {
        skipped.push({ column: name, reason: `"${name}" has no values to calculate a ${strategy} from.` });
        continue;
      } else if (strategy === "mean" || strategy === "median") {
        if (col.type !== "Numeric") {
          skipped.push({ column: name, reason: `"${name}" is not numeric, so ${strategy} cannot be used.` });
          continue;
        }
        const nums = present.map(toNumber);
        fill = strategy === "mean" ? round(nums.reduce((a, b) => a + b, 0) / nums.length) : round(median(nums));
      } else {
        fill = numeric ? modeOf(present.map(toNumber)) : modeOf(present.map((v) => String(v).trim()));
      }

      let filled = 0;
      for (const row of outRows) {
        if (isMissing(row[name])) { row[name] = fill; filled++; }
        else if (numeric) row[name] = toNumber(row[name]); // keep the column consistently numeric
      }
      imputations.push({ column: name, strategy, value: fill, filled, numeric });
    }
  }

  for (const s of skipped) warnings.push(s.reason + " Column left unchanged.");
  const remainingColumns = allColumns.filter((c) => !droppedColumns.includes(c));
  return {
    rows: outRows, strategy, selectedColumns: selected, keptRowIndexes,
    droppedRowCount: rows.length - keptRowIndexes.length, droppedColumns,
    imputations, skipped, warnings, before, after: summarize(outRows, remainingColumns)
  };
}

/**
 * Validate a processed dataset against the original and the processing result.
 * Errors make `valid` false; warnings are informational.
 */
export function validateProcessedDataset(originalRows, result, options = {}) {
  const { requireComplete = true, maxRowLossPercent = 20 } = options;
  const checks = [];
  const add = (id, label, passed, detail, severity = "error") => checks.push({ id, label, passed, detail, severity });
  const processed = result?.rows ?? [];
  const originalColumns = getColumnNames(originalRows);
  const expectedColumns = originalColumns.filter((c) => !result.droppedColumns.includes(c));

  add("not-empty", "Dataset still has rows and columns", processed.length > 0 && expectedColumns.length > 0,
    `${processed.length} rows × ${expectedColumns.length} columns`);

  const countsMatch = processed.length === originalRows.length - result.droppedRowCount
    && processed.length === result.keptRowIndexes.length;
  add("row-count", "Row count matches the strategy applied", countsMatch,
    `${originalRows.length} original − ${result.droppedRowCount} dropped = ${processed.length}`);

  const shapeOk = processed.every((row) => {
    const keys = Object.keys(row);
    return keys.length === expectedColumns.length && expectedColumns.every((c) => keys.includes(c));
  });
  add("columns", "Every row has the expected columns", shapeOk,
    result.droppedColumns.length ? `Dropped: ${result.droppedColumns.join(", ")}` : "No columns dropped");

  const after = summarize(processed, expectedColumns);
  const stillMissing = after.columns.filter((c) => c.missing > 0);
  add("complete", "No missing values remain", stillMissing.length === 0,
    stillMissing.length ? stillMissing.map((c) => `${c.name} (${c.missing})`).join(", ") : "All cells are filled",
    requireComplete ? "error" : "warning");

  const numericImputed = result.imputations.filter((i) => i.numeric).map((i) => i.column);
  const badNumeric = numericImputed.filter((c) => processed.some((row) => typeof row[c] !== "number" || !Number.isFinite(row[c])));
  add("numeric-types", "Imputed numeric columns contain only numbers", badNumeric.length === 0,
    badNumeric.length ? `Non-numeric values in: ${badNumeric.join(", ")}` : numericImputed.length ? numericImputed.join(", ") : "No numeric imputation applied");

  const imputedCols = new Set(result.imputations.map((i) => i.column));
  let changed = 0;
  processed.forEach((row, i) => {
    const original = originalRows[result.keptRowIndexes[i]];
    for (const c of expectedColumns) {
      if (isMissing(original?.[c]) && imputedCols.has(c)) continue; // allowed to change
      const same = imputedCols.has(c) && result.imputations.find((x) => x.column === c).numeric
        ? toNumber(original?.[c]) === row[c] : original?.[c] === row[c];
      if (!same) changed++;
    }
  });
  add("preserved", "Existing values were not altered", changed === 0,
    changed ? `${changed} cell(s) changed unexpectedly` : "Only missing cells were filled");

  const lossPercent = originalRows.length ? round((result.droppedRowCount / originalRows.length) * 100, 2) : 0;
  add("row-loss", `Row loss is at most ${maxRowLossPercent}%`, lossPercent <= maxRowLossPercent,
    `${lossPercent}% of rows dropped`, "warning");

  const errors = checks.filter((c) => !c.passed && c.severity === "error");
  const warnings = checks.filter((c) => !c.passed && c.severity === "warning");
  return { valid: errors.length === 0, checks, errors, warnings, summary: after };
}

export function rowsToCsv(rows = []) {
  const columns = getColumnNames(rows);
  const esc = (v) => {
    const text = v === null || v === undefined ? "" : String(v);
    return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  return [columns.map(esc).join(","), ...rows.map((r) => columns.map((c) => esc(r[c])).join(","))].join("\r\n");
}
