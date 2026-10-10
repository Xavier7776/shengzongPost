import { spawn, execFile } from 'node:child_process'
import { pipeline } from 'node:stream/promises'
import { createReadStream } from 'node:fs'
import { mkdir, readFile, stat, rename, writeFile, lstat } from 'node:fs/promises'
import { createHash, randomUUID, X509Certificate } from 'node:crypto'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { promisify } from 'node:util'

const required = name => {
  if (!process.env[name]) throw new Error(`Missing ${name}`)
  return process.env[name]
}
export function connectionEnvironment(connection, readonly = true) {
  const url = new URL(connection)
  if (!['postgres:', 'postgresql:'].includes(url.protocol) || !url.hostname.endsWith('.neon.tech') || url.hostname.includes('-pooler.')) {
    throw new Error('A direct Neon PostgreSQL connection is required')
  }
  return { ...process.env, PGHOST: url.hostname, PGPORT: url.port || '5432',
    PGUSER: decodeURIComponent(url.username), PGPASSWORD: decodeURIComponent(url.password),
    PGDATABASE: decodeURIComponent(url.pathname.slice(1)), PGSSLMODE: 'verify-full',
    PGSSLROOTCERT: process.env.BACKUP_CA_CERTIFICATE || 'system', PGCONNECT_TIMEOUT: '20',
    PGOPTIONS: readonly ? '-c default_transaction_read_only=on -c statement_timeout=900000' : '-c statement_timeout=900000' }
}
function start(executable, args, env = process.env) {
  const child = spawn(executable, args, { env, windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] })
  const timeout = setTimeout(() => child.kill(), 20 * 60 * 1000)
  timeout.unref()
  child.once('error', () => clearTimeout(timeout))
  child.once('close', () => clearTimeout(timeout))
  // Never log tool stderr: it may contain connection credentials or private rows.
  const diagnostics = {}
  child.stderr.on('data', chunk => {
    const text = chunk.toString()
    for (const [name, pattern] of Object.entries({ publicSchemaExists: /schema "public" already exists/,
      roleMissing: /role .* does not exist/, permissionDenied: /permission denied/,
      unsupportedParameter: /unrecognized configuration parameter/, connectionFailure: /connection.*failed|SSL error/,
      copyFailure: /COPY failed/, extensionUnavailable: /extension.*not available/ })) {
      if (pattern.test(text)) diagnostics[name] = true
    }
  })
  const done = new Promise((resolve, reject) => {
    child.once('error', () => reject(new Error('Could not start backup tool')))
    child.once('close', code => code === 0 ? resolve() : reject(Object.assign(new Error('Backup tool failed'), { diagnostics })))
  })
  done.catch(() => {})
  return { child, done }
}
export async function encryptedBackup({ dump, openssl, certificate, destination, connection, snapshot }) {
  const dir = path.resolve(destination)
  await mkdir(dir, { recursive: true })
  if ((await lstat(dir)).isSymbolicLink()) throw new Error('Backup destination cannot be a link')
  const cert = new X509Certificate(await readFile(certificate))
  if (cert.publicKey.asymmetricKeyType !== 'rsa' || cert.publicKey.asymmetricKeyDetails.modulusLength < 3072 ||
    Date.parse(cert.validFrom) > Date.now() || Date.parse(cert.validTo) <= Date.now()) {
    throw new Error('A valid RSA recovery certificate of at least 3072 bits is required')
  }
  const run = `${new Date().toISOString().replaceAll(/[:.]/g, '-')}-${randomUUID()}`
  const partial = path.join(dir, `${run}.partial`)
  const final = path.join(dir, `${run}.cms`)
  const started = new Date().toISOString()
  const args = ['--format=custom', '--no-owner', '--no-acl', '--no-password', '--lock-wait-timeout=5s']
  if (snapshot) args.push(`--snapshot=${snapshot}`)
  const source = start(dump, args, connectionEnvironment(connection))
  const sink = start(openssl, ['cms', '-encrypt', '-binary', '-aes-256-gcm', '-outform', 'DER',
    '-recip', certificate, '-keyopt', 'rsa_padding_mode:oaep', '-keyopt', 'rsa_oaep_md:sha256', '-out', partial])
  source.child.stdin.end()
  sink.child.stdout.resume()
  try {
    await Promise.all([pipeline(source.child.stdout, sink.child.stdin), source.done, sink.done])
    const size = (await stat(partial)).size
    if (size < 100) throw new Error('Empty encrypted archive')
    const hash = createHash('sha256')
    for await (const chunk of createReadStream(partial)) hash.update(chunk)
    const manifest = { run, started, completed: new Date().toISOString(), status: 'success',
      file: path.basename(final), bytes: size, sha256: hash.digest('hex'), certificateSha256: cert.fingerprint256,
      encryption: 'CMS AES-256-GCM / RSA-OAEP-SHA256', scope: 'one database; no cluster roles/ACL/owner',
      snapshot: snapshot || null }
    const versions = await Promise.all([
      promisify(execFile)(dump, ['--version'], { windowsHide: true, timeout: 10000 }),
      promisify(execFile)(openssl, ['version'], { windowsHide: true, timeout: 10000 }),
    ])
    manifest.tools = { pgDump: versions[0].stdout.trim(), openssl: versions[1].stdout.trim() }
    await rename(partial, final)
    await writeFile(path.join(dir, `${run}.json`), JSON.stringify(manifest, null, 2), { flag: 'wx' })
    return manifest
  } catch {
    source.child.kill(); sink.child.kill()
    await Promise.allSettled([source.done, sink.done])
    await writeFile(path.join(dir, `${run}.failed.json`), JSON.stringify({ run, started, failed: new Date().toISOString(),
      status: 'failed', reason: 'export or encryption failed; earlier successful backups preserved' }), { flag: 'wx' })
    throw new Error('Backup failed; inspect safe failure record')
  }
}

