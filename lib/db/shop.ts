// lib/db/shop.ts
// Extracted from lib/db.ts by domain boundary. Logic unchanged.

import { sql, serializeRow, serializeRows } from './_core'
import { hasPointTransaction, getPoints, addPoints } from './points'

// ─── Avatar Frames ──────────────────────────────────────────────────────────

export interface AvatarFrame {
  id: number; key: string; name: string; description: string | null
  price: number; rarity: string; css_key: string; enabled: boolean; created_at: string
}

export async function getAllFrames(): Promise<AvatarFrame[]> {
  const rows = await sql`SELECT * FROM avatar_frames WHERE enabled = true ORDER BY price ASC`
  return serializeRows(rows as Record<string, unknown>[]) as unknown as AvatarFrame[]
}

export async function getUserFrames(userId: number): Promise<number[]> {
  const rows = await sql`SELECT frame_id FROM user_frames WHERE user_id = ${userId}`
  return rows.map(r => r.frame_id as number)
}

export async function getUserEquippedFrame(userId: number): Promise<AvatarFrame | null> {
  const rows = await sql`
    SELECT af.* FROM users u
    JOIN avatar_frames af ON af.id = u.equipped_frame
    WHERE u.id = ${userId} AND af.enabled = true
    LIMIT 1
  `
  return rows[0] ? serializeRow(rows[0] as Record<string, unknown>) as unknown as AvatarFrame : null
}

export async function purchaseFrame(userId: number, frameId: number): Promise<{ remainingPoints: number; frame: AvatarFrame }> {
  const frameRows = await sql`SELECT * FROM avatar_frames WHERE id = ${frameId} AND enabled = true LIMIT 1`
  if (!frameRows[0]) throw new Error('Frame not found')
  const frame = frameRows[0] as unknown as AvatarFrame

  // 幂等检查：如果已有该 frame 的购买流水，说明已购买过（防止并发双重购买）
  const alreadyPurchased = await hasPointTransaction(userId, 'frame_purchase', `frame_${frame.key}`)
  if (alreadyPurchased) {
    const currentPoints = await getPoints(userId)
    return { remainingPoints: currentPoints, frame: serializeRow(frame as unknown as Record<string, unknown>) as unknown as AvatarFrame }
  }

  const userPoints = await getPoints(userId)
  if (userPoints < frame.price) throw new Error('Insufficient points')

  // 先扣积分（addPoints 内部用 GREATEST 保底不为负）
  const remaining = await addPoints(userId, -frame.price, 'frame_purchase', `frame_${frame.key}`)
  // 用 ON CONFLICT 防止并发重复插入
  await sql`INSERT INTO user_frames(user_id, frame_id) VALUES(${userId}, ${frameId}) ON CONFLICT DO NOTHING`

  return { remainingPoints: remaining, frame: serializeRow(frame as unknown as Record<string, unknown>) as unknown as AvatarFrame }
}

export async function equipFrame(userId: number, frameId: number | null): Promise<void> {
  if (frameId === null) {
    await sql`UPDATE users SET equipped_frame = NULL WHERE id = ${userId}`
    return
  }
  const owned = await sql`SELECT 1 FROM user_frames WHERE user_id = ${userId} AND frame_id = ${frameId} LIMIT 1`
  if (owned.length === 0) throw new Error('Frame not owned')
  await sql`UPDATE users SET equipped_frame = ${frameId} WHERE id = ${userId}`
}

// ─── Cursor Effects ──────────────────────────────────────────────────────────

export interface CursorEffect {
  id: number; key: string; name: string; description: string | null
  price: number; rarity: string
  sprite_url: string | null; cols: number; rows: number; fps: number
  frame_width: number; frame_height: number; scale: number; follow_easing: number
  state_map: string; emoji: string
  render_type: 'sprite_sheet' | 'gif'
  poster_url: string | null
  enabled: boolean; created_at: string
}

export async function getAllCursorEffects(): Promise<CursorEffect[]> {
  const rows = await sql`SELECT * FROM cursor_effects WHERE enabled = true ORDER BY price ASC`
  return serializeRows(rows as Record<string, unknown>[]) as unknown as CursorEffect[]
}

