const { result, compareSimple, assessFromStatus } = require('./_shared');

module.exports = {
  id: 'c27_cache_control_anomaly',
  version: 1,
  description: 'c27 cache control anomaly',
  collect: async (ctx) => { const v=ctx.homepage?.headers?.['cache-control']||'';const s=/no-store/i.test(v)?'warning':'stable';return result(ctx.homepage?s:'unknown',{value:v},{value:v}); },
  compare: (current, previous) => compareSimple(current?.metrics, previous?.metrics),
  assess: (current, drift) => assessFromStatus('c27_cache_control_anomaly', current, drift),
};
