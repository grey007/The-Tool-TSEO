const test = require('node:test');
const assert = require('node:assert/strict');
const { stableSort, stableObject } = require('../../src/util/normalize');

test('stable sort and object order deterministic', () => {
  assert.deepEqual(stableSort(['b', 'a', 'a']), ['a', 'b']);
  assert.deepEqual(Object.keys(stableObject({ z: 1, a: { d: 1, c: 2 } })), ['a', 'z']);
});
