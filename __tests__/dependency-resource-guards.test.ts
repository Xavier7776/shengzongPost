import { execFileSync } from 'node:child_process'
import { expect, it } from 'vitest'

it('bounds dependency resource attacks without terminating the application process', () => {
  // Keep an accidental vulnerable lockfile from hanging the test runner itself.
  const result = execFileSync(process.execPath, ['-e', `
    const assert = require('node:assert/strict')
    const { createRequire } = require('node:module')
    const fromEstree = createRequire(require.resolve('@typescript-eslint/typescript-estree'))
    const { minimatch, Minimatch } = fromEstree('minimatch')
    // The scoped override must retain typescript-estree's named minimatch + dot option API.
    assert.equal(minimatch('src/.config.ts', '**/*.ts', { dot: true }), true)
    assert.equal(minimatch('src/config.js', '**/*.ts', { dot: true }), false)
    new Minimatch('**/../'.repeat(30) + 'file.ts', { optimizationLevel: 2 })
    const { customAlphabet, customRandom } = require('nanoid')
    assert.equal(customAlphabet('abc', 0)(), '')
    assert.equal(customAlphabet('abc', 8)(0), '')
    assert.equal(customRandom('abc', 0, size => new Uint8Array(size))(), '')
    assert.match(customAlphabet('abc', 8)(), /^[abc]{8}$/)

    const baseline = require('baseline-browser-mapping')
    assert.throws(() => baseline.getTimeline({ includeKaiOS: true, includeDownstreamBrowsers: false }), /downstream browser/)
    assert.ok(baseline.getCompatibleVersions({ targetYear: 2023 }).length > 0)

    const { SourceMapConsumer } = require('source-map-js')
    const map = { version: 3, sources: ['input.js'], names: [], mappings: 'AAAA' }
    const indexed = (line, child = map) => ({ version: 3, sections: [{ offset: { line, column: 0 }, map: child }] })
    assert.throws(() => new SourceMapConsumer(indexed(1e12)), /offset line must not exceed/)
    assert.throws(() => new SourceMapConsumer(indexed(6e6, indexed(6e6))), /including offsets of nested sections/)
    assert.deepEqual(new SourceMapConsumer(indexed(2)).originalPositionFor({ line: 3, column: 1 }),
      { source: 'input.js', line: 1, column: 0, name: null })
    console.log('dependency resource guards passed')
  `], { cwd: process.cwd(), timeout: 5000, encoding: 'utf8' })
  expect(result.trim()).toBe('dependency resource guards passed')
})
