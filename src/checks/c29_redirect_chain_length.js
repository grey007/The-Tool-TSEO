const { result, compareSimple, assessFromStatus } = require('./_shared');

module.exports = {
  id: 'c29_redirect_chain_length',
  version: 1,
  description: 'c29 redirect chain length',
  collect: async (ctx) => {
    const observed = Number(ctx.homepage?.redirectCount || 0);
    let status = 'unknown';
    if (ctx.homepage) {
      if (observed >= 5) status = 'critical';
      else if (observed >= 3) status = 'warning';
      else status = 'stable';
    }
    return result(status, { redirectCount: observed, finalUrl: ctx.homepage?.finalUrl || null }, { redirectCount: observed, finalUrl: ctx.homepage?.finalUrl || null });
  },
  compare: (current, previous) => compareSimple(current?.metrics, previous?.metrics),
  assess: (current, drift) => assessFromStatus('c29_redirect_chain_length', current, drift),
};
