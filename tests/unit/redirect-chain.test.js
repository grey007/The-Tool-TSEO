const test = require('node:test');
const assert = require('node:assert/strict');
const check = require('../../src/checks/c29_redirect_chain_length');

test('redirect chain check uses observed redirect count thresholds', async () => {
  const stable = await check.collect({ homepage: { redirectCount: 1, finalUrl: 'https://example.com' } });
  const warn = await check.collect({ homepage: { redirectCount: 3, finalUrl: 'https://example.com' } });
  const critical = await check.collect({ homepage: { redirectCount: 5, finalUrl: 'https://example.com' } });
  assert.equal(stable.status, 'stable');
  assert.equal(warn.status, 'warning');
  assert.equal(critical.status, 'critical');
});
