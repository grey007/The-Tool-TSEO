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

test('0 critical and 10 warnings keeps stabilityIndex above zero', () => {
  const checks = {};
  for (let i = 0; i < 10; i += 1) {
    checks[`w${i}`] = { severity: 'warning', headline: `warning ${i}`, drift: { drifted: false } };
  }

  const rollup = scoreChecks(checks);
  assert.equal(rollup.critical, 0);
  assert.equal(rollup.warning, 10);
  assert.ok(rollup.stabilityIndex > 0);
});

test('1 critical plus stable checks yields low but deterministic index', () => {
  const checks = {
    c01_tls_cert_expiry: { severity: 'critical', headline: 'cert expiry', drift: { drifted: false } },
    s1: { severity: 'stable', headline: 'stable 1', drift: { drifted: false } },
    s2: { severity: 'stable', headline: 'stable 2', drift: { drifted: false } },
    s3: { severity: 'stable', headline: 'stable 3', drift: { drifted: false } },
  };

  const one = scoreChecks(checks);
  const two = scoreChecks(checks);
  assert.deepEqual(one, two);
  assert.equal(one.critical, 1);
  assert.ok(one.stabilityIndex >= 0 && one.stabilityIndex <= 60);
});
