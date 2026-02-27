const test = require('node:test');
const assert = require('node:assert/strict');
const { scoreChecks } = require('../../src/scoring/score');

test('scoring deterministic', () => {
  const checks = {
    b: { severity: 'warning', headline: 'b', drift: { drifted: false } },
    a: { severity: 'critical', headline: 'a', drift: { drifted: true } },
  };
  const one = scoreChecks(checks);
  const two = scoreChecks(checks);
  assert.deepEqual(one, two);
  assert.equal(one.critical, 1);
});
