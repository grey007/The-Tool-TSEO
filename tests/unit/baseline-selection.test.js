const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { targetDir } = require('../../src/storage/paths');
const { readBaselineSnapshot } = require('../../src/storage/store');

function snap(ts) {
  return { schemaVersion: 1, run: { ts, id: '1', durationMs: 0 }, target: { canonical: 'example.com' }, rollup: { stabilityIndex: 1 }, checks: {} };
}

test('baseline snapshot preferred when pointer exists', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'irte-base-'));
  const tdir = targetDir(dir, 'example.com');
  fs.mkdirSync(tdir, { recursive: true });
  fs.writeFileSync(path.join(tdir, 'old.json'), JSON.stringify(snap('2026-01-01T00:00:00.000Z')));
  fs.writeFileSync(path.join(tdir, 'latest.json'), JSON.stringify(snap('2026-01-02T00:00:00.000Z')));
  fs.writeFileSync(path.join(tdir, 'baseline.json'), JSON.stringify({ ts: '2026-01-01T00:00:00.000Z', file: 'old.json' }));
  const baseline = readBaselineSnapshot(dir, 'example.com');
  assert.equal(baseline.ref.file, 'old.json');
  assert.equal(baseline.snapshot.run.ts, '2026-01-01T00:00:00.000Z');
});
