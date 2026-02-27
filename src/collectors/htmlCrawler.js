const { fetchUrl } = require('./httpClient');

function extractLinks(html) {
  const links = [];
  const re = /<a[^>]+href=["']([^"']+)["']/gi;
  let m;
  while ((m = re.exec(html)) !== null) links.push(m[1]);
  return links;
}

function normalizeCrawlUrl(input, baseUrl) {
  const u = new URL(input, baseUrl);
  u.hash = '';
  if (u.pathname !== '/' && u.pathname.endsWith('/')) u.pathname = u.pathname.slice(0, -1);
  return u.toString();
}

async function crawlSite(host, limits = {}, caches) {
  const maxPages = limits.maxPages || 60;
  const maxDepth = limits.maxDepth || 2;
  const concurrency = limits.concurrency || 6;
  const seen = new Set();
  const pages = [];

  let frontier = [{ url: `https://${host}/`, depth: 0 }];
  seen.add(`https://${host}/`);

  for (let depth = 0; depth <= maxDepth; depth += 1) {
    if (!frontier.length || pages.length >= maxPages) break;
    const currentLevel = frontier.filter((i) => i.depth === depth);
    const nextFrontier = [];

    for (let i = 0; i < currentLevel.length; i += concurrency) {
      if (pages.length >= maxPages) break;
      const batch = currentLevel.slice(i, i + concurrency);
      const results = await Promise.all(batch.map(async (item) => {
        try {
          const res = await fetchUrl(item.url, { ...limits, allowHostnames: [host, `www.${host}`] }, caches);
          const page = {
            url: item.url,
            statusCode: res.statusCode,
            headers: res.headers,
            body: res.body,
            size: res.size,
            links: [],
            timingMs: res.timings?.totalMs || 0,
            error: res.error || null,
          };
          if (depth < maxDepth && res.body) {
            for (const href of extractLinks(res.body)) {
              try {
                const normalized = normalizeCrawlUrl(href, item.url);
                const next = new URL(normalized);
                if ((next.protocol === 'http:' || next.protocol === 'https:') && next.hostname === host) {
                  page.links.push(normalized);
                  if (!seen.has(normalized) && seen.size < maxPages) {
                    seen.add(normalized);
                    nextFrontier.push({ url: normalized, depth: depth + 1 });
                  }
                }
              } catch {}
            }
          }
          page.links.sort();
          return page;
        } catch {
          return { url: item.url, error: 'fetch-failed', statusCode: 0, headers: {}, body: '', size: 0, links: [], timingMs: 0 };
        }
      }));
      pages.push(...results);
    }

    frontier = nextFrontier.sort((a, b) => a.url.localeCompare(b.url));
  }

  return pages.slice(0, maxPages);
}

module.exports = { crawlSite, normalizeCrawlUrl };
