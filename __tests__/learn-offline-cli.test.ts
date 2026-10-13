// @vitest-environment node
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { afterAll, expect, it } from 'vitest'
import { chinaDate, type Edition } from '@/lib/learn/document'
import { canonicalEdition, editionFingerprint, textVersion } from '@/lib/learn/publication-contract'
import { makeEdition } from './fixtures/learn-edition'
import { makeEditionV2 } from './fixtures/learn-edition-v2'

const dir = mkdtempSync(join(tmpdir(), 'learn-offline-'))
const guard = join(dir, 'guard.cjs')
// The real CLI runs without application credentials, with networking forbidden.
writeFileSync(guard, `
const deny = () => { throw new Error('NETWORK_FORBIDDEN'); };
globalThis.fetch = deny;
for (const name of ['http', 'https']) {
  const mod = require('node:' + name); mod.request = deny; mod.get = deny;
}
require('node:net').Socket.prototype.connect = deny;
`)
afterAll(() => rmSync(dir, { recursive: true, force: true }))

function run(input?: unknown, args?: string[]) {
  const file = join(dir, 'candidate.json')
  if (input !== undefined) writeFileSync(file, typeof input === 'string' ? input : JSON.stringify(input))
  const result = spawnSync(process.execPath, ['--require', guard, '--import', 'tsx',
    resolve('scripts/validate-learn-edition.ts'), ...(args ?? [file])], {
    encoding: 'utf8', timeout: 15000,
    env: { NODE_ENV: 'test', SystemRoot: process.env.SystemRoot, TEMP: dir, TMP: dir },
  })
  expect(result.error).toBeUndefined()
  expect(result.stderr).toBe('')
  return { status: result.status, output: JSON.parse(result.stdout) }
}

function today(edition: Edition): Edition {
  const date = chinaDate()
  return { ...edition, date, sources: edition.sources.map(s => ({ ...s,
    publishedAt: date + 'T00:00:00Z', ...('checkedAt' in s ? { checkedAt: date + 'T01:00:00Z' } : {}),
  })) } as Edition
}

it.each([makeEdition(), makeEditionV2()])('validates v$version with the existing canonical/text contract offline', source => {
  const edition = today(source)
  const { status, output } = run(edition)
  expect(status).toBe(0)
  expect(output).toMatchObject({ ok: true, scope: 'offline_validation_only',
    fingerprint: editionFingerprint(edition), canonicalBytes: Buffer.byteLength(canonicalEdition(edition)),
    textBytes: Buffer.byteLength(textVersion(edition)) })
  const reordered = Object.fromEntries(Object.entries(edition).reverse())
  expect(run(reordered).output.fingerprint).toBe(output.fingerprint)
})

it.each([18, 19])('rejects a %i-character quiz through the shared validator', length => {
  const edition = today(makeEdition())
  const quiz = edition.blocks.find(b => b.type === 'quiz')!
  if (quiz.type === 'quiz') quiz.question = '问'.repeat(length)
  const { status, output } = run(edition)
  expect(status).toBe(1)
  expect(output.ok).toBe(false)
  expect(output.errors.join(' ')).toMatch(/quiz/)
})

it('rejects an old date without a backfill flag', () => {
  const result = run(makeEdition('2000-01-01'))
  expect(result.status).toBe(1)
  expect(result.output.errors.join(' ')).toMatch(/Asia\/Shanghai/)
})

it.each(['{', 'null', '{}'])('rejects malformed or incomplete input: %s', input => {
  expect(run(input).status).toBe(1)
})

it('rejects missing files, missing arguments and extra flags', () => {
  for (const args of [[join(dir, 'missing.json')], [], ['candidate.json', '--publish']]) {
    expect(run(undefined, args).status).toBe(1)
  }
})
