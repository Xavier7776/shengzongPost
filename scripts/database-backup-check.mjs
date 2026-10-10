import test from 'node:test'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdtemp, readFile, writeFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import { connectionEnvironment, decryptArchive, restoreArchive, encryptedBackup } from './database-backup.mjs'

test('connections require direct Neon TLS and force production export read-only', () => {
  const env = connectionEnvironment('postgresql://user:p%40ss@ep-synthetic.ap-southeast-1.aws.neon.tech/neondb?sslmode=disable')
  assert.equal(env.PGPASSWORD, 'p@ss')
  assert.equal(env.PGSSLMODE, 'verify-full')
  assert.match(env.PGOPTIONS, /default_transaction_read_only=on/)
  for (const value of ['http://example.com', 'postgresql://u:p@localhost/test',
    'postgresql://u:p@ep-synthetic-pooler.ap-southeast-1.aws.neon.tech/neondb']) {
    assert.throws(() => connectionEnvironment(value))
  }
})
test('restore refuses production database or an unverified host before launching tools', async () => {
  const host = 'ep-synthetic.ap-southeast-1.aws.neon.tech'
  await assert.rejects(restoreArchive({ connection: `postgresql://u:p@${host}/neondb`, approvedHost: host }))
  await assert.rejects(restoreArchive({ connection: `postgresql://u:p@${host}/m11_backup_restore`, approvedHost: 'different' }))
  await assert.rejects(restoreArchive({ connection: `postgresql://u:p@${host}/m11_backup_restore`, approvedHost: host,
    archive: Buffer.from('not an archive') }))
})
test('installed OpenSSL round-trip, damaged tag, missing key and failed export preservation', {
  skip: !process.env.BACKUP_CERTIFICATE || !process.env.OPENSSL_PATH || !process.env.BACKUP_KEY_DIRECTORY,
}, async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'shengzong-backup-check-'))
  const file = path.join(dir, 'synthetic.cms')
  const payload = Buffer.concat([Buffer.from('PGDMP synthetic round trip\0'), Buffer.alloc(1024 * 1024, 117)])
  const child = spawn(process.env.OPENSSL_PATH, ['cms', '-encrypt', '-binary', '-aes-256-gcm', '-outform', 'DER',
    '-recip', process.env.BACKUP_CERTIFICATE, '-keyopt', 'rsa_padding_mode:oaep', '-keyopt', 'rsa_oaep_md:sha256', '-out', file],
    { windowsHide: true, stdio: ['pipe', 'ignore', 'ignore'] })
  child.stdin.end(payload)
  await new Promise((resolve, reject) => { child.on('error', reject); child.on('exit', code => code === 0 ? resolve() : reject(new Error('encryption failed'))) })
  const options = { openssl: process.env.OPENSSL_PATH, file, powershell: 'pwsh',
    keyScript: path.resolve('scripts/backup-key.ps1'), keyDirectory: process.env.BACKUP_KEY_DIRECTORY }
  const decoded = await decryptArchive(options)
  assert.deepEqual(decoded, payload)
  decoded.fill(0)
  if (process.env.BACKUP_PORTABLE_KEY) {
    const portable = await decryptArchive({ openssl: options.openssl, file, portableKey: process.env.BACKUP_PORTABLE_KEY,
      powershell: 'not-installed', keyDirectory: path.join(dir, 'not-present') })
    assert.deepEqual(portable, payload)
    portable.fill(0)
  }
  const damaged = await readFile(file)
  damaged[damaged.length - 1] ^= 1
  await writeFile(path.join(dir, 'damaged.cms'), damaged)
  await assert.rejects(decryptArchive({ ...options, file: path.join(dir, 'damaged.cms') }), /authentication failed/)
  await assert.rejects(decryptArchive({ ...options, keyDirectory: path.join(dir, 'missing-key') }), /authentication failed/)
  const originalCiphertext = await readFile(file)
  await assert.rejects(encryptedBackup({ dump: path.join(dir, 'missing-pg-dump.exe'), openssl: process.env.OPENSSL_PATH,
    certificate: process.env.BACKUP_CERTIFICATE, destination: dir,
    connection: 'postgresql://u:p@ep-synthetic.ap-southeast-1.aws.neon.tech/neondb' }), /Backup failed/)
  assert.deepEqual(await readFile(file), originalCiphertext)
  const failed = (await readdir(dir)).filter(name=>name.endsWith('.failed.json'))
  assert.equal(failed.length, 1)
  assert.equal(JSON.parse(await readFile(path.join(dir, failed[0]), 'utf8')).status, 'failed')
  console.log('Synthetic ciphertext tests passed; no private key or plaintext archive written to disk')
})
