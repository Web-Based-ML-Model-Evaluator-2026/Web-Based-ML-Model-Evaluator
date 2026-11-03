import test from 'node:test';
import assert from 'node:assert/strict';
import { validateComparison, rankModels, formatMetric } from '../src/lib/modelComparison.js';

test('classification ranks larger score first', () => {
  const ranked = rankModels([{name:'A',metrics:{f1_score:0.7}},{name:'B',metrics:{f1_score:0.9}}], 'f1_score');
  assert.equal(ranked[0].name, 'B');
});
test('regression error ranks smaller value first', () => {
  const ranked = rankModels([{name:'A',metrics:{rmse:2.4}},{name:'B',metrics:{rmse:1.2}}], 'rmse');
  assert.equal(ranked[0].name, 'B');
});
test('rejects fewer than two models', () => {
  assert.match(validateComparison('classification',[{name:'A',metrics:{f1_score:0.8}}],'f1_score'), /at least two/);
});
test('rejects invalid classification score', () => {
  assert.match(validateComparison('classification',[{name:'A',metrics:{f1_score:1.2}},{name:'B',metrics:{f1_score:0.5}}],'f1_score'), /\[0, 1\]/);
});
test('formats metric values', () => assert.equal(formatMetric(0.91234), '0.9123'));
