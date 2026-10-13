import { readFileSync } from 'node:fs'
import { chinaDate, validateEdition, type Edition } from '../lib/learn/document'
import { canonicalEdition, editionFingerprint, slugFor, textVersion } from '../lib/learn/publication-contract'

// Offline preflight only. No credentials, network, database or publishing imports.
function main() {
  const [file, ...extra] = process.argv.slice(2)
  if (!file || extra.length) throw new Error('usage: npm run learn:validate -- <candidate.json>')
  const raw: unknown = JSON.parse(readFileSync(file, 'utf8'))
  const result = validateEdition(raw)
  const errors = [...result.errors]
  const expectedDate = chinaDate()
  if (!raw || typeof raw !== 'object' || !('date' in raw) || raw.date !== expectedDate) {
    errors.push(`edition date must be today in Asia/Shanghai (${expectedDate})`)
  }
  if (errors.length) {
    console.log(JSON.stringify({ ok: false, errors, charCount: result.charCount }))
    process.exitCode = 1
    return
  }
  const edition = raw as Edition
  console.log(JSON.stringify({
    ok: true, scope: 'offline_validation_only', date: edition.date, version: edition.version,
    slug: slugFor(edition), fingerprint: editionFingerprint(edition), charCount: result.charCount,
    canonicalBytes: Buffer.byteLength(canonicalEdition(edition), 'utf8'),
    textBytes: Buffer.byteLength(textVersion(edition), 'utf8'),
  }))
}

try { main() } catch (error) {
  // Never echo input JSON, file contents or environment values on failure.
  const message = error instanceof SyntaxError ? 'invalid JSON'
    : process.argv.length !== 3 ? 'usage: npm run learn:validate -- <candidate.json>'
      : 'unable to read or validate candidate file'
  console.log(JSON.stringify({ ok: false, errors: [message] }))
  process.exitCode = 1
}
