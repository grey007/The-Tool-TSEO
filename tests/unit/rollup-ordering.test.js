const test = require('node:test');
const assert = require('node:assert/strict');
const { scoreChecks } = require('../../src/scoring/score');

test('rollup ordering deterministic by severity then weight then id', () => {
  const checks = {
    z: { severity: 'warning', headline: 'Warning Z', drift: { drifted: false } },
    c40_response_time_avg_volatility: { severity: 'warning', headline: 'Warning Weighted', drift: { drifted: false } },
    c01_tls_cert_expiry: { severity: 'critical', headline: 'Critical Weighted', drift: { drifted: false } },
    a: { severity: 'critical', headline: 'Critical Default', drift: { drifted: true } },
    u: { severity: 'unknown', headline: 'Unknown', drift: { drifted: false } },
  };
  const r = scoreChecks(checks);
  assert.equal(r.mostImmediateRisk, 'Critical Weighted');
  assert.deepEqual(r.secondaryRisks.slice(0, 4), [
    { id: 'a', status: 'critical' },
    { id: 'c40_response_time_avg_volatility', status: 'warning' },
    { id: 'z', status: 'warning' },
    { id: 'u', status: 'unknown' },
  ]);
  assert.ok(Array.isArray(r.secondaryRisks));
});

test('mostImmediateRisk prefers critical over warning, then highest warning weight in ties', () => {
  const checks = {
    c40_response_time_avg_volatility: { severity: 'warning', headline: 'Weighted warning', drift: { drifted: false } },
    c10_mixed_content_internal: { severity: 'warning', headline: 'Higher weighted warning', drift: { drifted: false } },
    c05_tls_chain_validity: { severity: 'critical', headline: 'Critical beats warning', drift: { drifted: false } },
  };

  const r = scoreChecks(checks);
  assert.equal(r.mostImmediateRisk, 'Critical beats warning');
  assert.deepEqual(r.secondaryRisks.slice(0, 2), [
    { id: 'c10_mixed_content_internal', status: 'warning' },
    { id: 'c40_response_time_avg_volatility', status: 'warning' },
  ]);
});
