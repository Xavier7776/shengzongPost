// lib/db/comments.ts
// Extracted from lib/db.ts by domain boundary. Logic unchanged.

import { sql, serializeRow, serializeRows } from './_core'

// ─── Comments ────────────────────────────────────────────────────────────────
export interface Comment {
  id: number; post_slug: string; user_id: number; user_name: string
  user_role: string; user_avatar: string | null
  equipped_frame_css_key?: string | null
  content: string; status: 'pending'|'approved'|'rejected'
  parent_id: number | null; created_at: string
  likes?: number; userLiked?: boolean
  replies?: Comment[]
}
export async function getApprovedComments(postSlug: string, userId?: number): Promise<Comment[]> {
  const rows = await sql`
    SELECT c.*, u.role as user_role, u.avatar as user_avatar, af.css_key as equipped_frame_css_key,
      COALESCE((SELECT COUNT(*)::int FROM comment_likes cl WHERE cl.comment_id = c.id), 0) as likes
      ${userId ? sql`, EXISTS(SELECT 1 FROM comment_likes cl2 WHERE cl2.comment_id = c.id AND cl2.user_id = ${userId}) as user_liked` : sql``}
    FROM comments c
    LEFT JOIN users u ON u.id = c.user_id
    LEFT JOIN avatar_frames af ON af.id = u.equipped_frame AND af.enabled = true
    WHERE c.post_slug=${postSlug} AND c.status='approved'
    ORDER BY c.created_at ASC
  `
  const all = serializeRows(rows as Record<string, unknown>[]) as unknown as Comment[]
  // Map user_liked -> userLiked if present
  all.forEach(c => {
    const r = c as unknown as Record<string, unknown>
    if ('user_liked' in r) { c.userLiked = r.user_liked as boolean; delete r.user_liked }
  })
  const map = new Map<number, Comment>()
  const roots: Comment[] = []
  all.forEach(c => { c.replies = []; map.set(c.id, c) })
  all.forEach(c => {
    if (c.parent_id && map.has(c.parent_id)) map.get(c.parent_id)!.replies!.push(c)
    else roots.push(c)
  })
  return roots
}
export async function getAllCommentsAdmin(): Promise<Comment[]> {
  const rows = await sql`SELECT c.*,u.role as user_role,u.avatar as user_avatar FROM comments c LEFT JOIN users u ON u.id=c.user_id ORDER BY c.created_at DESC`
  return serializeRows(rows as Record<string, unknown>[]) as unknown as Comment[]
}
export async function getPendingCommentsCount(): Promise<number> {
  const rows = await sql`SELECT COUNT(*) as count FROM comments WHERE status='pending'`
  return Number((rows[0] as { count: string }).count)
}
export async function createComment(data: { post_slug: string; user_id: number; user_name: string; content: string; parent_id?: number | null }): Promise<Comment> {
  const rows = await sql`INSERT INTO comments(post_slug,user_id,user_name,content,parent_id) VALUES(${data.post_slug},${data.user_id},${data.user_name},${data.content},${data.parent_id??null}) RETURNING *`
  return serializeRow(rows[0] as Record<string, unknown>) as unknown as Comment
}
export async function createApprovedComment(data: { post_slug: string; user_id: number; user_name: string; content: string }): Promise<Comment> {
  const rows = await sql`INSERT INTO comments(post_slug,user_id,user_name,content,parent_id,status) VALUES(${data.post_slug},${data.user_id},${data.user_name},${data.content},NULL,'approved') RETURNING *`
  return serializeRow(rows[0] as Record<string, unknown>) as unknown as Comment
}
export async function deleteAiBotCommentForPost(postSlug: string): Promise<void> {
  await sql`
    DELETE FROM comments
    WHERE post_slug = ${postSlug}
      AND user_id = (SELECT id FROM users WHERE email = 'ai-bot@system.internal' LIMIT 1)
  `
}
export async function updateCommentStatus(id: number, status: 'approved'|'rejected'): Promise<Comment> {
  const rows = await sql`UPDATE comments SET status=${status} WHERE id=${id} RETURNING *`
  return serializeRow(rows[0] as Record<string, unknown>) as unknown as Comment
}
export async function deleteComment(id: number): Promise<void> {
  await sql`DELETE FROM comments WHERE id=${id}`
}

// ─── Comment Likes ───────────────────────────────────────────────────────────
async function countCommentLikes(commentId: number): Promise<number> {
  const rows = await sql`SELECT COUNT(*)::int as cnt FROM comment_likes WHERE comment_id=${commentId}`
  return (rows[0] as { cnt: number }).cnt
}
export async function toggleCommentLike(commentId: number, userId: number): Promise<{ liked: boolean; count: number }> {
  const existing = await sql`SELECT 1 FROM comment_likes WHERE comment_id=${commentId} AND user_id=${userId} LIMIT 1`
  if (existing.length > 0) {
    await sql`DELETE FROM comment_likes WHERE comment_id=${commentId} AND user_id=${userId}`
    return { liked: false, count: await countCommentLikes(commentId) }
  } else {
    await sql`INSERT INTO comment_likes(comment_id, user_id) VALUES(${commentId}, ${userId})`
    return { liked: true, count: await countCommentLikes(commentId) }
  }
}

// ─── Post Reactions (like / dislike) ─────────────────────────────────────────
export interface ReactionCounts { likes: number; dislikes: number; userReaction: 'like'|'dislike'|null }
export async function getPostReactions(slug: string, userId?: number): Promise<ReactionCounts> {
  const rows = await sql`SELECT type, COUNT(*) as cnt FROM post_reactions WHERE post_slug=${slug} GROUP BY type`
  const likes = Number((rows.find((r: Record<string, unknown>) => r.type === 'like') as { cnt?: string })?.cnt ?? 0)
  const dislikes = Number((rows.find((r: Record<string, unknown>) => r.type === 'dislike') as { cnt?: string })?.cnt ?? 0)
  let userReaction: 'like'|'dislike'|null = null
  if (userId) {
    const ur = await sql`SELECT type FROM post_reactions WHERE post_slug=${slug} AND user_id=${userId} LIMIT 1`
    userReaction = ur[0] ? (ur[0] as { type: string }).type as 'like'|'dislike' : null
  }
  return { likes, dislikes, userReaction }
}
export async function upsertReaction(slug: string, userId: number, type: 'like'|'dislike'): Promise<void> {
  await sql`INSERT INTO post_reactions(post_slug,user_id,type) VALUES(${slug},${userId},${type}) ON CONFLICT(post_slug,user_id) DO UPDATE SET type=${type}`
}
export async function deleteReaction(slug: string, userId: number): Promise<void> {
  await sql`DELETE FROM post_reactions WHERE post_slug=${slug} AND user_id=${userId}`
}
