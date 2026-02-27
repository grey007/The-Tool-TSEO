const { result, compareSimple, assessFromStatus } = require('./_shared');

module.exports = {
  id: 'c33_canonical_presence',
  version: 1,
  description: 'c33 canonical presence',
  collect: async (ctx) => { const m=/(<link[^>]+rel=['"]canonical['"][^>]*>)/i.test(ctx.homepage?.body||'');return result(m?'stable':'warning',{present:m},{present:m}); },
  compare: (current, previous) => compareSimple(current?.metrics, previous?.metrics),
  assess: (current, drift) => assessFromStatus('c33_canonical_presence', current, drift),
};
