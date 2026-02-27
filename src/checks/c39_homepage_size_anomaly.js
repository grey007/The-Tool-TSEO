const { result, compareSimple, assessFromStatus } = require('./_shared');

module.exports = {
  id: 'c39_homepage_size_anomaly',
  version: 1,
  description: 'c39 homepage size anomaly',
  collect: async (ctx) => { const size=ctx.homepage?.size||0;return result(size>2*1024*1024?'warning':'stable',{size},{size}); },
  compare: (current, previous) => compareSimple(current?.metrics, previous?.metrics),
  assess: (current, drift) => assessFromStatus('c39_homepage_size_anomaly', current, drift),
};
