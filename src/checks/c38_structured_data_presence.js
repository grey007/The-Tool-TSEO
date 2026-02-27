const { result, compareSimple, assessFromStatus } = require('./_shared');

module.exports = {
  id: 'c38_structured_data_presence',
  version: 1,
  description: 'c38 structured data presence',
  collect: async (ctx) => { const types=[...((ctx.homepage?.body||'').matchAll(/"@type"\s*:\s*"([^"]+)"/g))].map(m=>m[1]).sort();return result('stable',{types},{types}); },
  compare: (current, previous) => compareSimple(current?.metrics, previous?.metrics),
  assess: (current, drift) => assessFromStatus('c38_structured_data_presence', current, drift),
};
