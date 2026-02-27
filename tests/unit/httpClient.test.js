const test = require('node:test');
const assert = require('node:assert/strict');
const { fetchUrl, setFetchImpl, resetFetchImpl } = require('../../src/collectors/httpClient');

function makeHeaders(objOrEntries) {
  const entries = Array.isArray(objOrEntries) ? objOrEntries : Object.entries(objOrEntries);
  const map = new Map(entries);
  return { get: (k) => map.get(k.toLowerCase()) || map.get(k), entries: () => entries[Symbol.iterator]() };
}

test('http client blocks off-domain redirects', async () => {
  let calls = 0;
  setFetchImpl(async () => {
    calls += 1;
    return {
      status: 301,
      headers: makeHeaders({ location: 'https://evil.example/path' }),
      body: null,
      arrayBuffer: async () => new ArrayBuffer(0),
    };
  });

  const res = await fetchUrl('https://example.com', { allowHostnames: ['example.com'] });
  assert.equal(calls, 1);
  assert.equal(res.statusCode, 0);
  assert.equal(res.error, 'off-domain-redirect-blocked');
  resetFetchImpl();
});


test('http client preserves repeated set-cookie headers as array', async () => {
  setFetchImpl(async () => ({
    status: 200,
    headers: makeHeaders([['set-cookie', 'a=1; Secure'], ['set-cookie', 'b=2; HttpOnly']]),
    body: null,
    arrayBuffer: async () => new TextEncoder().encode('ok').buffer,
  }));

  const res = await fetchUrl('https://example.com/cookies', {}, null);
  assert.deepEqual(res.headers['set-cookie'], ['a=1; Secure', 'b=2; HttpOnly']);
  resetFetchImpl();
});
