const { result, compareSimple, assessFromStatus } = require('./_shared');

module.exports = {
  id: 'c10_mixed_content_internal',
  version: 1,
  description: 'c10 mixed content internal',
  collect: async (ctx) => {
    const body = ctx.homepage?.body || '';
    const matches = [...body.matchAll(/https?:\/\/[^\s"'<>]+/g)].map((m) => m[0]);
    const internalHttp = [];
    for (const raw of matches) {
      try {
        const u = new URL(raw);
        if (u.protocol === 'http:' && (u.hostname === ctx.targetHost || u.hostname === `www.${ctx.targetHost}`)) internalHttp.push(raw);
      } catch {}
    }
    const sample = internalHttp.sort().slice(0, 5);
    return result(internalHttp.length > 0 ? 'warning' : 'stable', { mixedRefs: internalHttp.length }, { sample });
  },
  compare: (current, previous) => compareSimple(current?.metrics, previous?.metrics),
  assess: (current, drift) => assessFromStatus('c10_mixed_content_internal', current, drift),
};
