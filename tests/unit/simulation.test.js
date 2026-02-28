const test = require('node:test');
const assert = require('node:assert/strict');
const { simulateBankroll } = require('../../src/simulation');

test('simulation is deterministic with fixed seed', () => {
  const params = {
    returns: [-1, 1],
    bankroll: 100,
    betSize: 1,
    trials: 500,
    spinsPerTrial: 200,
    seed: 42,
  };

  const one = simulateBankroll(params);
  const two = simulateBankroll(params);
  assert.deepEqual(one, two);
});

test('synthetic zero-return distribution preserves equity', () => {
  const out = simulateBankroll({
    returns: [0],
    bankroll: 1000,
    betSize: 5,
    trials: 100,
    spinsPerTrial: 500,
    seed: 1,
  });

  assert.equal(out.ruinProbability, 0);
  assert.equal(out.medianFinalEquity, 1000);
  assert.equal(out.percentile5FinalEquity, 1000);
  assert.equal(out.percentile95FinalEquity, 1000);
  assert.equal(out.expectedMaxDrawdown, 0);
});

test('ruin probability sanity check for always-losing returns', () => {
  const out = simulateBankroll({
    returns: [-1],
    bankroll: 10,
    betSize: 1,
    trials: 100,
    spinsPerTrial: 50,
    seed: 9,
  });

  assert.equal(out.ruinProbability, 1);
  assert.equal(out.medianFinalEquity, 0);
  assert.equal(out.maxDrawdownPercentiles.p50, 1);
});
