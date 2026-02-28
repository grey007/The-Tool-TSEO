const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { targetDir } = require('../../src/storage/paths');
const { readPrevious, readBaselineSnapshot } = require('../../src/storage/store');

test('corrupt latest snapshot is ignored gracefully', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'irte-corrupt-'));
  const tdir = targetDir(dir, 'example.com');
  fs.mkdirSync(tdir, { recursive: true });
  fs.writeFileSync(path.join(tdir, 'latest.json'), '{not-json');
  const prev = readPrevious(dir, 'example.com');
  assert.equal(prev, null);
});

test('missing baseline file auto-clears baseline pointer', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'irte-missing-base-'));
  const tdir = targetDir(dir, 'example.com');
  fs.mkdirSync(tdir, { recursive: true });
  fs.writeFileSync(path.join(tdir, 'baseline.json'), JSON.stringify({ ts: '2026-01-01T00:00:00.000Z', file: 'missing.json' }));
  const baseline = readBaselineSnapshot(dir, 'example.com');
  assert.equal(baseline, null);
  assert.equal(fs.existsSync(path.join(tdir, 'baseline.json')), false);
});
