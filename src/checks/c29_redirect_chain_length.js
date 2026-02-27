const { result, compareSimple, assessFromStatus } = require('./_shared');

module.exports = {
  id: 'c29_redirect_chain_length',
  version: 1,
  description: 'c29 redirect chain length',
  collect: async (ctx) => { return result('stable',{maxRedirects:ctx.limits.maxRedirections},{maxRedirects:ctx.limits.maxRedirections}); },
  compare: (current, previous) => compareSimple(current?.metrics, previous?.metrics),
  assess: (current, drift) => assessFromStatus('c29_redirect_chain_length', current, drift),
};
