let fetchImpl = globalThis.fetch;

function setFetchImpl(fn) {
  fetchImpl = fn;
}

function resetFetchImpl() {
  fetchImpl = globalThis.fetch;
}

function pushHeader(out, key, value) {
  if (out[key] === undefined) {
    out[key] = value;
    return;
  }
  if (Array.isArray(out[key])) {
    out[key].push(value);
    return;
  }
  out[key] = [out[key], value];
}

function toHeadersObject(headers) {
  const out = {};
  if (!headers) return out;
  const entries = typeof headers.entries === 'function' ? [...headers.entries()] : Object.entries(headers);
  for (const [kRaw, vRaw] of entries.slice(0, 128)) {
    const k = String(kRaw).toLowerCase().slice(0, 128);
    const v = String(vRaw).slice(0, 2048);
    if (k === 'set-cookie') pushHeader(out, k, v);
    else if (out[k] === undefined) out[k] = v;
    else pushHeader(out, k, v);
  }
  return out;
}

async function fetchUrl(url, opts = {}, caches) {
  const cacheKey = `${opts.method || 'GET'}:${url}`;
  if (caches?.http?.has(cacheKey)) return caches.http.get(cacheKey);

  const {
    timeout = 6000,
    maxRedirections = 5,
    maxSize = 2 * 1024 * 1024,
    method = 'GET',
    allowHostnames = null,
  } = opts;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  const startedAt = Date.now();
  let current = url;
  let redirects = 0;
  let ttfbMs = 0;

  try {
    while (redirects <= maxRedirections) {
      const res = await fetchImpl(current, {
        method,
        redirect: 'manual',
        headers: { 'user-agent': 'IRTE/1.0', accept: 'text/html,*/*' },
        signal: controller.signal,
      });
      ttfbMs = Math.max(0, Math.round(Date.now() - startedAt));

      const location = res.headers?.get?.('location');
      if ([301, 302, 303, 307, 308].includes(res.status) && location && redirects < maxRedirections) {
        const nextUrl = new URL(location, current);
        if (allowHostnames && !allowHostnames.includes(nextUrl.hostname)) {
          const blocked = {
            url: current,
            statusCode: 0,
            error: 'off-domain-redirect-blocked',
            redirectCount: redirects + 1,
            finalUrl: nextUrl.toString(),
            headers: {},
            body: '',
            size: 0,
            bodyTruncated: false,
            timings: { dnsMs: 0, connectMs: 0, ttfbMs, totalMs: Math.round(Date.now() - startedAt) },
          };
          caches?.http?.set(cacheKey, blocked);
          return blocked;
        }
        current = nextUrl.toString();
        redirects += 1;
        continue;
      }

      let size = 0;
      const chunks = [];
      let bodyTruncated = false;
      const noBodyStatus = res.status === 204 || res.status === 304;
      if (!noBodyStatus && res.body && Symbol.asyncIterator in res.body) {
        for await (const chunk of res.body) {
          const buf = Buffer.from(chunk);
          const remaining = maxSize - size;
          if (remaining <= 0) {
            bodyTruncated = true;
            break;
          }
          if (buf.length > remaining) {
            chunks.push(buf.subarray(0, remaining));
            size += remaining;
            bodyTruncated = true;
            break;
          }
          chunks.push(buf);
          size += buf.length;
        }
      } else {
        const buf = Buffer.from(await res.arrayBuffer());
        size = Math.min(buf.length, maxSize);
        bodyTruncated = buf.length > maxSize;
        chunks.push(buf.subarray(0, size));
      }

      const output = {
        url: current,
        finalUrl: current,
        statusCode: res.status,
        error: null,
        headers: toHeadersObject(res.headers),
        body: Buffer.concat(chunks).toString('utf8'),
        size,
        bodyTruncated,
        redirectCount: redirects,
        timings: {
          dnsMs: 0,
          connectMs: 0,
          ttfbMs,
          totalMs: Math.max(ttfbMs, Math.round(Date.now() - startedAt)),
        },
      };
      caches?.http?.set(cacheKey, output);
      return output;
    }

    const redirectErr = {
      url: current,
      statusCode: 0,
      error: 'redirect-limit',
      redirectCount: redirects,
      finalUrl: current,
      headers: {},
      body: '',
      size: 0,
      bodyTruncated: false,
      timings: { dnsMs: 0, connectMs: 0, ttfbMs, totalMs: Math.round(Date.now() - startedAt) },
    };
    caches?.http?.set(cacheKey, redirectErr);
    return redirectErr;
  } finally {
    clearTimeout(timer);
  }
}

module.exports = { fetchUrl, setFetchImpl, resetFetchImpl };
