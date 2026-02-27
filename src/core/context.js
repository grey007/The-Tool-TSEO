const { collectDns } = require('../collectors/dnsClient');
const { collectTls } = require('../collectors/tlsClient');
const { crawlSite } = require('../collectors/htmlCrawler');
const { fetchUrl } = require('../collectors/httpClient');
const { isBlockedHostname, isBlockedIp } = require('../util/normalize');
const dns = require('node:dns').promises;

async function buildContext(targetHost, comparisonSnapshot, activeProfile, dnsResolver = dns) {
  if (isBlockedHostname(targetHost)) return { blockedReason: 'blocked-hostname' };

  let resolved4 = [];
  let resolved6 = [];
  try { resolved4 = await dnsResolver.resolve4(targetHost); } catch {}
  try { resolved6 = await dnsResolver.resolve6(targetHost); } catch {}
  const resolved = [...resolved4, ...resolved6];

  if (resolved.some(isBlockedIp)) return { blockedReason: 'blocked-ip-range', resolvedHosts: resolved };

  const limits = {
    timeout: 6000,
    maxRedirections: 5,
    maxSize: 2 * 1024 * 1024,
    maxPages: 60,
    maxDepth: 2,
    concurrency: 6,
    ...(activeProfile?.limits || {}),
  };
  const allowHostnames = [targetHost, `www.${targetHost}`];
  const caches = { dns: new Map(), http: new Map(), special: new Map() };

  const safeFetch = (url, opts = {}) => fetchUrl(url, { ...limits, ...opts, allowHostnames }, caches);

  const [dnsData, tlsData, homepage, pages] = await Promise.all([
    collectDns(targetHost, caches).catch(() => null),
    collectTls(targetHost, limits.timeout).catch(() => null),
    safeFetch(`https://${targetHost}/`).catch(() => null),
    crawlSite(targetHost, limits, caches).catch(() => []),
  ]);

  const crawlSummary = {
    pagesCrawled: pages.length,
    errorCount: pages.filter((p) => p.error || p.statusCode === 0).length,
    totalBytes: pages.reduce((acc, p) => acc + Number(p.size || 0), 0),
  };

  return {
    targetHost,
    resolvedHosts: resolved.sort(),
    dns: dnsData,
    tls: tlsData,
    homepage,
    pages,
    crawlSummary,
    comparisonSnapshot,
    previousSnapshot: comparisonSnapshot,
    limits,
    activeProfile,
    caches,
    fetchUrl: safeFetch,
  };
}

module.exports = { buildContext };
