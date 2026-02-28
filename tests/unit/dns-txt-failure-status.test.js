const test = require('node:test');
const assert = require('node:assert/strict');
const c17 = require('../../src/checks/c17_dmarc_policy_drift');
const c19 = require('../../src/checks/c19_spf_lookup_risk');

test('c17 returns unknown when DMARC TXT lookup failed', async () => {
  const ctx = {
    dns: {
      DMARC_TXT: [],
      lookupErrors: { dmarcTxt: 'timeout' },
      lookupErrorMeta: { dmarcTxt: { resolver: 'system' } },
    },
  };
  const r = await c17.collect(ctx);
  assert.equal(r.status, 'unknown');
  assert.equal(r.evidence.lookupError, 'timeout');
  assert.equal(r.evidence.resolver, 'system');
  assert.ok((r.reasonCodes || []).includes('dns_txt_lookup_failed'));
});

test('c19 returns unknown when SPF TXT lookup failed', async () => {
  const ctx = {
    dns: {
      TXT: [],
      lookupErrors: { txt: 'timeout' },
      lookupErrorMeta: { txt: { resolver: 'system' } },
    },
  };
  const r = await c19.collect(ctx);
  assert.equal(r.status, 'unknown');
  assert.equal(r.evidence.lookupError, 'timeout');
  assert.equal(r.evidence.resolver, 'system');
  assert.ok((r.reasonCodes || []).includes('dns_txt_lookup_failed'));
});

test('c17 empty DMARC TXT after successful lookup follows no-record path', async () => {
  const r = await c17.collect({ dns: { DMARC_TXT: [] } });
  assert.equal(r.status, 'warning');
  assert.equal(r.evidence.lookupError, undefined);
});

test('c19 empty SPF TXT after successful lookup follows no-record path', async () => {
  const r = await c19.collect({ dns: { TXT: [] } });
  assert.equal(r.status, 'unknown');
  assert.equal(r.evidence.lookupError, undefined);
});
