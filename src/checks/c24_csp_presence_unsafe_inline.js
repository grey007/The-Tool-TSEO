const { result, compareSimple, assessFromStatus } = require('./_shared');

module.exports = {
  id: 'c24_csp_presence_unsafe_inline',
  version: 1,
  description: 'c24 csp presence unsafe inline',
  collect: async (ctx) => { const v=ctx.homepage?.headers?.['content-security-policy']||'';let s='warning';if(v&&!v.includes('unsafe-inline'))s='stable';return result(v?s:'warning',{value:v,unsafeInline:v.includes('unsafe-inline')},{value:v}); },
  compare: (current, previous) => compareSimple(current?.metrics, previous?.metrics),
  assess: (current, drift) => assessFromStatus('c24_csp_presence_unsafe_inline', current, drift),
};
