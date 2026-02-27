const { result, compareSimple, assessFromStatus } = require('./_shared');

module.exports = {
  id: 'c12_dns_www_cname_drift',
  version: 1,
  description: 'c12 dns www cname drift',
  collect: async (ctx) => { const c=ctx.dns?.CNAME||[];return result(c.length?'stable':'warning',{cname:c},{cname:c}); },
  compare: (current, previous) => compareSimple(current?.metrics, previous?.metrics),
  assess: (current, drift) => assessFromStatus('c12_dns_www_cname_drift', current, drift),
};
