#!/usr/bin/env node
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { runEngine } = require('../src/core/engine');
const c17 = require('../src/checks/c17_dmarc_policy_drift');
const c34 = require('../src/checks/c34_canonical_offdomain');

function mockedContext({ host, canonicalHref, resolvedHosts, dns = {} }) {
  return {
    targetHost: host,
    resolvedHosts,
    dnsErrors: [],
    errors: [],
    dns,
    tls: null,
    homepage: {
      statusCode: 200,
      headers: { 'content-type': 'text/html' },
      body: `<html><head><link rel="canonical" href="${canonicalHref}"></head><body>ok</body></html>`,
      redirects: [],
      finalUrl: `https://${host}/`,
      responseTimeMs: 10,
    },
    pages: [],
    crawlSummary: { pagesCrawled: 0, totalBytes: 0 },
  };
}

async function runMockScan(targetInput, ctx) {
  return runEngine({
    targetInput,
    dataDir: '/tmp/nonexistent',
    profile: { name: 'balanced', enabledChecks: [c17.id, c34.id], limits: { maxEngineMs: 1000 } },
    overrides: {
      buildContext: async () => ctx,
      loadChecks: () => [c17, c34],
      now: () => 1,
      dateNow: () => '2026-01-01T00:00:00.000Z',
    },
  });
}

function assertSnapshotBasics(snapshot, expectedHost) {
  const parsed = JSON.parse(JSON.stringify(snapshot));
  assert.ok(parsed.checks && typeof parsed.checks === 'object', 'checks must exist');
  assert.ok(parsed.rollup && typeof parsed.rollup === 'object', 'rollup must exist');
  assert.ok(parsed.summary && typeof parsed.summary === 'object', 'summary must exist');
  assert.deepEqual(parsed.summary, parsed.rollup, 'summary must match rollup exactly');
  assert.ok(Array.isArray(parsed.rollup.secondaryRisks), 'secondaryRisks must be an array');
  for (const item of parsed.rollup.secondaryRisks) {
    assert.ok(item && typeof item === 'object', 'secondaryRisks entries must be objects');
    assert.equal(typeof item.id, 'string');
    assert.equal(typeof item.status, 'string');
  }

  assert.ok(parsed.target?.resolvedHosts && typeof parsed.target.resolvedHosts === 'object', 'target.resolvedHosts must be an object');
  const rh = parsed.target.resolvedHosts;
  for (const key of ['A', 'AAAA', 'CNAME', 'NS', 'MX', 'TXT']) {
    assert.ok(Array.isArray(rh[key]), `target.resolvedHosts.${key} must be an array`);
  }
  const nonEmptyCount = ['A', 'AAAA', 'CNAME', 'NS', 'MX', 'TXT'].reduce((n, k) => n + (rh[k].length > 0 ? 1 : 0), 0);
  assert.ok(nonEmptyCount > 0, 'target.resolvedHosts must contain at least one resolved list');
  assert.equal(parsed.target.canonical, expectedHost);
}

async function main() {
  const apple = await runMockScan('apple.com', mockedContext({
    host: 'apple.com',
    canonicalHref: 'https://www.apple.com/',
    resolvedHosts: { A: ['17.253.144.10'], AAAA: ['2a02:26f0::1234'], CNAME: [], NS: ['ns.apple.com'], MX: [], TXT: [] },
    dns: { DMARC_TXT: ['v=DMARC1; p=reject'] },
  }));

  const semrush = await runMockScan('semrush.com', mockedContext({
    host: 'semrush.com',
    canonicalHref: 'https://www.semrush.com/',
    resolvedHosts: { A: ['104.18.36.228'], AAAA: ['2606:4700::6812:24e4'], CNAME: [], NS: ['ns1.semrush.com'], MX: [], TXT: [] },
    dns: { DMARC_TXT: ['v=DMARC1; p=quarantine'] },
  }));

  assertSnapshotBasics(apple, 'apple.com');
  assertSnapshotBasics(semrush, 'semrush.com');

  assert.notEqual(apple.checks[c34.id]?.severity, 'critical', 'apple canonical www should not be critical');
  assert.notEqual(semrush.checks[c34.id]?.severity, 'critical', 'semrush canonical www should not be critical');

  const dmarcFailure = await runMockScan('apple.com', mockedContext({
    host: 'apple.com',
    canonicalHref: 'https://www.apple.com/',
    resolvedHosts: { A: ['17.253.144.10'], AAAA: [], CNAME: [], NS: [], MX: [], TXT: [] },
    dns: {
      DMARC_TXT: [],
      lookupErrors: { dmarcTxt: 'timeout' },
      lookupErrorMeta: { dmarcTxt: { resolver: 'system' } },
    },
  }));

  const dmarcCheck = dmarcFailure.checks[c17.id];
  assert.equal(dmarcCheck.status, 'unknown', 'DMARC lookup failure should be unknown status');
  assert.equal(dmarcCheck.evidence.lookupError, 'timeout', 'DMARC lookup failure should include evidence.lookupError');
  assert.ok((dmarcCheck.reasonCodes || []).includes('dns_txt_lookup_failed'), 'DMARC lookup failure should include dns_txt_lookup_failed');

  console.log('verify:e2e passed');
  console.log(`apple c34 severity: ${apple.checks[c34.id].severity}`);
  console.log(`semrush c34 severity: ${semrush.checks[c34.id].severity}`);
  console.log(`dmarc failure c17 status: ${dmarcCheck.status}`);
}

main().catch((err) => {
  console.error('verify:e2e failed');
  console.error(err);
  process.exit(1);
});
