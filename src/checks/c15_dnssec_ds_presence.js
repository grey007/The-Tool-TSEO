const { result, compareSimple, assessFromStatus } = require('./_shared');

module.exports = {
  id: 'c15_dnssec_ds_presence',
  version: 1,
  description: 'c15 dnssec ds presence',
  collect: async (ctx) => { const ds=ctx.dns?.DS||[];return result(ds.length?'stable':'warning',{dsCount:ds.length},{ds}); },
  compare: (current, previous) => compareSimple(current?.metrics, previous?.metrics),
  assess: (current, drift) => assessFromStatus('c15_dnssec_ds_presence', current, drift),
};
