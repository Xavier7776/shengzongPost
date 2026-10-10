import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { PGlite } from '@electric-sql/pglite'
import { parseSearchParams, type SearchResponse } from '../lib/search'
import { relevance, type SearchJudgment } from './search-metrics'

// Raw content stays outside Git. This runner seeds only an owned in-memory database.
async function main() {
  const [snapshotPath, outputPath, sourcePath = 'lib/db-search.ts'] = process.argv.slice(2)
  assert.ok(snapshotPath && outputPath, 'Usage: npx tsx scripts/search-replay.ts snapshot.json report.json [source.ts]')
  assert.notEqual(resolve(snapshotPath).toLowerCase(), resolve(outputPath).toLowerCase(), 'Report cannot overwrite its snapshot')
  assert.notEqual(resolve(sourcePath).toLowerCase(), resolve(outputPath).toLowerCase(), 'Report cannot overwrite its source')
  const raw = await readFile(snapshotPath, 'utf8')
  const snapshot = JSON.parse(raw) as { snapshot_at: string; posts: Record<string, unknown>[]; skills: Record<string, unknown>[]; gallery: Record<string, unknown>[] }
  const suite = JSON.parse(await readFile('__tests__/fixtures/search-relevance-queries.json', 'utf8')) as { snapshotAt: string; counts: Record<string, number>; queries: SearchJudgment[] }
  assert.equal(snapshot.snapshot_at, suite.snapshotAt, 'Judgments belong to another snapshot')
  assert.ok(suite.queries.filter(q => q.relevant.length > 0).length >= 30, 'At least 30 judged queries required')
  assert.deepEqual([snapshot.posts.length, snapshot.skills.length, snapshot.gallery.length], [suite.counts.post, suite.counts.skill, suite.counts.gallery])
  const db = new PGlite()
  const originalFetch = globalThis.fetch
  const originalDsn = process.env.DATABASE_URL
  let statement: { query: string; params: unknown[] } | undefined
  try {
    await db.exec(await readFile('scripts/ci/schema.sql', 'utf8'))
    await db.exec('DELETE FROM posts; DELETE FROM skills; DELETE FROM gallery_images')
    for (const [table, rows] of [['posts', snapshot.posts], ['skills', snapshot.skills], ['gallery_images', snapshot.gallery]] as const) {
      for (const row of rows) {
        const seeded = table === 'posts' ? { ...row, published: true } : row
        const columns = Object.keys(seeded)
        assert.ok(columns.every(c => /^[a-z_]+$/.test(c)))
        await db.query(`INSERT INTO ${table} (${columns.join(',')}) VALUES (${columns.map((_, i) => `$${i + 1}`).join(',')})`, Object.values(seeded))
      }
    }
    process.env.DATABASE_URL = 'postgresql://fixture:fixture@ci-build.invalid/neondb'
    globalThis.fetch = async (input, options) => {
      const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input : input.url)
      assert.equal(url.hostname, 'api.invalid', 'Replay cannot reach a real database or network')
      assert.equal(options?.method, 'POST')
      const body = JSON.parse(String(options.body)) as { query: string; params: unknown[] }
      assert.match(body.query.trim(), /^(WITH|SELECT)\b/i)
      statement ??= body
      const result = await db.transaction(async tx => { await tx.exec('SET TRANSACTION READ ONLY'); return tx.query(body.query, body.params) })
      return new Response(JSON.stringify({ fields: result.fields.map(f => ({ name: f.name, dataTypeID: 3802 })), rows: result.rows.map(r => result.fields.map(f => JSON.stringify((r as Record<string, unknown>)[f.name]))), rowCount: result.rows.length, command: 'SELECT' }), { headers: { 'content-type': 'application/json' } })
    }
    const { searchAll } = await import(pathToFileURL(resolve(sourcePath)).href) as { searchAll: (query: ReturnType<typeof parseSearchParams>) => Promise<SearchResponse> }
    const rows: Array<{ id: string; q: string; counts: SearchResponse['counts']; top3: string[] } & ReturnType<typeof relevance>> = []
    for (const judgment of suite.queries) {
      const search = (rest = '') => searchAll(parseSearchParams(new URLSearchParams(`q=${encodeURIComponent(judgment.q)}&${rest}`)))
      const first = await search()
      assert.deepEqual(await search(), first, 'Fixed-snapshot ordering must repeat')
      const full = await search('pageSize=50')
      const all = [...full.results]
      for (let page = 2; page <= full.totalPages; page++) all.push(...(await search(`pageSize=50&page=${page}`)).results)
      assert.equal(new Set(all.map(r => `${r.type}:${r.id}`)).size, first.total)
      const counts = { all: all.length, post: all.filter(r => r.type === 'post').length, skill: all.filter(r => r.type === 'skill').length, gallery: all.filter(r => r.type === 'gallery').length }
      assert.deepEqual(first.counts, counts)
      for (const type of ['post', 'skill', 'gallery'] as const) {
        const filtered = await search(`type=${type}`)
        assert.equal(filtered.total, counts[type])
        assert.deepEqual(filtered.counts, counts)
        assert.ok(filtered.results.every(r => r.type === type))
      }
      if (judgment.category === 'zero') assert.equal(first.total, 0)
      rows.push({ id: judgment.id, q: judgment.q, counts, top3: first.results.slice(0, 3).map(r => `${r.type}:${r.id}`), ...relevance(judgment, first) })
    }
    const average = (field: 'recall20' | 'mrr10' | 'ndcg10') => { const values = rows.flatMap(r => r[field] === null ? [] : [r[field]!]); return values.reduce((a, b) => a + b, 0) / values.length }
    await writeFile(outputPath, JSON.stringify({ snapshotAt: snapshot.snapshot_at, snapshotSha256: createHash('sha256').update(raw).digest('hex'), judgmentsSha256: createHash('sha256').update(await readFile('__tests__/fixtures/search-relevance-queries.json')).digest('hex'), sourceSha256: createHash('sha256').update(await readFile(sourcePath)).digest('hex'), queries: rows.length, judgedQueries: rows.filter(r => r.recall20 !== null).length, recall20: average('recall20'), mrr10: average('mrr10'), ndcg10: average('ndcg10'), zeroResultRate: rows.filter(r => r.counts.all === 0).length / rows.length, facetAccuracy: 1, errorRate: 0, rows, statement }, null, 2))
    console.log(JSON.stringify({ queries: rows.length, recall20: average('recall20'), mrr10: average('mrr10'), ndcg10: average('ndcg10'), facetAccuracy: 1 }))
  } finally { globalThis.fetch = originalFetch; if (originalDsn === undefined) delete process.env.DATABASE_URL; else process.env.DATABASE_URL = originalDsn; await db.close() }
}
main().catch(e => { console.error(e.message); process.exitCode = 1 })
