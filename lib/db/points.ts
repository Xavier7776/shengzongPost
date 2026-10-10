// lib/db/points.ts
// Extracted from lib/db.ts by domain boundary. Logic unchanged.

import { sql, serializeRow, serializeRows } from './_core'

// ─── Points System ───────────────────────────────────────────────────────────

/** 检查是否已有相同 reason+ref_slug 的积分流水（用于幂等防重复） */
export async function hasPointTransaction(userId: number, reason: string, refSlug?: string): Promise<boolean> {
  const rows = await sql`SELECT 1 FROM point_transactions WHERE user_id = ${userId} AND reason = ${reason} AND ref_slug IS NOT DISTINCT FROM ${refSlug ?? null} LIMIT 1`
  return rows.length > 0
}

export async function addPoints(
  userId: number,
  amount: number,
  reason: string,
  refSlug?: string
): Promise<number> {
  if (!Number.isSafeInteger(amount)) throw new Error('Invalid points amount')
  // Raw transaction queries stay lazy and are not retried after an ambiguous network commit.
  const [, rows] = await sql.transaction(tx => [
    tx`SELECT id FROM users WHERE id=${userId} FOR UPDATE`,
    tx`WITH previous AS (SELECT points FROM users WHERE id=${userId}),
      changed AS (UPDATE users SET points=GREATEST(points+${amount},0) WHERE id=${userId} RETURNING points),
      audit AS (INSERT INTO point_transactions(user_id,amount,reason,ref_slug)
        SELECT ${userId},changed.points-previous.points,${reason},${refSlug ?? null}
        FROM changed,previous RETURNING id)
      SELECT changed.points FROM changed,audit`,
  ])
  if (!rows[0]) throw new Error('User not found')
  return rows[0].points as number
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

export async function rewardPostRead(userId: number, slug: string): Promise<boolean> {
  const [, rows] = await sql.transaction(tx => [
    tx`SELECT id FROM users WHERE id=${userId} FOR UPDATE`,
    tx`WITH marked AS (
        INSERT INTO point_read_log(user_id,post_slug)
        SELECT id,${slug} FROM users WHERE id=${userId}
          AND EXISTS(SELECT 1 FROM posts WHERE slug=${slug} AND published=true)
        ON CONFLICT DO NOTHING RETURNING user_id
      ), changed AS (
        UPDATE users SET points=points+2 WHERE id IN (SELECT user_id FROM marked)
          AND NOT EXISTS(SELECT 1 FROM point_transactions WHERE user_id=${userId} AND reason='read_post' AND ref_slug=${slug})
        RETURNING id
      ) INSERT INTO point_transactions(user_id,amount,reason,ref_slug)
        SELECT id,2,'read_post',${slug} FROM changed RETURNING id`,
  ])
  return rows.length > 0
}

export async function chargeResearch(userId: number, requestId: string, cost: number): Promise<{ paid: boolean; remaining: number; refSlug: string }> {
  const refSlug = `research_${userId}_${requestId}`
  const [, rows] = await sql.transaction(tx => [
    tx`SELECT id FROM users WHERE id=${userId} FOR UPDATE`,
    tx`WITH prior AS (SELECT 1 FROM point_transactions WHERE user_id=${userId} AND reason='deep_research' AND ref_slug=${refSlug}),
      debit AS (UPDATE users SET points=points-${cost} WHERE id=${userId} AND points>=${cost}
        AND NOT EXISTS(SELECT 1 FROM prior) RETURNING points),
      audit AS (INSERT INTO point_transactions(user_id,amount,reason,ref_slug)
        SELECT ${userId},${-cost},'deep_research',${refSlug} FROM debit RETURNING id)
      SELECT COALESCE((SELECT points FROM debit),points) AS remaining,
        EXISTS(SELECT 1 FROM prior) OR EXISTS(SELECT 1 FROM audit) AS paid
      FROM users WHERE id=${userId}`,
  ])
  return { paid: rows[0]?.paid === true, remaining: (rows[0]?.remaining as number) ?? 0, refSlug }
}
