const test = require('node:test');
const assert = require('node:assert/strict');
const { buildContext } = require('../../src/core/context');
const { runEngine } = require('../../src/core/engine');

const noopDeps = {
  collectDns: async () => ({ A: [], AAAA: [], CNAME: [], NS: [], MX: [], TXT: [] }),
  collectTls: async () => null,
  fetchUrl: async () => null,
  crawlSite: async () => [],
};

test('context resolves A and AAAA independently and blocks if any resolved IP is blocked', async () => {
  const dnsResolver = {
    resolve4: async () => ['8.8.8.8'],
    resolve6: async () => ['::1'],
    resolveCname: async () => [],
  };
  const ctx = await buildContext('example.com', null, null, dnsResolver, noopDeps);
  assert.equal(ctx.blockedReason, 'blocked-ip-range');
  assert.deepEqual(ctx.resolvedHosts, {
    A: ['8.8.8.8'],
    AAAA: ['::1'],
    CNAME: [],
    NS: [],
    MX: [],
    TXT: [],
  });
  assert.deepEqual(ctx.dnsErrors, []);
});

test('engine target.resolvedHosts includes A+AAAA success', async () => {
  const dnsResolver = {
    resolve4: async () => ['8.8.4.4'],
    resolve6: async () => ['2001:4860:4860::8844'],
    resolveCname: async () => [],
  };
  const deps = {
    ...noopDeps,
    collectDns: async () => ({ NS: ['ns1.example.com'], MX: [{ exchange: 'mail.example.com' }], TXT: ['v=spf1 -all'] }),
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

  assert.deepEqual(snapshot.target.resolvedHosts, {
    A: ['8.8.4.4'],
    AAAA: ['2001:4860:4860::8844'],
    CNAME: [],
    NS: ['ns1.example.com'],
    MX: ['mail.example.com'],
    TXT: ['v=spf1 -all'],
  });
  assert.deepEqual(snapshot.target.dnsErrors, []);
});

test('partial fail records results + dnsErrors without collapsing output', async () => {
  const dnsResolver = {
    resolve4: async () => ['8.8.8.8'],
    resolve6: async () => { throw new Error('v6-timeout'); },
    resolveCname: async () => { throw new Error('cname-servfail'); },
  };
  const deps = {
    ...noopDeps,
    collectDns: async () => ({ A: ['1.1.1.1'], AAAA: [], CNAME: ['edge.example.com'], NS: [], MX: [], TXT: [] }),
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

  assert.deepEqual(snapshot.target.resolvedHosts, {
    A: ['1.1.1.1', '8.8.8.8'],
    AAAA: [],
    CNAME: ['edge.example.com'],
    NS: [],
    MX: [],
    TXT: [],
  });
  assert.deepEqual(
    snapshot.target.dnsErrors.slice().sort((a, b) => a.type.localeCompare(b.type)),
    [
      { qname: 'example.com', type: 'AAAA', message: 'v6-timeout' },
      { qname: 'example.com', type: 'CNAME', message: 'cname-servfail' },
    ]
  );
});
