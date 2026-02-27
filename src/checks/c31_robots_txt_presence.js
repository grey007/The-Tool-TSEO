const { result, compareSimple, assessFromStatus } = require('./_shared');

module.exports = {
  id: 'c31_robots_txt_presence',
  version: 1,
  description: 'c31 robots txt presence',
  collect: async (ctx) => { const p=ctx.pages.find(x=>x.url.endsWith('/robots.txt'));const s=p&&p.statusCode===200?'stable':'warning';return result(s,{found:Boolean(p&&p.statusCode===200)},{status:p?.statusCode||0}); },
  compare: (current, previous) => compareSimple(current?.metrics, previous?.metrics),
  assess: (current, drift) => assessFromStatus('c31_robots_txt_presence', current, drift),
};
