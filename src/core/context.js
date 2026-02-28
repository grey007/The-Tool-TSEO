const { collectDns } = require('../collectors/dnsClient');
const { collectTls } = require('../collectors/tlsClient');
const { crawlSite } = require('../collectors/htmlCrawler');
const { fetchUrl } = require('../collectors/httpClient');
const { isBlockedHostname, isBlockedIp } = require('../util/normalize');
const dns = require('node:dns').promises;

function uniqSorted(values) {
  return [...new Set((values || []).filter((v) => typeof v === 'string' && v.trim()))].sort();
}

function resolvedHostsShape() {
  return { A: [], AAAA: [], CNAME: [], NS: [], MX: [], TXT: [] };
}

function buildResolvedHosts(resolver, dnsData) {
  const out = resolvedHostsShape();
  out.A = uniqSorted([...(resolver?.A || []), ...(dnsData?.A || [])]);
  out.AAAA = uniqSorted([...(resolver?.AAAA || []), ...(dnsData?.AAAA || [])]);
  out.CNAME = uniqSorted([...(resolver?.CNAME || []), ...(dnsData?.CNAME || [])]);
  out.NS = uniqSorted(dnsData?.NS || []);
  out.MX = uniqSorted((dnsData?.MX || []).map((m) => (typeof m === 'string' ? m : m?.exchange || '')));
  out.TXT = uniqSorted(dnsData?.TXT || []);
  return out;
}

async function buildContext(targetHost, comparisonSnapshot, activeProfile, dnsResolver = dns, deps = {}) {
  if (isBlockedHostname(targetHost)) return { blockedReason: 'blocked-hostname' };

  const collectDnsImpl = deps.collectDns || collectDns;
  const collectTlsImpl = deps.collectTls || collectTls;
  const crawlSiteImpl = deps.crawlSite || crawlSite;
  const fetchUrlImpl = deps.fetchUrl || fetchUrl;

  const dnsErrors = [];
  let resolved4 = [];
  let resolved6 = [];
  let resolvedCname = [];

  try { resolved4 = await dnsResolver.resolve4(targetHost); }
  catch (e) { dnsErrors.push({ qname: targetHost, type: 'A', message: e?.message || 'lookup-failed' }); }

  try { resolved6 = await dnsResolver.resolve6(targetHost); }
  catch (e) { dnsErrors.push({ qname: targetHost, type: 'AAAA', message: e?.message || 'lookup-failed' }); }

  try { resolvedCname = await dnsResolver.resolveCname(targetHost); }
  catch (e) { dnsErrors.push({ qname: targetHost, type: 'CNAME', message: e?.message || 'lookup-failed' }); }

  const resolved = [...resolved4, ...resolved6, ...resolvedCname];
  const resolverData = { A: resolved4, AAAA: resolved6, CNAME: resolvedCname };

  if (resolved.some(isBlockedIp)) {
    return {
      blockedReason: 'blocked-ip-range',
      resolvedHosts: buildResolvedHosts(resolverData, null),
      dnsErrors,
      errors: dnsErrors,
    };
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

  const resolvedHosts = buildResolvedHosts(resolverData, dnsData);

  const crawlSummary = {
    pagesCrawled: pages.length,
    errorCount: pages.filter((p) => p.error || p.statusCode === 0).length,
    totalBytes: pages.reduce((acc, p) => acc + Number(p.size || 0), 0),
  };

  return {
    targetHost,
    resolvedHosts,
    dnsErrors,
    errors: dnsErrors,
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
