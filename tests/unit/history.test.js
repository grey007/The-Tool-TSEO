const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { listSnapshots } = require('../../src/storage/store');
const { targetDir } = require('../../src/storage/paths');

test('history ordering deterministic newest to oldest', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'irte-hist-'));
  const tdir = targetDir(dir, 'example.com');
  fs.mkdirSync(tdir, { recursive: true });
  fs.writeFileSync(path.join(tdir, '2026-01-01T00-00-00+00-00.json'), '{}');
  fs.writeFileSync(path.join(tdir, '2026-01-03T00-00-00+00-00.json'), '{}');
  fs.writeFileSync(path.join(tdir, '2026-01-02T00-00-00+00-00.json'), '{}');
  assert.deepEqual(listSnapshots(dir, 'example.com'), [
    '2026-01-03T00-00-00+00-00.json',
    '2026-01-02T00-00-00+00-00.json',
    '2026-01-01T00-00-00+00-00.json',
  ]);
});
