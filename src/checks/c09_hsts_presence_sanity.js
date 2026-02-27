const { result, compareSimple, assessFromStatus } = require('./_shared');

module.exports = {
  id: 'c09_hsts_presence_sanity',
  version: 1,
  description: 'c09 hsts presence sanity',
  collect: async (ctx) => { const h=ctx.homepage?.headers?.['strict-transport-security']||'';const m=/max-age=(\d+)/i.exec(h);const age=m?Number(m[1]):0;let s='warning';if(!h)s='warning';else if(age<31536000)s='warning';else s='stable';return result(s,{hsts:h,maxAge:age},{hsts:h}); },
  compare: (current, previous) => compareSimple(current?.metrics, previous?.metrics),
  assess: (current, drift) => assessFromStatus('c09_hsts_presence_sanity', current, drift),
};
