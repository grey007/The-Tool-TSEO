const net = require('node:net');
const { result, compareSimple, assessFromStatus } = require('./_shared');

// Minimal deterministic public-suffix handling for common 2-level suffixes.
const TWO_LEVEL_SUFFIXES = new Set([
  'co.uk', 'org.uk', 'gov.uk', 'ac.uk',
  'com.au', 'net.au', 'org.au',
  'co.jp', 'ne.jp', 'or.jp',
  'co.nz',
]);

function registrableDomain(host) {
  const h = String(host || '').toLowerCase().replace(/\.$/, '');
  if (!h) return '';
  if (net.isIP(h)) return h;

  const parts = h.split('.').filter(Boolean);
  if (parts.length <= 2) return h;

  const suffix2 = `${parts[parts.length - 2]}.${parts[parts.length - 1]}`;
  if (TWO_LEVEL_SUFFIXES.has(suffix2) && parts.length >= 3) {
    return parts.slice(-3).join('.');
  }
  return parts.slice(-2).join('.');
}

module.exports = {
  id: 'c34_canonical_offdomain',
  version: 1,
  description: 'c34 canonical offdomain',
  collect: async (ctx) => {
    const body = ctx.homepage?.body || '';
    const m = body.match(/rel=['"]canonical['"][^>]*href=['"]([^'"]+)/i);
    if (!m) return result('unknown', { canonical: null }, { canonical: null });

    try {
      const u = new URL(m[1], `https://${ctx.targetHost}`);
      const targetRoot = registrableDomain(ctx.targetHost);
      const canonicalRoot = registrableDomain(u.hostname);
      const status = targetRoot && canonicalRoot && targetRoot === canonicalRoot ? 'stable' : 'critical';
      return result(status, { canonical: m[1] }, { canonical: m[1] });
    } catch {
      return result('warning', { canonical: m[1] }, { canonical: m[1] });
    }
  },
  compare: (current, previous) => compareSimple(current?.metrics, previous?.metrics),
  assess: (current, drift) => assessFromStatus('c34_canonical_offdomain', current, drift),
};
