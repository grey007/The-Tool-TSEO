const test = require('node:test');
const assert = require('node:assert/strict');
const { buildDrift } = require('../../src/drift/diff');

test('drift stable results', () => {
  const c = { checks: { x: { metrics: { a: 1 } } } };
  const p = { checks: { x: { metrics: { a: 1 } } } };
  assert.deepEqual(buildDrift(c, p), { x: false });
});
