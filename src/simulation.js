function createRng(seed) {
  let a = (Number(seed) || 0x9e3779b9) >>> 0;
  return function rand() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function percentile(sorted, p) {
  if (!sorted.length) return 0;
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.floor((sorted.length - 1) * p)));
  return sorted[idx];
}

function simulateBankroll({
  returns,
  bankroll,
  betSize,
  trials,
  spinsPerTrial,
  seed = 12345,
}) {
  const values = Array.isArray(returns) ? returns.slice() : [];
  if (!values.length) {
    return {
      ruinProbability: 1,
      medianFinalEquity: 0,
      percentile5FinalEquity: 0,
      percentile95FinalEquity: 0,
      expectedMaxDrawdown: 1,
      maxDrawdownPercentiles: { p50: 1, p95: 1, p99: 1 },
    };
  }

  const tCount = Math.max(1, Math.floor(Number(trials) || 1));
  const sCount = Math.max(1, Math.floor(Number(spinsPerTrial) || 1));
  const startBankroll = Number(bankroll) || 0;
  const stake = Number(betSize) || 0;

  const rand = createRng(seed);
  const finals = [];
  const drawdowns = [];
  let ruins = 0;

  for (let t = 0; t < tCount; t += 1) {
    let equity = startBankroll;
    let peak = equity;
    let maxDrawdown = 0;

    for (let s = 0; s < sCount; s += 1) {
      const i = Math.floor(rand() * values.length);
      equity += values[i] * stake;
      if (equity <= 0) {
        equity = 0;
        maxDrawdown = 1;
        ruins += 1;
        break;
      }

      if (equity > peak) peak = equity;
      if (peak > 0) {
        const dd = (peak - equity) / peak;
        if (dd > maxDrawdown) maxDrawdown = dd;
      }
    }

    finals.push(equity);
    drawdowns.push(maxDrawdown);
  }

  finals.sort((a, b) => a - b);
  drawdowns.sort((a, b) => a - b);

  const expectedMaxDrawdown = drawdowns.reduce((sum, d) => sum + d, 0) / drawdowns.length;

  return {
    ruinProbability: ruins / tCount,
    medianFinalEquity: percentile(finals, 0.5),
    percentile5FinalEquity: percentile(finals, 0.05),
    percentile95FinalEquity: percentile(finals, 0.95),
    expectedMaxDrawdown,
    maxDrawdownPercentiles: {
      p50: percentile(drawdowns, 0.5),
      p95: percentile(drawdowns, 0.95),
      p99: percentile(drawdowns, 0.99),
    },
  };
}

module.exports = { simulateBankroll };
