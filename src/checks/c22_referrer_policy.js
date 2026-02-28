const { result, compareSimple, assessFromStatus } = require('./_shared');

module.exports = {
  id: 'c22_referrer_policy',
  version: 1,
  description: 'c22 referrer policy',
  collect: async (ctx) => { const v=ctx.homepage?.headers?.['referrer-policy']||'';return result(v?'stable':'warning',{value:v},{value:v}); },
  compare: (current, previous) => compareSimple(current?.metrics, previous?.metrics),
  assess: (current, drift) => assessFromStatus('c22_referrer_policy', current, drift),
};
