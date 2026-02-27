const { result, compareSimple, assessFromStatus } = require('./_shared');

module.exports = {
  id: 'c07_tls_ocsp_stapling',
  version: 1,
  description: 'c07 tls ocsp stapling',
  collect: async (ctx) => { const h=ctx.homepage?.headers||{};const has=Boolean(h['ocsp-response']);return result(has?'stable':'warning',{ocspStapled:has},{headers:Object.keys(h)}); },
  compare: (current, previous) => compareSimple(current?.metrics, previous?.metrics),
  assess: (current, drift) => assessFromStatus('c07_tls_ocsp_stapling', current, drift),
};
