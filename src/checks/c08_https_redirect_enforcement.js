const { result, compareSimple, assessFromStatus } = require('./_shared');

module.exports = {
  id: 'c08_https_redirect_enforcement',
  version: 1,
  description: 'c08 https redirect enforcement',
  collect: async (ctx) => {
    try {
      const res = await ctx.fetchUrl(`http://${ctx.targetHost}/`);
      if (res.error === 'off-domain-redirect-blocked') {
        return result('unknown', { httpStatus: 0, redirectCount: res.redirectCount || 0 }, { error: res.error, finalUrl: res.finalUrl || null });
      }
      const finalUrl = res.finalUrl || res.url || '';
      const isHttps = finalUrl.startsWith(`https://${ctx.targetHost}`) || finalUrl.startsWith(`https://www.${ctx.targetHost}`);
      const status = isHttps ? 'stable' : 'warning';
      return result(status, { httpStatus: res.statusCode || 0, finalUrl, redirectCount: res.redirectCount || 0 }, { httpStatus: res.statusCode || 0, finalUrl, redirectCount: res.redirectCount || 0 });
    } catch {
      return result('warning', { httpStatus: 0, finalUrl: null, redirectCount: 0 }, { error: 'http-fetch-failed' });
    }
  },
  compare: (current, previous) => compareSimple(current?.metrics, previous?.metrics),
  assess: (current, drift) => assessFromStatus('c08_https_redirect_enforcement', current, drift),
};
