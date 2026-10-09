// Only the CI build runner sets this preload; production Next config stays unchanged.
const assert = require('node:assert/strict')
assert.equal(process.env.DATABASE_URL, 'postgresql://fixture:fixture@ci-build.invalid/neondb')
const endpoint = new URL(process.env.CI_DATABASE_ENDPOINT)
assert.equal(endpoint.hostname, '127.0.0.1')
const originalFetch = globalThis.fetch
globalThis.fetch = (input, options) => {
  const url = new URL(typeof input === 'string' ? input : input.url ?? input)
  if (url.hostname === 'api.invalid') {
    assert.equal(url.pathname, '/sql')
    // Discard Neon connection headers so this transport never forwards credentials.
    return originalFetch(endpoint, { method: 'POST', body: options.body })
  }
  assert.ok(!url.hostname.endsWith('.neon.tech'), 'CI must not contact a real Neon database')
  assert.ok(['GET', 'HEAD'].includes(options?.method ?? 'GET'), 'CI must not send external writes')
  return originalFetch(input, options)
}
