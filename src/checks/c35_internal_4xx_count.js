const { result, compareSimple, assessFromStatus } = require('./_shared');

module.exports = {
  id: 'c35_internal_4xx_count',
  version: 1,
  description: 'c35 internal 4xx count',
  collect: async (ctx) => {
    if (!Array.isArray(ctx.pages)) return result('unknown', { count: 0 }, { count: 0 });
    const count = ctx.pages.filter((p) => String(p.statusCode).startsWith('4')).length;
    return result(count > 0 ? 'warning' : 'stable', { count }, { count });
  },
  compare: (current, previous) => compareSimple(current?.metrics, previous?.metrics),
  assess: (current, drift) => assessFromStatus('c35_internal_4xx_count', current, drift),
};
