import test from "node:test";
import assert from "node:assert/strict";
import {
  applyMissingStrategy, validateProcessedDataset, profileMissingValues, isMissing, rowsToCsv
} from "./missingValueHandling.js";

const data = () => [
  { id: "a", hours: "2", city: "Pune", score: 10 },
  { id: "b", hours: "", city: "Pune", score: 20 },
  { id: "c", hours: "6", city: "", score: null },
  { id: "d", hours: "NA", city: "Goa", score: 40 }
];

test("isMissing recognises blanks and common null tokens", () => {
  for (const v of [null, undefined, "", "  ", "NA", "n/a", "NaN", NaN]) assert.equal(isMissing(v), true);
  for (const v of [0, "0", "abc", false]) assert.equal(isMissing(v), false);
});

test("profile counts missing cells per column and detects types", () => {
  const p = profileMissingValues(data());
  assert.equal(p.missingCells, 4);
  assert.equal(p.rowsWithMissing, 3);
  const hours = p.columns.find((c) => c.name === "hours");
  assert.equal(hours.missing, 2);
  assert.equal(hours.type, "Numeric");
  assert.equal(p.columns.find((c) => c.name === "city").type, "Categorical");
});

test("mean fills numeric columns and returns real numbers", () => {
  const input = data();
  const r = applyMissingStrategy(input, { strategy: "mean", columns: ["hours"] });
  assert.deepEqual(r.rows.map((x) => x.hours), [2, 4, 6, 4]);
  assert.equal(input[1].hours, "", "input must not be mutated");
  assert.equal(validateProcessedDataset(input, r, { requireComplete: false }).valid, true);
});

test("median and mode work; mode tie picks smallest number", () => {
  const rows = [{ x: 1 }, { x: 3 }, { x: 100 }, { x: null }];
  assert.equal(applyMissingStrategy(rows, { strategy: "median" }).rows[3].x, 3);
  const tie = [{ x: 5 }, { x: 2 }, { x: null }];
  assert.equal(applyMissingStrategy(tie, { strategy: "mode" }).rows[2].x, 2);
  const cat = applyMissingStrategy(data(), { strategy: "mode", columns: ["city"] });
  assert.equal(cat.rows[2].city, "Pune");
});

test("mean on a categorical column is skipped with a warning, not applied", () => {
  const input = data();
  const r = applyMissingStrategy(input, { strategy: "mean" });
  assert.equal(r.skipped.length, 1);
  assert.equal(r.skipped[0].column, "city");
  assert.equal(r.rows[2].city, "");
  const v = validateProcessedDataset(input, r);
  assert.equal(v.valid, false);
  assert.match(v.errors[0].detail, /city/);
});

test("constant fill validates input and type compatibility", () => {
  assert.throws(() => applyMissingStrategy(data(), { strategy: "constant", fillValue: " " }), /constant/i);
  const r = applyMissingStrategy(data(), { strategy: "constant", fillValue: "0" });
  assert.equal(r.rows[1].hours, 0);
  assert.equal(r.rows[2].city, "0");
  const bad = applyMissingStrategy(data(), { strategy: "constant", fillValue: "unknown", columns: ["hours"] });
  assert.equal(bad.skipped.length, 1);
});

test("drop-rows removes rows with missing values in selected columns only", () => {
  const input = data();
  const r = applyMissingStrategy(input, { strategy: "drop-rows", columns: ["hours"] });
  assert.deepEqual(r.rows.map((x) => x.id), ["a", "c"]);
  assert.equal(r.droppedRowCount, 2);
  const v = validateProcessedDataset(input, r, { requireComplete: false });
  assert.equal(v.valid, true);
  assert.ok(v.warnings.some((w) => w.id === "row-loss"), "50% row loss should warn");
});

test("drop-columns removes only columns that contain missing values", () => {
  const input = data();
  const r = applyMissingStrategy(input, { strategy: "drop-columns" });
  assert.deepEqual(Object.keys(r.rows[0]), ["id"]);
  assert.deepEqual(r.droppedColumns, ["hours", "city", "score"]);
  assert.equal(validateProcessedDataset(input, r).valid, true);
});

test("fully complete data is a no-op and fully empty columns are handled", () => {
  const rows = [{ a: 1, b: null }, { a: 2, b: "" }];
  const r = applyMissingStrategy(rows, { strategy: "mean" });
  assert.equal(r.skipped[0].column, "b");
  assert.equal(applyMissingStrategy([{ a: 1 }], { strategy: "mean" }).imputations.length, 0);
});

test("invalid input is rejected with clear errors", () => {
  assert.throws(() => applyMissingStrategy([], { strategy: "mean" }), /no dataset rows/);
  assert.throws(() => applyMissingStrategy(data(), { strategy: "magic" }), /valid missing-value strategy/);
  assert.throws(() => applyMissingStrategy(data(), { strategy: "mean", columns: [] }), /at least one/);
  assert.throws(() => applyMissingStrategy(data(), { strategy: "mean", columns: ["nope"] }), /not found/);
});

test("validation catches tampered output", () => {
  const input = data();
  const r = applyMissingStrategy(input, { strategy: "mode", columns: ["city"] });
  r.rows[0].id = "zzz";
  const v = validateProcessedDataset(input, r, { requireComplete: false });
  assert.equal(v.checks.find((c) => c.id === "preserved").passed, false);
});

test("rowsToCsv escapes special characters", () => {
  assert.equal(rowsToCsv([{ a: 'x,"y"', b: null }]), 'a,b\r\n"x,""y""",');
});
