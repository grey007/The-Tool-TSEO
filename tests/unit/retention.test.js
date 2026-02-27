const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { applyRetention } = require('../../src/storage/retention');

test('retention never deletes baseline.json pointer', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'irte-ret-'));
  fs.writeFileSync(path.join(dir, 'latest.json'), '{}');
  fs.writeFileSync(path.join(dir, 'baseline.json'), '{}');
  fs.writeFileSync(path.join(dir, '2026-01-01T00-00-00+00-00.json'), '{}');
  fs.writeFileSync(path.join(dir, '2026-01-02T00-00-00+00-00.json'), '{}');
  applyRetention(dir, 1);
  assert.equal(fs.existsSync(path.join(dir, 'baseline.json')), true);
  assert.equal(fs.existsSync(path.join(dir, 'latest.json')), true);
});
