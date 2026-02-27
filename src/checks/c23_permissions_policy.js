const { result, compareSimple, assessFromStatus } = require('./_shared');

module.exports = {
  id: 'c23_permissions_policy',
  version: 1,
  description: 'c23 permissions policy',
  collect: async (ctx) => { const v=ctx.homepage?.headers?.['permissions-policy']||'';return result(v?'stable':'warning',{value:v},{value:v}); },
  compare: (current, previous) => compareSimple(current?.metrics, previous?.metrics),
  assess: (current, drift) => assessFromStatus('c23_permissions_policy', current, drift),
};
