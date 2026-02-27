const dns = require('node:dns').promises;
const { stableSort } = require('../util/normalize');

async function collectDns(host, caches) {
  if (caches?.dns?.has(host)) return caches.dns.get(host);
  const out = { A: [], AAAA: [], NS: [], MX: [], CNAME: [], SOA: null, TXT: [], DMARC_TXT: [], DS: [], CAA: [] };
  const safe = async (fn, key, map = (x) => x) => {
    try { out[key] = stableSort((await fn()).map(map)); } catch { out[key] = []; }
  };

  await safe(() => dns.resolve4(host), 'A');
  await safe(() => dns.resolve6(host), 'AAAA');
  await safe(() => dns.resolveNs(host), 'NS');
  await safe(() => dns.resolveMx(host), 'MX', (m) => `${m.priority}:${m.exchange}`);
  await safe(() => dns.resolveCname(`www.${host}`), 'CNAME');
  try { out.SOA = await dns.resolveSoa(host); } catch { out.SOA = null; }
  await safe(() => dns.resolveTxt(host), 'TXT', (v) => v.join(''));
  await safe(() => dns.resolveTxt(`_dmarc.${host}`), 'DMARC_TXT', (v) => v.join(''));
  await safe(() => dns.resolve(host, 'DS'), 'DS', (d) => JSON.stringify(d));
  await safe(() => dns.resolve(host, 'CAA'), 'CAA', (c) => `${c.critical}:${c.issue || c.issuewild || c.iodef || ''}`);

  caches?.dns?.set(host, out);
  return out;
}

module.exports = { collectDns };
