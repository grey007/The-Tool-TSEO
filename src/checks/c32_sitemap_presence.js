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
    const attempts = [];

    for (const url of candidates) {
      try {
        const res = await ctx.fetchUrl(url);
        if (res.error) {
          attempts.push({ url, error: res.error, statusCode: 0 });
          continue;
        }
        const detectedType = detectSitemap(res.body || '');
        const contentType = res.headers?.['content-type'] || '';
        attempts.push({ url, statusCode: res.statusCode || 0, contentType, detectedType: detectedType || null });

        if (res.statusCode === 200 && detectedType) {
          return result('stable', { statusCode: 200, contentType, detectedType }, { url, statusCode: 200, contentType, detectedType });
        }
      } catch {
        attempts.push({ url, error: 'fetch-failed', statusCode: 0 });
      }
    }

    const anyReachable = attempts.some((a) => (a.statusCode || 0) > 0);
    if (anyReachable) {
      const last = attempts[attempts.length - 1] || { statusCode: 0, contentType: '', detectedType: null };
      return result('warning', { statusCode: last.statusCode || 0, contentType: last.contentType || '', detectedType: null }, { attempts });
    }

    return result('unknown', { statusCode: 0, contentType: '', detectedType: null }, { attempts, error: 'sitemap-probe-failed' });
  },
  compare: (current, previous) => compareSimple(current?.metrics, previous?.metrics),
  assess: (current, drift) => assessFromStatus('c32_sitemap_presence', current, drift),
};
