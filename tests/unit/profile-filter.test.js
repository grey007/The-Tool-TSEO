const test = require('node:test');
const assert = require('node:assert/strict');
const { loadChecks } = require('../../src/core/registry');

test('registry filters enabled checks deterministically', () => {
  const enabled = ['c02_tls_issuer_drift', 'c01_tls_cert_expiry'];
  const ids = loadChecks(enabled).map((c) => c.id);
  assert.deepEqual(ids, ['c01_tls_cert_expiry', 'c02_tls_issuer_drift']);
});
