const { result, compareSimple, assessFromStatus } = require('./_shared');

module.exports = {
  id: 'c20_mx_record_drift',
  version: 1,
  description: 'c20 mx record drift',
  collect: async (ctx) => { const mx=ctx.dns?.MX||[];return result(mx.length?'stable':'warning',{mx},{mx}); },
  compare: (current, previous) => compareSimple(current?.metrics, previous?.metrics),
  assess: (current, drift) => assessFromStatus('c20_mx_record_drift', current, drift),
};
