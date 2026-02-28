const { result, compareSimple, assessFromStatus } = require('./_shared');

module.exports = {
  id: 'c30_status_code_stability',
  version: 1,
  description: 'c30 status code stability',
  collect: async (ctx) => { const code=ctx.homepage?.statusCode||0;const s=code===200||code===301||code===302?'stable':'warning';return result(ctx.homepage?s:'unknown',{statusCode:code},{statusCode:code}); },
  compare: (current, previous) => compareSimple(current?.metrics, previous?.metrics),
  assess: (current, drift) => assessFromStatus('c30_status_code_stability', current, drift),
};
