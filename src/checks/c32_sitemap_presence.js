const { result, compareSimple, assessFromStatus } = require('./_shared');

function detectSitemap(body = '') {
  const sample = body.slice(0, 4096).toLowerCase();
  if (sample.includes('<urlset')) return 'urlset';
  if (sample.includes('<sitemapindex')) return 'sitemapindex';
  return null;
}

module.exports = {
  id: 'c32_sitemap_presence',
  version: 1,
  description: 'c32 sitemap presence',
  collect: async (ctx) => {
    const candidates = [`https://${ctx.targetHost}/sitemap.xml`, `https://${ctx.targetHost}/sitemap_index.xml`];
    for (const url of candidates) {
      try {
        const res = await ctx.fetchUrl(url);
        if (res.error) continue;
        const detectedType = detectSitemap(res.body || '');
        const contentType = res.headers?.['content-type'] || '';
        if (res.statusCode === 200 && detectedType) {
          return result('stable', { statusCode: 200, contentType, detectedType }, { url, statusCode: 200, contentType, detectedType });
        }
        if (res.statusCode >= 400 || res.statusCode === 0) {
          return result('warning', { statusCode: res.statusCode || 0, contentType, detectedType: null }, { url, statusCode: res.statusCode || 0, contentType, detectedType: null });
        }
        return result('warning', { statusCode: res.statusCode || 0, contentType, detectedType: null }, { url, statusCode: res.statusCode || 0, contentType, detectedType: null });
      } catch {}
    }
    return result('unknown', { statusCode: 0, contentType: '', detectedType: null }, { error: 'sitemap-probe-failed' });
  },
  compare: (current, previous) => compareSimple(current?.metrics, previous?.metrics),
  assess: (current, drift) => assessFromStatus('c32_sitemap_presence', current, drift),
};
