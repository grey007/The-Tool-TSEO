const test = require('node:test');
const assert = require('node:assert/strict');
const check = require('../../src/checks/c34_canonical_offdomain');

test('canonical www variant is same-site and not critical', async () => {
  const ctx = {
    targetHost: 'apple.com',
    homepage: { body: '<link rel="canonical" href="https://www.apple.com/">' },
  };
  const r = await check.collect(ctx);
  assert.equal(r.status, 'stable');
});

test('canonical subdomain with same registrable domain is stable', async () => {
  const ctx = {
    targetHost: 'example.co.uk',
    homepage: { body: '<link rel="canonical" href="https://blog.example.co.uk/post">' },
  };
  const r = await check.collect(ctx);
  assert.equal(r.status, 'stable');
});

test('canonical off-domain is critical', async () => {
  const ctx = {
    targetHost: 'example.com',
    homepage: { body: '<link rel="canonical" href="https://evil.com/">' },
  };
  const r = await check.collect(ctx);
  assert.equal(r.status, 'critical');
});

test('canonical missing is unknown', async () => {
  const r = await check.collect({ targetHost: 'example.com', homepage: { body: '<html></html>' } });
  assert.equal(r.status, 'unknown');
});

test('canonical reasonCodes map to severity accurately', async () => {
  const cur = await check.collect({ targetHost: 'example.com', homepage: { body: '<link rel="canonical" href="https://evil.com/">' } });
  const assessed = check.assess(cur, { drifted: false, changes: [] });
  assert.ok(assessed.reasonCodes.includes('c34_canonical_offdomain:critical'));
});


test('target www to apex is same-site and not critical', async () => {
  const ctx = {
    targetHost: 'www.apple.com',
    homepage: { body: '<link rel="canonical" href="https://apple.com/">' },
  };
  const r = await check.collect(ctx);
  assert.notEqual(r.status, 'critical');
});
