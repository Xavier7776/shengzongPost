import { createHash, randomBytes } from 'node:crypto'
import { sql } from './_core'

const hash = (secret: string) => createHash('sha256').update(secret).digest('hex')
export const pairingPattern = /^[a-zA-Z0-9_-]{24}$/
const tokenPattern = /^Bearer ([a-zA-Z0-9_-]{43})$/

export async function studyDevice(userId: number) {
  const [row] = await sql`SELECT device_name AS name, last_sync_at AS "lastSyncAt" FROM study_sync_devices
    WHERE user_id = ${userId} AND device_token_hash IS NOT NULL`
  return row ? { name: String(row.name), lastSyncAt: row.lastSyncAt ? new Date(row.lastSyncAt as string | Date).toISOString() : null } : null
}

export async function createStudyPairing(userId: number) {
  const code = randomBytes(18).toString('base64url')
  await sql`INSERT INTO study_sync_devices (user_id, pairing_hash, pairing_expires_at)
    VALUES (${userId}, ${hash(code)}, NOW() + INTERVAL '10 minutes')
    ON CONFLICT (user_id) DO UPDATE
    SET pairing_hash = EXCLUDED.pairing_hash, pairing_expires_at = EXCLUDED.pairing_expires_at`
  return code
}

export async function claimStudyPairing(code: string, name: string) {
  const token = randomBytes(32).toString('base64url')
  const rows = await sql`UPDATE study_sync_devices d
    SET device_token_hash = ${hash(token)}, device_name = ${name}, linked_at = NOW(),
        last_sync_at = NULL, pairing_hash = NULL, pairing_expires_at = NULL
    FROM users u
    WHERE d.user_id = u.id AND u.role = 'admin' AND d.pairing_hash = ${hash(code)} AND d.pairing_expires_at > NOW()
    RETURNING d.user_id`
  return rows.length ? token : null
}

export async function authorizeStudyDevice(header: string | null) {
  const token = header?.match(tokenPattern)?.[1]
  if (!token) return null
  const credential = hash(token)
  const [row] = await sql`SELECT d.user_id FROM study_sync_devices d JOIN users u ON d.user_id = u.id
    WHERE d.device_token_hash = ${credential} AND u.role = 'admin'`
  return row ? { userId: Number(row.user_id), credential } : null
}

export async function markStudyDeviceSynced(userId: number, credential: string) {
  await sql`UPDATE study_sync_devices SET last_sync_at = NOW()
    WHERE user_id = ${userId} AND device_token_hash = ${credential}`
}

export async function revokeStudyDevice(userId: number, credential?: string) {
  if (credential !== undefined) {
    await sql`UPDATE study_sync_devices SET device_token_hash = NULL, device_name = NULL, linked_at = NULL, last_sync_at = NULL
      WHERE user_id = ${userId} AND device_token_hash = ${credential}`
  } else {
    await sql`DELETE FROM study_sync_devices WHERE user_id = ${userId}`
  }
}
