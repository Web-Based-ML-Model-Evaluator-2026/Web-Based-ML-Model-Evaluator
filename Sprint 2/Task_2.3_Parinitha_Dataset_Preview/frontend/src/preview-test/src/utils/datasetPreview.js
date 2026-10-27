
export function normalizeColumns(columns = []) {
  return columns.map((column) => {
    if (typeof column === "string") {
      return { name: column, dataType: "Unknown" };
    }

    return {
      name: column?.name ?? column?.column_name ?? "Unnamed column",
      dataType:
        column?.data_type ??
        column?.dataType ??
        column?.dtype ??
        "Unknown",
    };
  });
}

export function inferColumnType(values = []) {
  const present = values.filter(
    (value) =>
      value !== null &&
      value !== undefined &&
      String(value).trim() !== ""
  );

  if (present.length === 0) return "Unknown";

  const allBoolean = present.every(
    (value) =>
      typeof value === "boolean" ||
      ["true", "false"].includes(String(value).toLowerCase())
  );

  if (allBoolean) return "Boolean";

  const allNumbers = present.every(
    (value) =>
      typeof value === "number" ||
      (String(value).trim() !== "" &&
        Number.isFinite(Number(value)))
  );

  return allNumbers ? "Number" : "Text";
}

export function getColumnValues(rows = [], columnName) {
  return rows.map((row) => row?.[columnName]);
}
