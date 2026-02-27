const { result, compareSimple, assessFromStatus } = require('./_shared');

module.exports = {
  id: 'c14_dns_soa_serial',
  version: 1,
  description: 'c14 dns soa serial',
  collect: async (ctx) => { const serial=ctx.dns?.SOA?.serial||null;return result(serial?'stable':'unknown',{serial},{soa:ctx.dns?.SOA||null}); },
  compare: (current, previous) => compareSimple(current?.metrics, previous?.metrics),
  assess: (current, drift) => assessFromStatus('c14_dns_soa_serial', current, drift),
};
