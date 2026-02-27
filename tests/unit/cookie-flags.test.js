const test = require('node:test');
const assert = require('node:assert/strict');
const check = require('../../src/checks/c25_cookie_flags');

test('cookie check flags missing secure or httponly correctly', async () => {
  const ctx = { homepage: { headers: { 'set-cookie': ['a=1; HttpOnly', 'b=2; Secure; HttpOnly'] } } };
  const r = await check.collect(ctx);
  assert.equal(r.status, 'warning');
  assert.equal(r.metrics.bad, 1);
});
