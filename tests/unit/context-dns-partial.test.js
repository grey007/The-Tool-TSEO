const test = require('node:test');
const assert = require('node:assert/strict');
const { buildContext } = require('../../src/core/context');

test('context resolves A and AAAA independently and blocks if any resolved IP is blocked', async () => {
  const dnsResolver = {
    resolve4: async () => ['8.8.8.8'],
    resolve6: async () => ['::1'],
  };
  const ctx = await buildContext('example.com', null, null, dnsResolver);
  assert.equal(ctx.blockedReason, 'blocked-ip-range');
  assert.deepEqual(ctx.resolvedHosts, ['8.8.8.8', '::1']);
});

test('context still proceeds when one resolver family fails', async () => {
  const dnsResolver = {
    resolve4: async () => ['8.8.8.8'],
    resolve6: async () => { throw new Error('no-v6'); },
  };
  const ctx = await buildContext('example.com', null, { limits: { maxPages: 1, maxDepth: 0, timeout: 1 } }, dnsResolver);
  assert.equal(ctx.blockedReason, undefined);
  assert.deepEqual(ctx.resolvedHosts, ['8.8.8.8']);
});
