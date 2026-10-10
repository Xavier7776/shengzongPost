import { PGlite } from '@electric-sql/pglite'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
const { sql } = vi.hoisted(() => ({ sql: vi.fn() }))
vi.mock('@/lib/db/_core', () => ({ sql, serializeRow: (r: unknown) => r, serializeRows: (r: unknown) => r }))
import { setVerifyToken, getUserByVerifyTokenAndEmail, getUserByVerifyToken, markUserVerified, updateUserPassword } from '@/lib/db/users'
const db = new PGlite()
beforeAll(async () => { await db.exec('CREATE TABLE users(id int PRIMARY KEY,email text,password text,verified boolean,verify_token text,token_expires timestamptz)') })
beforeEach(async () => {
  vi.stubEnv('NEXTAUTH_SECRET', 'test-only-verification-key')
  sql.mockReset().mockImplementation(async (strings: TemplateStringsArray, ...params: unknown[]) =>
    (await db.query(strings.reduce((s, part, i) => s+part+(i<params.length?'$'+(i+1):''), ''), params)).rows)
  await db.exec("TRUNCATE users; INSERT INTO users(id,email,password,verified) VALUES(7,'a@example.com','old-password-hash',false),(8,'b@example.com','other-hash',true)")
})
afterEach(() => vi.unstubAllEnvs())
afterAll(() => db.close())
describe('real SQL one-use account-bound verification', () => {
  it('persists HMAC instead of numeric code; rejects another account and concurrent second consumption', async () => {
    await setVerifyToken(7, '123456', new Date(Date.now()+60000))
    const record = (await db.query<{ verify_token: string }>('SELECT verify_token FROM users WHERE id=7')).rows[0]
    expect(record.verify_token).toMatch(/^h1:[a-f0-9]{64}$/)
    expect(record.verify_token).not.toContain('123456')
    expect(await getUserByVerifyTokenAndEmail('123456','b@example.com')).toBeNull()
    expect((await getUserByVerifyTokenAndEmail('123456','a@example.com'))?.id).toBe(7)
    expect(await getUserByVerifyToken('123456')).toBeNull()
    const results = await Promise.all([updateUserPassword(7,'new-hash-a','123456','old-password-hash'),updateUserPassword(7,'new-hash-b','123456','old-password-hash')])
    expect(results.filter(Boolean)).toHaveLength(1)
    expect(await getUserByVerifyTokenAndEmail('123456','a@example.com')).toBeNull()
  })
  it('refuses replaced or expired tokens and preserves still-valid legacy mail links', async () => {
    const mailToken = 'a'.repeat(64)
    await db.query('UPDATE users SET verify_token=$1,token_expires=NOW()+INTERVAL \'1 hour\' WHERE id=7',[mailToken])
    expect((await getUserByVerifyToken(mailToken))?.id).toBe(7)
    expect(await markUserVerified(7,mailToken)).toBe(true)
    expect(await markUserVerified(7,mailToken)).toBe(false)
    await setVerifyToken(7,'123456',new Date(Date.now()-60000))
    expect(await updateUserPassword(7,'new-hash','123456','old-password-hash')).toBe(false)
    await setVerifyToken(7,'123456',new Date(Date.now()+60000))
    await setVerifyToken(7,'654321',new Date(Date.now()+60000))
    expect(await updateUserPassword(7,'new-hash','123456','old-password-hash')).toBe(false)
    expect(await markUserVerified(7,'654321')).toBe(false)
  })
})
