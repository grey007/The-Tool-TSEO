const test = require('node:test');
const assert = require('node:assert/strict');
const { fetchUrl, setFetchImpl, resetFetchImpl } = require('../../src/collectors/httpClient');

function makeHeaders(obj) {
  const map = new Map(Object.entries(obj));
  return { get: (k) => map.get(k.toLowerCase()) || map.get(k), entries: () => map.entries() };
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
