import test from 'node:test';
import assert from 'node:assert/strict';
import { precheckFile, precheckToReport, MAX_FILE_SIZE_BYTES } from './clientPrecheck.js';

const f = (name, size = 100, type = 'text/csv') => ({ name, size, type });

test('accepts a normal csv', () => {
  assert.equal(precheckFile(f('data.csv')).ok, true);
});

test('accepts uppercase extension and Excel mime type', () => {
  assert.equal(precheckFile(f('DATA.CSV', 10, 'application/vnd.ms-excel')).ok, true);
});

test('rejects missing file', () => {
  assert.equal(precheckFile(null).code, 'NO_FILE');
});

test('rejects wrong extensions', () => {
  for (const n of ['a.txt', 'a.xlsx', 'a.json', 'a', 'a.csv.exe']) {
    assert.equal(precheckFile(f(n)).code, 'INVALID_FILE_TYPE', n);
  }
});

test('rejects wrong mime type', () => {
  assert.equal(precheckFile(f('a.csv', 10, 'image/png')).code, 'INVALID_MIME_TYPE');
});

test('rejects empty file', () => {
  assert.equal(precheckFile(f('a.csv', 0)).code, 'EMPTY_FILE');
});

test('size limit boundary', () => {
  assert.equal(precheckFile(f('a.csv', MAX_FILE_SIZE_BYTES)).ok, true);
  assert.equal(precheckFile(f('a.csv', MAX_FILE_SIZE_BYTES + 1)).code, 'FILE_TOO_LARGE');
});

test('precheckToReport matches backend report shape', () => {
  const file = f('a.txt');
  const report = precheckToReport(file, precheckFile(file));
  assert.equal(report.valid, false);
  assert.equal(report.errors[0].code, 'INVALID_FILE_TYPE');
  assert.deepEqual(Object.keys(report).sort(), ['errors', 'summary', 'valid', 'warnings']);
});
