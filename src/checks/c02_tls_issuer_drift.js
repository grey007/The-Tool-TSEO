const { result, compareSimple, assessFromStatus } = require('./_shared');

module.exports = {
  id: 'c02_tls_issuer_drift',
  version: 1,
  description: 'c02 tls issuer drift',
  collect: async (ctx) => { const issuer=JSON.stringify(ctx.tls?.cert?.issuer||{});const prev=ctx.previousSnapshot?.checks?.c02_tls_issuer_drift?.metrics?.issuer||'';const s=!issuer?'unknown':(prev&&prev!==issuer?'warning':'stable');return result(s,{issuer},{issuerObj:ctx.tls?.cert?.issuer||{}}); },
  compare: (current, previous) => compareSimple(current?.metrics, previous?.metrics),
  assess: (current, drift) => assessFromStatus('c02_tls_issuer_drift', current, drift),
};
