const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeHost, isBlockedHostname, isBlockedIp } = require('../../src/util/normalize');

test('normalize host and block internal ranges', () => {
  assert.equal(normalizeHost('https://Example.com/path'), 'example.com');
  assert.equal(isBlockedHostname('localhost'), true);
  assert.equal(isBlockedIp('127.0.0.1'), true);
  assert.equal(isBlockedIp('169.254.169.254'), true);
  assert.equal(isBlockedIp('8.8.8.8'), false);
});
