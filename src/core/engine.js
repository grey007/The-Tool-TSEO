const { normalizeHost, stableObject } = require('../util/normalize');
const { buildContext } = require('./context');
const { loadChecks } = require('./registry');
const { readPrevious, readBaselineSnapshot } = require('../storage/store');
const { scoreChecks } = require('../scoring/score');
const { buildDrift } = require('../drift/diff');
const { schemaVersion } = require('../storage/schema');

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), ms);
    promise.then((v) => { clearTimeout(timer); resolve(v); }).catch((e) => { clearTimeout(timer); reject(e); });
  });
}

function sanitizeSnapshot(snapshot) {
  const out = JSON.parse(JSON.stringify(snapshot));
  if (out.run) {
    delete out.run.id;
    delete out.run.ts;
    delete out.run.durationMs;
  }
  if (out.meta) delete out.meta.totalDurationMs;
  return out;
}

async function runEngine({ targetInput, dataDir, profile, overrides = {} }) {
  const started = Date.now();
  const canonical = normalizeHost(targetInput);
  if (!canonical) throw new Error('invalid-target');
  const previous = readPrevious(dataDir, canonical);
  const baseline = readBaselineSnapshot(dataDir, canonical);
  const comparison = baseline?.snapshot || previous;
  const baselineUsed = Boolean(baseline?.snapshot);

  const buildContextImpl = overrides.buildContext || buildContext;
  const loadChecksImpl = overrides.loadChecks || loadChecks;
  const nowFn = overrides.now || (() => Date.now());
  const dateFn = overrides.dateNow || (() => new Date().toISOString());

  const ctx = await buildContextImpl(canonical, comparison, profile);
  if (ctx.blockedReason) {
    const blockedRollup = { critical: 1, warning: 0, stable: 0, unknown: 0, stabilityIndex: 0, mostImmediateRisk: 'Target blocked by SSRF safety policy.', secondaryRisks: [] };
    return {
      schemaVersion,
      engine: { name: 'IRTE', version: '1.0.0', build: 'local' },
      run: { id: String(nowFn()), ts: dateFn(), durationMs: 0 },
      target: {
        input: targetInput,
        canonical,
        resolvedHosts: ctx.resolvedHosts || [],
        errors: ctx.errors || [],
        blockedReason: ctx.blockedReason,
        baselineUsed,
        baselineRef: baselineUsed ? baseline.ref : undefined,
        engineTruncated: false,
      },
      checks: {},
      meta: { version: '1.0.0', totalPages: 0, totalBytes: 0, totalDurationMs: 0 },
      rollup: blockedRollup,
      summary: blockedRollup,
    };
  }

  const checks = {};
  const checkModules = loadChecksImpl(profile?.enabledChecks || null);
  const maxEngineMs = Number(profile?.limits?.maxEngineMs || 60000);
  const perCheckTimeoutMs = Math.min(5000, maxEngineMs);
  let engineTruncated = false;

  for (const mod of checkModules) {
    if ((Date.now() - started) >= maxEngineMs) {
      engineTruncated = true;
      break;
    }

    let current;
    try {
      current = await withTimeout(Promise.resolve(mod.collect(ctx)), perCheckTimeoutMs);
    } catch (e) {
      if ((e.message || '') === 'timeout') current = { status: 'unknown', metrics: {}, evidence: { error: 'timeout' } };
      else current = { status: 'unknown', metrics: {}, evidence: { error: 'collect-failed' } };
    }
    const prev = comparison?.checks?.[mod.id];
    let drift = { drifted: false, changes: [] };
    try { drift = mod.compare(current, prev); } catch {}
    let assessed;
    try { assessed = mod.assess(current, drift); } catch { assessed = { severity: 'unknown', headline: `${mod.id} unknown`, reasonCodes: ['assess-failed'] }; }
    checks[mod.id] = { ...current, ...assessed, drift };
  }

  const rollup = scoreChecks(checks);
  const totalDurationMs = Math.max(0, Date.now() - started);
  const snapshot = stableObject({
    schemaVersion,
    engine: { name: 'IRTE', version: '1.0.0', build: 'local' },
    run: { id: String(nowFn()), ts: dateFn(), durationMs: totalDurationMs },
    target: {
      input: targetInput,
      canonical,
      resolvedHosts: ctx.resolvedHosts || [],
      errors: ctx.errors || [],
      baselineUsed,
      baselineRef: baselineUsed ? baseline.ref : undefined,
      engineTruncated,
    },
    checks,
    meta: {
      version: '1.0.0',
      totalPages: Number(ctx.crawlSummary?.pagesCrawled || 0),
      totalBytes: Number(ctx.crawlSummary?.totalBytes || 0),
      totalDurationMs,
    },
    rollup,
    summary: rollup,
    profile: { name: profile?.name || 'balanced' },
  });
  snapshot.drift = buildDrift(snapshot, comparison);
  return snapshot;
}

function markdownForSnapshot(snapshot) {
  const checks = Object.entries(snapshot.checks)
    .sort((a, b) => {
      const sevRank = { critical: 3, warning: 2, stable: 1, unknown: 0 };
      return (sevRank[b[1].severity] - sevRank[a[1].severity]) || a[0].localeCompare(b[0]);
    })
    .slice(0, 10);
  const lines = [
    '# IRTE Export',
    '',
    '## Executive Snapshot',
    '',
    `- Critical: ${snapshot.rollup.critical}`,
    `- Warning: ${snapshot.rollup.warning}`,
    `- Stable: ${snapshot.rollup.stable}`,
    `- Unknown: ${snapshot.rollup.unknown}`,
    `- Most Immediate Risk: ${snapshot.rollup.mostImmediateRisk}`,
    `- Infrastructure Stability Index: ${snapshot.rollup.stabilityIndex}/100`,
    '',
    '## Top Findings',
    '',
  ];
  for (const [id, c] of checks) {
    lines.push(`- [${c.severity}] ${id}: ${c.headline}`);
    lines.push(`  - reasonCodes: ${(c.reasonCodes || []).slice().sort().join(', ')}`);
    const evidenceKeys = Object.keys(c.evidence || {}).sort().slice(0, 3);
    lines.push(`  - evidence: ${evidenceKeys.map((k) => `${k}=${JSON.stringify(c.evidence[k])}`).join('; ')}`);
  }
  return `${lines.join('\n')}\n`;
}

module.exports = { runEngine, markdownForSnapshot, sanitizeSnapshot };
