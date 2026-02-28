const test = require('node:test');
const assert = require('node:assert/strict');
const c17 = require('../../src/checks/c17_dmarc_policy_drift');
const c18 = require('../../src/checks/c18_dmarc_alignment_drift');

test('dmarc checks use _dmarc TXT source', async () => {
  const ctx = {
    dns: {
      TXT: ['v=DMARC1; p=none'],
      DMARC_TXT: ['v=DMARC1; p=reject; adkim=s; aspf=s'],
    },
  };
  const r17 = await c17.collect(ctx);
  const r18 = await c18.collect(ctx);
  assert.equal(r17.metrics.policy, 'reject');
  assert.equal(r17.status, 'stable');
  assert.equal(r18.status, 'stable');
});
