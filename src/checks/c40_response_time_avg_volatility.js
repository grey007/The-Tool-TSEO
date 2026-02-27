const { result, compareSimple, assessFromStatus } = require('./_shared');

module.exports = {
  id: 'c40_response_time_avg_volatility',
  version: 1,
  description: 'c40 response time avg volatility',
  collect: async (ctx) => {
    const samples = [ctx.homepage, ...(ctx.pages || [])]
      .map((p) => Number(p?.timings?.totalMs ?? p?.timingMs ?? 0))
      .filter((n) => Number.isFinite(n) && n > 0);
    if (samples.length === 0) return result('unknown', { avgMs: 0, prevAvgMs: 0, sampleCount: 0 }, { avgMs: 0, prevAvgMs: 0, sampleCount: 0 });

    const avgMs = Math.round(samples.reduce((a, b) => a + b, 0) / samples.length);
    const prevAvgMs = Number(ctx.previousSnapshot?.checks?.c40_response_time_avg_volatility?.metrics?.avgMs || 0);
    const increased40 = prevAvgMs > 0 && avgMs > Math.round(prevAvgMs * 1.4);
    let status = 'stable';
    if (avgMs > 8000 && increased40) status = 'critical';
    else if (avgMs > 4000 || increased40) status = 'warning';

    return result(status, { avgMs, prevAvgMs, sampleCount: samples.length }, { avgMs, prevAvgMs, sampleCount: samples.length });
  },
  compare: (current, previous) => compareSimple(current?.metrics, previous?.metrics),
  assess: (current, drift) => assessFromStatus('c40_response_time_avg_volatility', current, drift),
};
