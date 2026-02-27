const { result, compareSimple, assessFromStatus } = require('./_shared');

module.exports = {
  id: 'c36_internal_4xx_increase',
  version: 1,
  description: 'c36 internal 4xx increase',
  collect: async (ctx) => { const c=ctx.pages.filter(p=>String(p.statusCode).startsWith('4')).length;const prev=ctx.previousSnapshot?.checks?.c35_internal_4xx_count?.metrics?.count||0;const s=c>prev?'warning':'stable';return result(s,{count:c,previous:prev},{count:c,previous:prev}); },
  compare: (current, previous) => compareSimple(current?.metrics, previous?.metrics),
  assess: (current, drift) => assessFromStatus('c36_internal_4xx_increase', current, drift),
};
