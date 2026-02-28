const test = require('node:test');
const assert = require('node:assert/strict');
const { runEngine, sanitizeSnapshot } = require('../../src/core/engine');

const fixedContext = {
  targetHost: 'example.com',
  resolvedHosts: ['1.1.1.1'],
  pages: [],
  crawlSummary: { pagesCrawled: 0, totalBytes: 0 },
};

test('hanging check times out and marked unknown', async () => {
  const snapshot = await runEngine({
    targetInput: 'example.com',
    dataDir: '/tmp/nonexistent',
    profile: { name: 'balanced', limits: { maxEngineMs: 100 } },
    overrides: {
      buildContext: async () => fixedContext,
      loadChecks: () => [{
        id: 'hanging',
        collect: async () => new Promise(() => {}),
        compare: () => ({ drifted: false, changes: [] }),
        assess: () => ({ severity: 'unknown', headline: 'hanging unknown', reasonCodes: [] }),
      }],
    },
  });
  assert.equal(snapshot.checks.hanging.status, 'unknown');
  assert.equal(snapshot.checks.hanging.evidence.error, 'timeout');
});

test('engine max duration truncates remaining checks', async () => {
  const snapshot = await runEngine({
    targetInput: 'example.com',
    dataDir: '/tmp/nonexistent',
    profile: { name: 'balanced', limits: { maxEngineMs: 1 } },
    overrides: {
      buildContext: async () => fixedContext,
      loadChecks: () => [
        { id: 'a', collect: async () => ({ status: 'stable', metrics: {}, evidence: {} }), compare: () => ({ drifted: false, changes: [] }), assess: () => ({ severity: 'stable', headline: 'a', reasonCodes: [] }) },
        { id: 'b', collect: async () => ({ status: 'stable', metrics: {}, evidence: {} }), compare: () => ({ drifted: false, changes: [] }), assess: () => ({ severity: 'stable', headline: 'b', reasonCodes: [] }) },
      ],
    },
  });
  assert.equal(snapshot.target.engineTruncated, true);
  assert.equal(Object.keys(snapshot.checks).length <= 2, true);
});

test('reproducibility: two runs with identical mocked context are equal excluding run id/ts', async () => {
  const overrides = {
    buildContext: async () => fixedContext,
    loadChecks: () => [{ id: 'a', collect: async () => ({ status: 'stable', metrics: { k: 1 }, evidence: { e: 1 } }), compare: () => ({ drifted: false, changes: [] }), assess: () => ({ severity: 'stable', headline: 'a', reasonCodes: [] }) }],
    now: () => 1,
    dateNow: () => '2026-01-01T00:00:00.000Z',
  };
  const one = await runEngine({ targetInput: 'example.com', dataDir: '/tmp/nonexistent', profile: { name: 'balanced', limits: { maxEngineMs: 100 } }, overrides });
  const two = await runEngine({ targetInput: 'example.com', dataDir: '/tmp/nonexistent', profile: { name: 'balanced', limits: { maxEngineMs: 100 } }, overrides });
  assert.deepEqual(sanitizeSnapshot(one), sanitizeSnapshot(two));
});

test('snapshot includes summary alias matching rollup', async () => {
  const snapshot = await runEngine({
    targetInput: 'example.com',
    dataDir: '/tmp/nonexistent',
    profile: { name: 'balanced', limits: { maxEngineMs: 100 } },
    overrides: {
      buildContext: async () => fixedContext,
      loadChecks: () => [{
        id: 'a',
        collect: async () => ({ status: 'stable', metrics: {}, evidence: {} }),
        compare: () => ({ drifted: false, changes: [] }),
        assess: () => ({ severity: 'stable', headline: 'a', reasonCodes: [] }),
      }],
    },
  });

  assert.ok(snapshot.rollup);
  assert.ok(snapshot.summary);
  assert.deepEqual(snapshot.summary, snapshot.rollup);
});