export async function getUserCursorEffects(userId: number): Promise<number[]> {
  const rows = await sql`SELECT effect_id FROM user_cursor_effects WHERE user_id = ${userId}`
  return rows.map(r => r.effect_id as number)
}

export async function getUserEquippedCursorEffect(userId: number): Promise<CursorEffect | null> {
  const rows = await sql`
    SELECT ce.* FROM users u
    JOIN cursor_effects ce ON ce.id = u.equipped_cursor_effect
    WHERE u.id = ${userId} AND ce.enabled = true
    LIMIT 1
  `
  return rows[0] ? serializeRow(rows[0] as Record<string, unknown>) as unknown as CursorEffect : null
}

export async function purchaseCursorEffect(userId: number, effectId: number): Promise<{ remainingPoints: number; effect: CursorEffect }> {
  const effectRows = await sql`SELECT * FROM cursor_effects WHERE id = ${effectId} AND enabled = true LIMIT 1`
  if (!effectRows[0]) throw new Error('Cursor effect not found')
  const effect = effectRows[0] as unknown as CursorEffect

  // 幂等检查：如果已有该 cursor 的购买流水，说明已购买过（防止并发双重购买）
  const alreadyPurchased = await hasPointTransaction(userId, 'cursor_purchase', `cursor_${effect.key}`)
  if (alreadyPurchased) {
    const currentPoints = await getPoints(userId)
    return { remainingPoints: currentPoints, effect: serializeRow(effect as unknown as Record<string, unknown>) as unknown as CursorEffect }
  }

  const userPoints = await getPoints(userId)
  if (userPoints < effect.price) throw new Error('Insufficient points')

  // 先扣积分（addPoints 内部用 GREATEST 保底不为负）
  const remaining = await addPoints(userId, -effect.price, 'cursor_purchase', `cursor_${effect.key}`)
  // 用 ON CONFLICT 防止并发重复插入
  await sql`INSERT INTO user_cursor_effects(user_id, effect_id) VALUES(${userId}, ${effectId}) ON CONFLICT DO NOTHING`

  return { remainingPoints: remaining, effect: serializeRow(effect as unknown as Record<string, unknown>) as unknown as CursorEffect }
}

export async function equipCursorEffect(userId: number, effectId: number | null): Promise<void> {
  if (effectId === null) {
    await sql`UPDATE users SET equipped_cursor_effect = NULL WHERE id = ${userId}`
    return
  }
  const owned = await sql`SELECT 1 FROM user_cursor_effects WHERE user_id = ${userId} AND effect_id = ${effectId} LIMIT 1`
  if (owned.length === 0) throw new Error('Cursor effect not owned')
  await sql`UPDATE users SET equipped_cursor_effect = ${effectId} WHERE id = ${userId}`
}

// ─── Admin: Cursor Effects CRUD ──────────────────────────────────────────────

export interface CursorEffectInput {
  key: string
  name: string
  description: string | null
  price: number
  rarity: string
  sprite_url: string | null
  cols: number
  rows: number
  fps: number
  frame_width: number
  frame_height: number
  scale: number
  follow_easing: number
  state_map: string
  emoji: string
  render_type: 'sprite_sheet' | 'gif'
  poster_url: string | null
  enabled: boolean
}

/** 管理端读取全部鼠标效果（含已禁用） */
export async function getAllCursorEffectsAdmin(): Promise<CursorEffect[]> {
  const rows = await sql`SELECT * FROM cursor_effects ORDER BY created_at DESC`
  return serializeRows(rows as Record<string, unknown>[]) as unknown as CursorEffect[]
}

export async function createCursorEffect(data: CursorEffectInput): Promise<CursorEffect> {
  const rows = await sql`
    INSERT INTO cursor_effects(
      key, name, description, price, rarity, sprite_url,
      cols, rows, fps, frame_width, frame_height, scale, follow_easing,
      state_map, emoji, render_type, poster_url, enabled
    ) VALUES(
      ${data.key}, ${data.name}, ${data.description}, ${data.price}, ${data.rarity}, ${data.sprite_url},
      ${data.cols}, ${data.rows}, ${data.fps}, ${data.frame_width}, ${data.frame_height},
      ${data.scale}, ${data.follow_easing}, ${data.state_map}, ${data.emoji}, ${data.render_type}, ${data.poster_url}, ${data.enabled}
    )
    RETURNING *
  `
  return serializeRow(rows[0] as Record<string, unknown>) as unknown as CursorEffect
}