export async function decryptArchive({ openssl, file, powershell, keyScript, keyDirectory, portableKey }) {
  const key = portableKey ? null : start(powershell, ['-NoProfile', '-NonInteractive', '-File', keyScript,
    '-Mode', 'ReadPassphrase', '-KeyDirectory', keyDirectory])
  key?.child.stdin.end()
  const args = ['cms', '-decrypt', '-binary', '-inform', 'DER', '-in', file,
    '-inkey', portableKey || path.join(keyDirectory, 'recovery-private-encrypted.pem')]
  if (key) args.push('-passin', 'stdin')
  const decrypt = start(openssl, args)
  if (!key) decrypt.child.stdin.end()
  const chunks = []
  let size = 0
  try {
    await Promise.all([key ? pipeline(key.child.stdout, decrypt.child.stdin) : Promise.resolve(), key?.done, decrypt.done, (async () => {
      for await (const chunk of decrypt.child.stdout) {
        size += chunk.length
        // shortcut: memory-only restore capped at 256 MiB; use a separately approved secure restore host above this size.
        if (size > 256 * 1024 * 1024) throw new Error('Restore exceeds memory bound')
        chunks.push(chunk)
      }
    })()])
    return Buffer.concat(chunks)
  } catch {
    key?.child.kill(); decrypt.child.kill()
    await Promise.allSettled([key?.done, decrypt.done])
    throw new Error('Recovery authentication failed; no restore started')
  } finally { for (const chunk of chunks) chunk.fill(0) }
}

export async function restoreArchive({ restore, archive, connection, approvedHost }) {
  const env = connectionEnvironment(connection, false)
  if (!approvedHost || env.PGHOST !== approvedHost || env.PGDATABASE !== 'm11_backup_restore') {
    throw new Error('Restore requires the explicitly verified host and a new m11_backup_restore database')
  }
  if (archive.subarray(0, 5).toString() !== 'PGDMP') throw new Error('Not a PostgreSQL custom archive')
  const target = start(restore, [`--dbname=${env.PGDATABASE}`, '--no-owner', '--no-acl', '--single-transaction', '--exit-on-error', '--no-password'], env)
  target.child.stdout.resume()
  target.child.stdin.on('error', () => {})
  target.child.stdin.end(archive)
  await target.done
}

async function main() {
  if (process.argv[2] === 'verify' && process.argv[3]) {
    const archive = await decryptArchive({ openssl: process.env.OPENSSL_PATH || 'openssl', file: process.argv[3],
      portableKey: process.env.BACKUP_PORTABLE_KEY || path.join(path.dirname(process.argv[1]), 'recovery-private.pem') })
    try {
      if (archive.subarray(0, 5).toString() !== 'PGDMP') throw new Error('Not a PostgreSQL custom archive')
      console.log(JSON.stringify({ authenticated: true, format: 'PGDMP', bytes: archive.length, requiresDPAPI: false }))
    } finally { archive.fill(0) }
    return
  }
  if (process.argv[2] !== 'backup') throw new Error('Usage: database-backup.mjs backup | verify <encrypted.cms>')
  const result = await encryptedBackup({ dump: required('PG_DUMP_PATH'), openssl: required('OPENSSL_PATH'),
    certificate: required('BACKUP_CERTIFICATE'), destination: required('BACKUP_DIRECTORY'),
    connection: required('BACKUP_DATABASE_URL'), snapshot: process.env.BACKUP_SNAPSHOT })
  console.log(JSON.stringify(result))
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch(() => { console.error('Database backup failed; no credentials or raw tool errors logged'); process.exitCode = 1 })
}
