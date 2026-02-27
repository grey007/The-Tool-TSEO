const test = require('node:test');
const assert = require('node:assert/strict');
const { scoreChecks } = require('../../src/scoring/score');

test('rollup ordering deterministic by severity drift penalty and id', () => {
  const checks = {
    z: { severity: 'warning', headline: 'Z', drift: { drifted: false } },
    c01_tls_cert_expiry: { severity: 'critical', headline: 'Expiry', drift: { drifted: false } },
    c34_canonical_offdomain: { severity: 'critical', headline: 'Canon', drift: { drifted: true } },
    a: { severity: 'critical', headline: 'A', drift: { drifted: true } },
  };
  const r = scoreChecks(checks);
  assert.equal(r.mostImmediateRisk, 'Canon');
  assert.deepEqual(r.secondaryRisks.slice(0, 3), ['Canon', 'A', 'Expiry']);
});
