import test from "node:test";
import assert from "node:assert/strict";
import { applyScalingParameters, detectNumericColumns, fitScalingParameters, rowsToCsv, scaleDataset } from "./featureScaling.js";

const rows = [
  { id: "A", hours: 1, score: 10, group: "x" },
  { id: "B", hours: 2, score: 20, group: "y" },
  { id: "C", hours: 3, score: 30, group: "x" },
];

test("detects numeric columns and excludes categorical columns", () => assert.deepEqual(detectNumericColumns(rows), ["hours", "score"]));
test("standard scaling produces mean zero and population standard deviation one", () => {
  const result = scaleDataset(rows, { method: "standard", columns: ["hours"] });
  const values = result.rows.map((row) => row.hours);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const sd = Math.sqrt(values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length);
  assert.ok(Math.abs(mean) < 1e-12); assert.ok(Math.abs(sd - 1) < 1e-12);
  assert.equal(result.validation.valid, true); assert.deepEqual(result.rows.map((r) => r.group), ["x", "y", "x"]);
});
test("min-max normalization maps selected extrema to zero and one", () => {
  const result = scaleDataset(rows, { method: "minmax", columns: ["score"] });
  assert.deepEqual(result.rows.map((r) => r.score), [0, 0.5, 1]);
});
test("supports a custom min-max range", () => {
  const result = scaleDataset(rows, { method: "minmax", columns: ["hours"], minRange: -1, maxRange: 1 });
  assert.deepEqual(result.rows.map((r) => r.hours), [-1, 0, 1]);
});
test("preserves missing values and fits on available numeric values", () => {
  const result = scaleDataset([{ x: 1 }, { x: "NA" }, { x: 3 }], { method: "minmax", columns: ["x"] });
  assert.equal(result.rows[1].x, "NA"); assert.equal(result.rows[0].x, 0); assert.equal(result.rows[2].x, 1);
});
test("rejects non-numeric selected columns", () => assert.throws(() => scaleDataset([{ x: 1 }, { x: "oops" }], { columns: ["x"] }), /non-numeric value/));
test("handles constant columns deterministically and reports them", () => {
  const standard = scaleDataset([{ x: 4 }, { x: 4 }], { method: "standard", columns: ["x"] });
  assert.deepEqual(standard.rows.map((r) => r.x), [0, 0]); assert.deepEqual(standard.constantColumns, ["x"]);
  const minmax = scaleDataset([{ x: 4 }, { x: 4 }], { method: "minmax", columns: ["x"], minRange: 2, maxRange: 5 });
  assert.deepEqual(minmax.rows.map((r) => r.x), [2, 2]);
});
test("does not mutate the input rows", () => {
  const input = rows.map((row) => ({ ...row })); const before = structuredClone(input);
  scaleDataset(input, { columns: ["hours"] }); assert.deepEqual(input, before);
});
test("rejects empty rows, no selected columns and invalid min-max range", () => {
  assert.throws(() => scaleDataset([]), /at least one data row/);
  assert.throws(() => scaleDataset(rows, { columns: [] }), /Select at least one/);
  assert.throws(() => scaleDataset(rows, { method: "minmax", columns: ["hours"], minRange: 2, maxRange: 2 }), /minimum less than maximum/);
});
test("fitted training parameters can be applied to another split", () => {
  const fitted = fitScalingParameters(rows, { method: "minmax", columns: ["hours"] });
  const output = applyScalingParameters([{ hours: 4, group: "z" }], fitted);
  assert.equal(output[0].hours, 1.5); assert.equal(output[0].group, "z");
});
test("CSV export escapes quotes, commas and line breaks", () => {
  assert.equal(rowsToCsv([{ a: 'A,"B', b: "line1\nline2" }]), 'a,b\r\n"A,""B","line1\nline2"');
});
