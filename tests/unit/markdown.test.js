const test = require('node:test');
const assert = require('node:assert/strict');
const { markdownForSnapshot } = require('../../src/core/engine');

test('markdown export deterministic ordering', () => {
  const s = {
    rollup: { critical: 1, warning: 1, stable: 0, unknown: 0, mostImmediateRisk: 'A', stabilityIndex: 80 },
    checks: {
      b: { severity: 'warning', headline: 'B', reasonCodes: ['rb'], evidence: { z: 1 } },
      a: { severity: 'critical', headline: 'A', reasonCodes: ['ra'], evidence: { y: 2 } },
    },
  };
  const one = markdownForSnapshot(s);
  const two = markdownForSnapshot(s);
  assert.equal(one, two);
  assert.match(one, /\[critical\] a:/);
});
