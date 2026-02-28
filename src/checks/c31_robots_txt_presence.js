const { result, compareSimple, assessFromStatus } = require('./_shared');

module.exports = {
  id: 'c31_robots_txt_presence',
  version: 1,
  description: 'c31 robots txt presence',
  collect: async (ctx) => {
    try {
      const res = await ctx.fetchUrl(`https://${ctx.targetHost}/robots.txt`);
      if (res.error) return result('unknown', { found: false, statusCode: 0 }, { error: res.error });
      const found = res.statusCode === 200;
      return result(found ? 'stable' : 'warning', { found, statusCode: res.statusCode || 0 }, { statusCode: res.statusCode || 0, finalUrl: res.finalUrl || null });
    } catch {
      return result('unknown', { found: false, statusCode: 0 }, { error: 'robots-fetch-failed' });
    }
  },
  compare: (current, previous) => compareSimple(current?.metrics, previous?.metrics),
  assess: (current, drift) => assessFromStatus('c31_robots_txt_presence', current, drift),
};
