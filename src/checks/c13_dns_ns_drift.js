const { result, compareSimple, assessFromStatus } = require('./_shared');

module.exports = {
  id: 'c13_dns_ns_drift',
  version: 1,
  description: 'c13 dns ns drift',
  collect: async (ctx) => { const ns=ctx.dns?.NS||[];return result(ns.length?'stable':'unknown',{ns},{ns}); },
  compare: (current, previous) => compareSimple(current?.metrics, previous?.metrics),
  assess: (current, drift) => assessFromStatus('c13_dns_ns_drift', current, drift),
};
