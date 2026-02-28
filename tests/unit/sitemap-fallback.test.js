const test = require('node:test');
const assert = require('node:assert/strict');
const check = require('../../src/checks/c32_sitemap_presence');

test('sitemap check tries fallback candidate before warning', async () => {
  const calls = [];
  const ctx = {
    targetHost: 'example.com',
    fetchUrl: async (url) => {
      calls.push(url);
      if (url.endsWith('/sitemap.xml')) return { statusCode: 404, headers: { 'content-type': 'text/plain' }, body: 'not found' };
      return { statusCode: 200, headers: { 'content-type': 'application/xml' }, body: '<sitemapindex></sitemapindex>' };
    },
  };
  const r = await check.collect(ctx);
  assert.equal(calls.length, 2);
  assert.equal(r.status, 'stable');
  assert.equal(r.metrics.detectedType, 'sitemapindex');
});
