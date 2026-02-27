const test = require('node:test');
const assert = require('node:assert/strict');
const check = require('../../src/checks/c40_response_time_avg_volatility');

test('response time average is computed from page timings', async () => {
  const ctx = {
    homepage: { timings: { totalMs: 3000 } },
    pages: [{ timingMs: 6000 }, { timingMs: 3000 }],
    previousSnapshot: { checks: { c40_response_time_avg_volatility: { metrics: { avgMs: 2000 } } } },
  };
  const r = await check.collect(ctx);
  assert.equal(r.metrics.avgMs, 4000);
  assert.equal(r.metrics.sampleCount, 3);
  assert.equal(r.status, 'warning');
});
