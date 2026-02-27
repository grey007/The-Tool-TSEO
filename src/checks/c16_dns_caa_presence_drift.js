const { result, compareSimple, assessFromStatus } = require('./_shared');

module.exports = {
  id: 'c16_dns_caa_presence_drift',
  version: 1,
  description: 'c16 dns caa presence drift',
  collect: async (ctx) => { const caa=ctx.dns?.CAA||[];return result(caa.length?'stable':'warning',{caa},{caa}); },
  compare: (current, previous) => compareSimple(current?.metrics, previous?.metrics),
  assess: (current, drift) => assessFromStatus('c16_dns_caa_presence_drift', current, drift),
};
