const { result, compareSimple, assessFromStatus } = require('./_shared');

module.exports = {
  id: 'c28_compression_support',
  version: 1,
  description: 'c28 compression support',
  collect: async (ctx) => { const e=ctx.homepage?.headers?.['content-encoding']||'';return result('stable',{encoding:e||'none'},{encoding:e}); },
  compare: (current, previous) => compareSimple(current?.metrics, previous?.metrics),
  assess: (current, drift) => assessFromStatus('c28_compression_support', current, drift),
};
