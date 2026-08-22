// lib/db/points.ts
// Extracted from lib/db.ts by domain boundary. Logic unchanged.

import { sql, serializeRow, serializeRows } from './_core'

// ─── Points System ───────────────────────────────────────────────────────────

/** 检查是否已有相同 reason+ref_slug 的积分流水（用于幂等防重复） */
export async function hasPointTransaction(userId: number, reason: string, refSlug?: string): Promise<boolean> {
  const rows = await sql`SELECT 1 FROM point_transactions WHERE user_id = ${userId} AND reason = ${reason} AND ref_slug = ${refSlug ?? null} LIMIT 1`
  return rows.length > 0
}

export async function addPoints(
  userId: number,
  amount: number,
  reason: string,
  refSlug?: string
): Promise<number> {
  // 用 RETURNING 避免额外 SELECT，单条 SQL 完成更新+取值
  const rows = await sql`UPDATE users SET points = GREATEST(points + ${amount}, 0) WHERE id = ${userId} RETURNING points`
  const newPoints = (rows[0] as { points: number })?.points ?? 0
  // 流水记录失败不应影响扣费结果（UPDATE 已提交）
  try {
    await sql`INSERT INTO point_transactions(user_id, amount, reason, ref_slug) VALUES(${userId}, ${amount}, ${reason}, ${refSlug ?? null})`
  } catch (e) {
    console.error('[addPoints] 流水记录失败（不影响扣费）:', e)
  }
  return newPoints
}

export async function getPoints(userId: number): Promise<number> {
  const rows = await sql`SELECT points FROM users WHERE id = ${userId} LIMIT 1`
  return (rows[0] as { points: number })?.points ?? 0
}

export interface PointTransaction {
  id: number; user_id: number; amount: number; reason: string
  ref_slug: string | null; created_at: string
}

export async function getPointHistory(userId: number, limit = 20): Promise<PointTransaction[]> {
  const rows = await sql`
    SELECT * FROM point_transactions
    WHERE user_id = ${userId}
    ORDER BY created_at DESC LIMIT ${limit}
  `
  return serializeRows(rows as Record<string, unknown>[]) as unknown as PointTransaction[]
}

export async function hasReadPost(userId: number, postSlug: string): Promise<boolean> {
  const rows = await sql`SELECT 1 FROM point_read_log WHERE user_id = ${userId} AND post_slug = ${postSlug} LIMIT 1`
  return rows.length > 0
}

export async function markPostRead(userId: number, postSlug: string): Promise<void> {
  await sql`INSERT INTO point_read_log(user_id, post_slug) VALUES(${userId}, ${postSlug}) ON CONFLICT DO NOTHING`
}
