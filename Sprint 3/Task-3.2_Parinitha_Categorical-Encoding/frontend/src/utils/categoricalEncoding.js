export function isMissing(value) {
  return value === null || value === undefined || String(value).trim() === "";
}

export function identifyCategoricalColumns(rows = []) {
  if (!Array.isArray(rows) || rows.length === 0) return [];
  const names = Object.keys(rows[0] ?? {});
  return names.map((name) => {
    const values = rows.map((row) => row?.[name]).filter((v) => !isMissing(v));
    const uniqueValues = [...new Set(values.map(String))];
    const allNumeric = values.length > 0 && values.every((v) =>
      typeof v === "number" || (String(v).trim() !== "" && Number.isFinite(Number(v)))
    );
    const lowCardinalityNumeric = allNumeric && uniqueValues.length <= Math.min(10, Math.ceil(rows.length * 0.1));
    return { name, dataType: allNumeric ? "Number" : "Categorical", uniqueCount: uniqueValues.length,
      uniqueValues, isCategorical: values.length > 0 && (!allNumeric || lowCardinalityNumeric) };
  }).filter((c) => c.isCategorical);
}

export function labelEncode(rows = [], columnName) {
  const categories = [];
  const mapping = {};
  for (const row of rows) {
    const value = row?.[columnName];
    if (isMissing(value)) continue;
    const key = String(value);
    if (!(key in mapping)) { mapping[key] = categories.length; categories.push(key); }
  }
  return {
    rows: rows.map((row) => ({ ...row, [columnName]: isMissing(row?.[columnName]) ? null : mapping[String(row[columnName])] })),
    mapping, categories, columns: [columnName], method: "label"
  };
}

export function oneHotEncode(rows = [], columnName, options = {}) {
  const { dropFirst = false, prefix = true } = options;
  const categories = [];
  for (const row of rows) {
    const value = row?.[columnName];
    if (!isMissing(value) && !categories.includes(String(value))) categories.push(String(value));
  }
  const kept = dropFirst ? categories.slice(1) : categories;
  const names = kept.map((category) => prefix ? `${columnName}_${category}` : category);
  const encodedRows = rows.map((row) => {
    const output = { ...row };
    delete output[columnName];
    kept.forEach((category, i) => {
      output[names[i]] = isMissing(row?.[columnName]) ? 0 : (String(row[columnName]) === category ? 1 : 0);
    });
    return output;
  });
  return { rows: encodedRows, categories, columns: names, sourceColumn: columnName, method: "one-hot" };
}

export function encodeCategoricalColumn(rows = [], columnName, method = "label", options = {}) {
  if (!Array.isArray(rows) || rows.length === 0) throw new Error("There are no dataset rows to encode.");
  if (!Object.prototype.hasOwnProperty.call(rows[0] ?? {}, columnName)) throw new Error(`Column "${columnName}" was not found.`);
  if (method === "label") return labelEncode(rows, columnName);
  if (method === "one-hot") return oneHotEncode(rows, columnName, options);
  throw new Error("Choose Label Encoding or One-Hot Encoding.");
}

export function parseCsvText(text) {
  if (typeof text !== "string" || !text.trim()) throw new Error("CSV content is empty.");
  const lines = text.trim().split(/\r?\n/);
  const headers = lines[0].split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
  if (headers.some((h) => !h)) throw new Error("CSV contains an empty column name.");
  if (lines.length < 2) throw new Error("CSV must contain a header and at least one data row.");
  return lines.slice(1).filter((line) => line.trim()).map((line) => {
    const values = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
    return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? ""]));
  });
}