export async function updateCursorEffect(id: number, data: Partial<CursorEffectInput>): Promise<CursorEffect> {
  const rows = await sql`
    UPDATE cursor_effects SET
      key           = COALESCE(${data.key ?? null}, key),
      name          = COALESCE(${data.name ?? null}, name),
      description   = COALESCE(${data.description ?? null}, description),
      price         = COALESCE(${data.price ?? null}, price),
      rarity        = COALESCE(${data.rarity ?? null}, rarity),
      sprite_url    = COALESCE(${data.sprite_url ?? null}, sprite_url),
      cols          = COALESCE(${data.cols ?? null}, cols),
      rows          = COALESCE(${data.rows ?? null}, rows),
      fps           = COALESCE(${data.fps ?? null}, fps),
      frame_width   = COALESCE(${data.frame_width ?? null}, frame_width),
      frame_height  = COALESCE(${data.frame_height ?? null}, frame_height),
      scale         = COALESCE(${data.scale ?? null}, scale),
      follow_easing = COALESCE(${data.follow_easing ?? null}, follow_easing),
      state_map     = COALESCE(${data.state_map ?? null}, state_map),
      emoji         = COALESCE(${data.emoji ?? null}, emoji),
      render_type   = COALESCE(${data.render_type ?? null}, render_type),
      poster_url    = COALESCE(${data.poster_url ?? null}, poster_url),
      enabled       = COALESCE(${data.enabled ?? null}, enabled)
    WHERE id = ${id}
    RETURNING *
  `
  return serializeRow(rows[0] as Record<string, unknown>) as unknown as CursorEffect
}

export async function deleteCursorEffect(id: number): Promise<void> {
  await sql`DELETE FROM cursor_effects WHERE id = ${id}`
}

// ─── Admin: Avatar Frames CRUD ───────────────────────────────────────────────

export interface AvatarFrameInput {
  key: string
  name: string
  description: string | null
  price: number
  rarity: string
  css_key: string
  enabled: boolean
}

/** 管理端读取全部头像框（含已禁用） */
export async function getAllFramesAdmin(): Promise<AvatarFrame[]> {
  const rows = await sql`SELECT * FROM avatar_frames ORDER BY created_at DESC`
  return serializeRows(rows as Record<string, unknown>[]) as unknown as AvatarFrame[]
}

export async function createFrame(data: AvatarFrameInput): Promise<AvatarFrame> {
  const rows = await sql`
    INSERT INTO avatar_frames(key, name, description, price, rarity, css_key, enabled)
    VALUES(${data.key}, ${data.name}, ${data.description}, ${data.price}, ${data.rarity}, ${data.css_key}, ${data.enabled})
    RETURNING *
  `
  return serializeRow(rows[0] as Record<string, unknown>) as unknown as AvatarFrame
}

export async function updateFrame(id: number, data: Partial<AvatarFrameInput>): Promise<AvatarFrame> {
  const rows = await sql`
    UPDATE avatar_frames SET
      key         = COALESCE(${data.key ?? null}, key),
      name        = COALESCE(${data.name ?? null}, name),
      description = COALESCE(${data.description ?? null}, description),
      price       = COALESCE(${data.price ?? null}, price),
      rarity      = COALESCE(${data.rarity ?? null}, rarity),
      css_key     = COALESCE(${data.css_key ?? null}, css_key),
      enabled     = COALESCE(${data.enabled ?? null}, enabled)
    WHERE id = ${id}
    RETURNING *
  `
  return serializeRow(rows[0] as Record<string, unknown>) as unknown as AvatarFrame
}

export async function deleteFrame(id: number): Promise<void> {
  await sql`DELETE FROM avatar_frames WHERE id = ${id}`
}
