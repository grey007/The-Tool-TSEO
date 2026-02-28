const test = require('node:test');
const assert = require('node:assert/strict');
const { buildContext } = require('../../src/core/context');
const { runEngine } = require('../../src/core/engine');

const noopDeps = {
  collectDns: async () => ({ A: [], AAAA: [], CNAME: [] }),
  collectTls: async () => null,
  crawlSite: async () => [],
  fetchUrl: async () => null,
};

test('context resolves A and AAAA independently and blocks if any resolved IP is blocked', async () => {
  const dnsResolver = {
    resolve4: async () => ['8.8.8.8'],
    resolve6: async () => ['::1'],
    resolveCname: async () => [],
  };
  const ctx = await buildContext('example.com', null, null, dnsResolver, noopDeps);
  assert.equal(ctx.blockedReason, 'blocked-ip-range');
  assert.deepEqual(ctx.resolvedHosts, ['8.8.8.8', '::1']);
  assert.deepEqual(ctx.errors, []);
});

test('engine target.resolvedHosts includes A/AAAA results from dns collector', async () => {
  const dnsResolver = {
    resolve4: async () => [],
    resolve6: async () => [],
    resolveCname: async () => [],
  };
  const deps = {
    ...noopDeps,
    collectDns: async () => ({ A: ['8.8.4.4'], AAAA: ['2001:4860:4860::8844'], CNAME: [] }),
  };

  const snapshot = await runEngine({
    targetInput: 'example.com',
    dataDir: '/tmp/nonexistent',
    profile: { name: 'balanced', limits: { maxEngineMs: 100 } },
    overrides: {
      buildContext: (targetHost, comparisonSnapshot, activeProfile) => buildContext(targetHost, comparisonSnapshot, activeProfile, dnsResolver, deps),
      loadChecks: () => [],
    },
  });

  assert.deepEqual(snapshot.target.resolvedHosts, ['2001:4860:4860::8844', '8.8.4.4']);
});

test('partial lookup failures record errors while preserving successful resolved hosts', async () => {
  const dnsResolver = {
    resolve4: async () => ['8.8.8.8'],
    resolve6: async () => { throw new Error('v6-timeout'); },
    resolveCname: async () => { throw new Error('cname-servfail'); },
  };
  const deps = {
    ...noopDeps,
    collectDns: async () => ({ A: ['1.1.1.1'], AAAA: [], CNAME: ['edge.example.com'] }),
  };

  const snapshot = await runEngine({
    targetInput: 'example.com',
    dataDir: '/tmp/nonexistent',
    profile: { name: 'balanced', limits: { maxEngineMs: 100 } },
    overrides: {
      buildContext: (targetHost, comparisonSnapshot, activeProfile) => buildContext(targetHost, comparisonSnapshot, activeProfile, dnsResolver, deps),
      loadChecks: () => [],
    },
  });

  assert.deepEqual(snapshot.target.resolvedHosts, ['1.1.1.1', '8.8.8.8', 'edge.example.com']);
  assert.deepEqual(
    snapshot.target.errors.slice().sort((a, b) => a.type.localeCompare(b.type)),
    [
      { type: 'AAAA', message: 'v6-timeout' },
      { type: 'CNAME', message: 'cname-servfail' },
    ]
  );
});
