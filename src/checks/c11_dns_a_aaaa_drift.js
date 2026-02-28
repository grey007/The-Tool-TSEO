const { result, compareSimple, assessFromStatus } = require('./_shared');

module.exports = {
  id: 'c11_dns_a_aaaa_drift',
  version: 1,
  description: 'c11 dns a aaaa drift',
  collect: async (ctx) => { const records=[...(ctx.dns?.A||[]),...(ctx.dns?.AAAA||[])].sort();return result(records.length?'stable':'unknown',{records},{records}); },
  compare: (current, previous) => compareSimple(current?.metrics, previous?.metrics),
  assess: (current, drift) => assessFromStatus('c11_dns_a_aaaa_drift', current, drift),
};
