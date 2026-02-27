const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

function setupEnv() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'irte-cli-'));
  const local = path.join(root, 'localapp');
  const data = path.join(root, 'data');
  fs.mkdirSync(path.join(local, 'IRTE'), { recursive: true });
  fs.mkdirSync(data, { recursive: true });
  const cfg = {
    dataDir: data,
    defaultProfile: 'balanced',
    profiles: { customs: {} },
    targets: { sets: {} },
  };
  fs.writeFileSync(path.join(local, 'IRTE', 'config.json'), JSON.stringify(cfg, null, 2));
  return { root, local, data, env: { ...process.env, LOCALAPPDATA: local, IRTE_LOG_LEVEL: 'silent' } };
}

test('help command works deterministically', () => {
  const { env } = setupEnv();
  const r = spawnSync('node', ['bin/irte.js', '--help'], { encoding: 'utf8', env });
  assert.equal(r.status, 0);
  assert.match(r.stdout, /IRTE - Infrastructure Risk Trigger Engine/);
});

test('doctor command runs and prints pass/warn summary', () => {
  const { env } = setupEnv();
  const r = spawnSync('node', ['bin/irte.js', 'doctor'], { encoding: 'utf8', env });
  assert.equal(r.status, 0);
  assert.match(r.stdout, /PASS:/);
  assert.match(r.stdout, /WARN:/);
});

test('stats command aggregates stored snapshots', () => {
  const { env, data } = setupEnv();
  const tdir = path.join(data, 'runs', 'example.com');
  fs.mkdirSync(tdir, { recursive: true });
  const mk = (idx, ts) => ({ schemaVersion: 1, engine: { name: 'IRTE', version: '1.0.0', build: 'local' }, run: { id: '1', ts, durationMs: 1 }, target: { canonical: 'example.com' }, checks: {}, rollup: { critical: 0, warning: 0, stable: 1, unknown: 0, stabilityIndex: idx, mostImmediateRisk: 'none', secondaryRisks: [] }, meta: { version: '1.0.0', totalPages: 0, totalBytes: 0, totalDurationMs: 1 } });
  fs.writeFileSync(path.join(tdir, '2026-01-02T00-00-00+00-00.json'), JSON.stringify(mk(80, '2026-01-02T00:00:00.000Z')));
  fs.writeFileSync(path.join(tdir, '2026-01-01T00-00-00+00-00.json'), JSON.stringify(mk(60, '2026-01-01T00:00:00.000Z')));
  const r = spawnSync('node', ['bin/irte.js', 'stats', '--target', 'example.com'], { encoding: 'utf8', env });
  assert.equal(r.status, 0);
  const out = JSON.parse(r.stdout);
  assert.equal(out.totalRuns, 2);
  assert.equal(out.lastIndex, 80);
  assert.equal(out.avgIndexLast10, 70);
});
