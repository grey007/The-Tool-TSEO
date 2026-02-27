const { result, compareSimple, assessFromStatus } = require('./_shared');

module.exports = {
  id: 'c21_sec_headers_core',
  version: 1,
  description: 'c21 sec headers core',
  collect: async (ctx) => { const h=ctx.homepage?.headers||{};const miss=['strict-transport-security','x-frame-options','x-content-type-options'].filter(k=>!h[k]);const s=miss.length? 'warning':'stable';return result(ctx.homepage?s:'unknown',{missing:miss},{headers:h}); },
  compare: (current, previous) => compareSimple(current?.metrics, previous?.metrics),
  assess: (current, drift) => assessFromStatus('c21_sec_headers_core', current, drift),
};
