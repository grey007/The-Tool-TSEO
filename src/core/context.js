const { collectDns } = require('../collectors/dnsClient');
const { collectTls } = require('../collectors/tlsClient');
const { crawlSite } = require('../collectors/htmlCrawler');
const { fetchUrl } = require('../collectors/httpClient');
const { isBlockedHostname, isBlockedIp } = require('../util/normalize');
const dns = require('node:dns').promises;

async function buildContext(targetHost, comparisonSnapshot, activeProfile, dnsResolver = dns, deps = {}) {
  if (isBlockedHostname(targetHost)) return { blockedReason: 'blocked-hostname' };

  const collectDnsImpl = deps.collectDns || collectDns;
  const collectTlsImpl = deps.collectTls || collectTls;
  const crawlSiteImpl = deps.crawlSite || crawlSite;
  const fetchUrlImpl = deps.fetchUrl || fetchUrl;

  const errors = [];
  let resolved4 = [];
  let resolved6 = [];
  let resolvedCname = [];
  try { resolved4 = await dnsResolver.resolve4(targetHost); } catch (e) { errors.push({ type: 'A', message: e?.message || 'lookup-failed' }); }
  try { resolved6 = await dnsResolver.resolve6(targetHost); } catch (e) { errors.push({ type: 'AAAA', message: e?.message || 'lookup-failed' }); }
  try { resolvedCname = await dnsResolver.resolveCname(targetHost); } catch (e) { errors.push({ type: 'CNAME', message: e?.message || 'lookup-failed' }); }
  const resolved = [...resolved4, ...resolved6, ...resolvedCname];

  if (resolved.some(isBlockedIp)) {
    return { blockedReason: 'blocked-ip-range', resolvedHosts: [...new Set(resolved)].sort(), errors };
  }

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

  const safeFetch = (url, opts = {}) => fetchUrlImpl(url, { ...limits, ...opts, allowHostnames }, caches);

  const [dnsData, tlsData, homepage, pages] = await Promise.all([
    collectDnsImpl(targetHost, caches).catch(() => null),
    collectTlsImpl(targetHost, limits.timeout).catch(() => null),
    safeFetch(`https://${targetHost}/`).catch(() => null),
    crawlSiteImpl(targetHost, limits, caches).catch(() => []),
  ]);

  const collectorResolved = [
    ...(dnsData?.A || []),
    ...(dnsData?.AAAA || []),
    ...(dnsData?.CNAME || []),
  ];
  const resolvedHosts = [...new Set([...resolved, ...collectorResolved])].sort();

  const crawlSummary = {
    pagesCrawled: pages.length,
    errorCount: pages.filter((p) => p.error || p.statusCode === 0).length,
    totalBytes: pages.reduce((acc, p) => acc + Number(p.size || 0), 0),
  };

  return {
    targetHost,
    resolvedHosts,
    errors,
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
