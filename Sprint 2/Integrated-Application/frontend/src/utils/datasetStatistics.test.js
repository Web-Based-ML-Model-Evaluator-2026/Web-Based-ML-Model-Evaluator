import test from "node:test";
import assert from "node:assert/strict";
import { calculateDatasetStatistics, isMissing, reportToCsv } from "./datasetStatistics.js";

test("calculates numeric and categorical summaries", () => {
  const report = calculateDatasetStatistics(
    [
      [1, "red"],
      [2, "blue"],
      [3, "red"],
      [null, "blue"]
    ],
    ["score", "label"]
  );
  assert.equal(report.overview.rowCount, 4);
  assert.equal(report.overview.columnCount, 2);
  assert.equal(report.overview.missingCells, 1);
  assert.equal(report.columns[0].inferredType, "Numeric");
  assert.equal(report.columns[0].numeric.mean, 2);
  assert.equal(report.columns[0].numeric.median, 2);
  assert.equal(report.columns[0].numeric.min, 1);
  assert.equal(report.columns[0].numeric.max, 3);
  assert.equal(report.columns[1].categorical.mostFrequent.value, "blue");
});

test("counts common missing tokens and empty columns", () => {
  assert.equal(isMissing("  "), true);
  assert.equal(isMissing("N/A"), true);
  const report = calculateDatasetStatistics([[null], ["NA"]], ["blank"]);
  assert.equal(report.columns[0].inferredType, "Empty");
  assert.equal(report.columns[0].missing, 2);
});

test("calculates sample standard deviation and outliers", () => {
  const report = calculateDatasetStatistics([[1], [2], [3], [100]], ["x"]);
  assert.equal(report.columns[0].numeric.standardDeviation, 49.006802);
  assert.equal(report.columns[0].numeric.outlierCount, 1);
});

test("detects duplicate rows and exports CSV", () => {
  const report = calculateDatasetStatistics([[1, "a"], [1, "a"], [2, "b"]], ["x", "y"]);
  assert.equal(report.overview.duplicateRows, 1);
  const csv = reportToCsv(report);
  assert.match(csv, /Column,Type,Rows/);
  assert.match(csv, /x,Numeric,3/);
});

test("rejects invalid API input and zero-column data", () => {
  assert.throws(() => calculateDatasetStatistics({}, ["x"]), /must be arrays/);
  assert.throws(() => calculateDatasetStatistics([[1]], []), /no columns/);
});

test("handles object rows keyed by header", () => {
  const report = calculateDatasetStatistics([{ age: "20" }, { age: "30" }], ["age"]);
  assert.equal(report.columns[0].numeric.mean, 25);
});
