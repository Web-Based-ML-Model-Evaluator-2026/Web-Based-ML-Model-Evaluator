import test from 'node:test';
import assert from 'node:assert/strict';
const validate = (name) => typeof name === 'string' && name.trim().length >= 3 && name.trim().length <= 50 && /^[A-Za-z0-9 _.-]+$/.test(name.trim());
test('project names accept ordinary names', () => { assert.equal(validate('Customer Churn'), true); assert.equal(validate('Model_v2.1'), true); });
test('project names reject blank, short, long and unsupported characters', () => {
  assert.equal(validate(''), false); assert.equal(validate('ab'), false); assert.equal(validate('x'.repeat(51)), false); assert.equal(validate('bad/name'), false);
});
