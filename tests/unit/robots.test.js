const test = require('node:test');
const assert = require('node:assert/strict');
const check = require('../../src/checks/c31_robots_txt_presence');

test('robots check probes robots.txt directly via fetch helper', async () => {
  let requested = '';
  const ctx = {
    targetHost: 'example.com',
    fetchUrl: async (url) => {
      requested = url;
      return { statusCode: 200, finalUrl: url };
    },
  };
  const r = await check.collect(ctx);
  assert.equal(requested, 'https://example.com/robots.txt');
  assert.equal(r.status, 'stable');
  assert.equal(r.metrics.found, true);
});
