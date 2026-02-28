const test = require('node:test');
const assert = require('node:assert/strict');
const check = require('../../src/checks/c32_sitemap_presence');

test('sitemap detection stable on xml urlset response', async () => {
  const ctx = {
    targetHost: 'example.com',
    fetchUrl: async () => ({ statusCode: 200, headers: { 'content-type': 'application/xml' }, body: '<urlset></urlset>' }),
  };
  const r = await check.collect(ctx);
  assert.equal(r.status, 'stable');
  assert.equal(r.metrics.detectedType, 'urlset');
});
