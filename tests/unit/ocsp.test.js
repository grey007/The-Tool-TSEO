const test = require('node:test');
const assert = require('node:assert/strict');
const check = require('../../src/checks/c07_tls_ocsp_stapling');

test('ocsp check is unknown and does not rely on http headers', async () => {
  const r = await check.collect({ homepage: { headers: { 'ocsp-response': 'fake' } } });
  assert.equal(r.status, 'unknown');
  assert.equal(r.metrics.ocspStapled, null);
  assert.match(r.evidence.reason, /not reliably observable/i);
});
