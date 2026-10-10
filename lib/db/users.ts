// lib/db/users.ts
// Extracted from lib/db.ts by domain boundary. Logic unchanged.

import { sql, serializeRow, serializeRows } from './_core'
import { verificationTokenHash } from '@/lib/security/verification-token'

// ─── Users ────────────────────────────────────────────────────────────────────
export interface User {
  id: number; email: string; name: string; password: string
  role: string; phone: string | null; bio: string | null; avatar: string | null
  location: string | null; website: string | null
  github_url: string | null; twitter_url: string | null
  motto: string | null; tech_stack: string[]; title: string | null
  points: number
  verified: boolean; verify_token: string | null; token_expires: string | null; created_at: string
}
export async function getUserByEmail(email: string): Promise<User | null> {
  const rows = await sql`SELECT * FROM users WHERE email=${email} LIMIT 1`
  return rows[0] ? serializeRow(rows[0] as Record<string, unknown>) as unknown as User : null
}
export async function getUserById(id: number): Promise<User | null> {
  const rows = await sql`SELECT * FROM users WHERE id=${id} LIMIT 1`
  return rows[0] ? serializeRow(rows[0] as Record<string, unknown>) as unknown as User : null
}
/** Authoritative DB role check for privileged actions; JWT roles may be stale after revocation. */
export async function getUserRoleById(id: number): Promise<string | null> {
  if (!Number.isSafeInteger(id) || id <= 0) return null
  const rows = await sql`SELECT role FROM users WHERE id=${id} LIMIT 1`
  return (rows[0]?.role as string | undefined) ?? null
}

export async function getAdminUserId(): Promise<number | null> {
  const rows = await sql`SELECT id FROM users WHERE role='admin' ORDER BY id ASC LIMIT 1`
  return rows[0] ? (rows[0].id as number) : null
}
export async function getAllUsers(): Promise<{ id: number; name: string; avatar: string | null }[]> {
  const rows = await sql`SELECT id, name, avatar FROM users ORDER BY role DESC, id ASC`
  return rows.map(r => ({ id: r.id as number, name: r.name as string, avatar: (r.avatar ?? null) as string | null }))
}
export async function createUser(data: { email: string; name: string; password: string }): Promise<User> {
  const rows = await sql`INSERT INTO users(email,name,password) VALUES(${data.email},${data.name},${data.password}) RETURNING *`
  return serializeRow(rows[0] as Record<string, unknown>) as unknown as User
}
export async function setVerifyToken(userId: number, token: string, expires: Date): Promise<void> {
  await sql`UPDATE users SET verify_token=${verificationTokenHash(token)},token_expires=${expires.toISOString()} WHERE id=${userId}`
}
/** Bind numeric reset codes to the requested account, not just a globally matching 6-digit token. */
export async function getUserByVerifyTokenAndEmail(token: string, email: string): Promise<User | null> {
  const rows = await sql`SELECT * FROM users
    WHERE LOWER(email)=${email} AND verify_token IN (${verificationTokenHash(token)},${token}) AND token_expires>NOW() LIMIT 1`
  return rows[0] ? serializeRow(rows[0] as Record<string, unknown>) as unknown as User : null
}

export async function getUserByVerifyTokenAndId(token: string, userId: number): Promise<User | null> {
  const rows = await sql`SELECT * FROM users
    WHERE id=${userId} AND verify_token IN (${verificationTokenHash(token)},${token}) AND token_expires>NOW() LIMIT 1`
  return rows[0] ? serializeRow(rows[0] as Record<string, unknown>) as unknown as User : null
}

export async function getUserByVerifyToken(token: string): Promise<User | null> {
  if (!/^[a-f0-9]{64}$/.test(token)) return null
  const rows = await sql`SELECT * FROM users WHERE verify_token IN (${verificationTokenHash(token)},${token}) AND token_expires>NOW() LIMIT 1`
  return rows[0] ? serializeRow(rows[0] as Record<string, unknown>) as unknown as User : null
}
export async function markUserVerified(userId: number, token: string): Promise<boolean> {
  if (!/^[a-f0-9]{64}$/.test(token)) return false
  const rows = await sql`UPDATE users SET verified=true,verify_token=NULL,token_expires=NULL
    WHERE id=${userId} AND verify_token IN (${verificationTokenHash(token)},${token}) AND token_expires>NOW() RETURNING id`
  return rows.length === 1
}
export async function updateUserPassword(userId: number, hashedPassword: string, token: string, previousPassword: string): Promise<boolean> {
  const rows = await sql`UPDATE users SET password=${hashedPassword},verify_token=NULL,token_expires=NULL
    WHERE id=${userId} AND password=${previousPassword}
      AND verify_token IN (${verificationTokenHash(token)},${token}) AND token_expires>NOW() RETURNING id`
  return rows.length === 1
}
