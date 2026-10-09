import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { readFile, mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { spawn } from 'node:child_process'
import { PGlite } from '@electric-sql/pglite'

const db = new PGlite()
await db.exec(await readFile(new URL('./ci/schema.sql', import.meta.url), 'utf8'))
let fixtureFailure = false
const query = async ({ query: text, params = [] }) => {
  assert.equal(typeof text, 'string')
  assert.match(text.trim(), /^SELECT\b/i)
  return db.transaction(async tx => {
    await tx.exec('SET TRANSACTION READ ONLY')
    const result = await tx.query(text, params)
    // JSONB decoders preserve the JS values from PGlite without copying PG parsers.
    return {
      fields: result.fields.map(f => ({ name: f.name, dataTypeID: 3802 })),
      rows: result.rows.map(r => result.fields.map(f => r[f.name] == null ? null : JSON.stringify(r[f.name]))),
      rowCount: result.rows.length, command: 'SELECT',
    }
  })
}
const server = createServer(async (req, res) => {
  try {
    assert.equal(req.method, 'POST')
    let body = ''
    for await (const chunk of req) { body += chunk; assert.ok(body.length < 1_000_000) }
    const result = await query(JSON.parse(body))
    res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify(result))
  } catch (error) {
    fixtureFailure = true
    console.error('[CI fixture]', error.message)
    res.writeHead(400, { 'content-type': 'application/json' }).end(JSON.stringify({ message: 'CI fixture query failed' }))
  }
})
try {
  // Assert the fixture is real SQL, includes drafts, and refuses write statements.
  assert.equal((await query({ query: 'SELECT COUNT(*)::int AS total FROM posts WHERE published=true' })).rows[0][0], '1')
  await assert.rejects(query({ query: 'DELETE FROM posts' }))
  await assert.rejects(query({ query: 'SELECT 1; DELETE FROM posts' }))
  {
    await new Promise(r => server.listen(0, '127.0.0.1', r))
    const tmp = resolve('.tmpbuild')
    await mkdir(tmp, { recursive: true })
    // CI has no repository secrets; explicit placeholders also override local dotenv files.
    const env = { ...process.env, DATABASE_URL: 'postgresql://fixture:fixture@ci-build.invalid/neondb',
      CI_DATABASE_ENDPOINT: `http://127.0.0.1:${server.address().port}`,
      NODE_OPTIONS: `--require ${JSON.stringify(resolve('scripts/ci/neon-preload.cjs'))}`,
      NEXTAUTH_SECRET: 'ci-placeholder-only', NEXTAUTH_URL: 'http://localhost:3000',
      NEXT_PUBLIC_SITE_URL: 'https://example.invalid', NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'ci-placeholder-only', RESEND_API_KEY: 're_ci_placeholder',
      GITHUB_ID: 'ci-placeholder', GITHUB_SECRET: 'ci-placeholder', ADMIN_API_KEY: '',
      TMP: tmp, TEMP: tmp, NEXT_TELEMETRY_DISABLED: '1' }
    const code = await new Promise((r, reject) => {
      assert.ok(process.env.npm_execpath, 'Run npm run build:ci')
      const args = process.argv.includes('--self-test')
        ? ['--input-type=module', '-e', `import assert from 'node:assert/strict'; import { neon } from '@neondatabase/serverless';
          const rows = await neon(process.env.DATABASE_URL).query('SELECT tags, published FROM posts WHERE published=true');
          assert.deepEqual(rows, [{tags:['CI'], published:true}]); console.log('CI SQL transport self-test passed');`]
        : [process.env.npm_execpath, 'run', 'build']
      const child = spawn(process.execPath, args, { env, stdio: 'inherit' })
      child.on('error', reject)
      child.on('exit', r)
    })
    process.exitCode = code === 0 && !fixtureFailure ? 0 : 1
  }
} finally {
  if (server.listening) await new Promise(r => server.close(r))
  await db.close()
}
