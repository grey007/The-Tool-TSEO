const { result, compareSimple, assessFromStatus } = require('./_shared');

module.exports = {
  id: 'c37_homepage_title_missing',
  version: 1,
  description: 'c37 homepage title missing',
  collect: async (ctx) => { const ok=/<title>[^<]+<\/title>/i.test(ctx.homepage?.body||'');return result(ok?'stable':'warning',{hasTitle:ok},{hasTitle:ok}); },
  compare: (current, previous) => compareSimple(current?.metrics, previous?.metrics),
  assess: (current, drift) => assessFromStatus('c37_homepage_title_missing', current, drift),
};
