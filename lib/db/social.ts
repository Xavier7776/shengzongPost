// lib/db/social.ts
// Extracted from lib/db.ts by domain boundary. Logic unchanged.

import { sql, serializeRow, serializeRows } from './_core'
import type { PostMeta } from './posts'

// ─── Bookmarks ────────────────────────────────────────────────────────────────
export async function isBookmarked(slug: string, userId: number): Promise<boolean> {
  const rows = await sql`SELECT 1 FROM bookmarks WHERE post_slug=${slug} AND user_id=${userId} LIMIT 1`
  return rows.length > 0
}
export async function toggleBookmark(slug: string, userId: number): Promise<boolean> {
  const [, rows] = await sql.transaction(tx => [
    tx`SELECT id FROM users WHERE id=${userId} FOR UPDATE`,
    tx`WITH target AS (SELECT slug FROM posts WHERE slug=${slug} AND published=true),
      removed AS (DELETE FROM bookmarks WHERE post_slug IN (SELECT slug FROM target) AND user_id=${userId} RETURNING id),
      added AS (INSERT INTO bookmarks(post_slug,user_id) SELECT slug,${userId} FROM target
        WHERE NOT EXISTS(SELECT 1 FROM removed) RETURNING id)
      SELECT EXISTS(SELECT 1 FROM added) AS bookmarked FROM target`,
    tx`WITH reward AS (
        SELECT CASE WHEN EXISTS(SELECT 1 FROM bookmarks WHERE post_slug=${slug} AND user_id=${userId}) THEN 1 ELSE -1 END AS amount
        WHERE EXISTS(SELECT 1 FROM posts WHERE slug=${slug} AND published=true)
      ), eligible AS (
        SELECT amount FROM reward WHERE
          (amount=1 AND NOT EXISTS(SELECT 1 FROM point_transactions WHERE user_id=${userId} AND reason='bookmark_post' AND ref_slug=${slug})) OR
          (amount=-1 AND EXISTS(SELECT 1 FROM point_transactions WHERE user_id=${userId} AND reason='bookmark_post' AND ref_slug=${slug})
            AND NOT EXISTS(SELECT 1 FROM point_transactions WHERE user_id=${userId} AND reason='unbookmark_post' AND ref_slug=${slug}))
      ), previous AS (SELECT points FROM users WHERE id=${userId}),
      changed AS (UPDATE users SET points=GREATEST(points+eligible.amount,0) FROM eligible WHERE id=${userId} RETURNING points)
      INSERT INTO point_transactions(user_id,amount,reason,ref_slug)
        SELECT ${userId},changed.points-previous.points,CASE WHEN eligible.amount=1 THEN 'bookmark_post' ELSE 'unbookmark_post' END,${slug}
        FROM changed,previous,eligible RETURNING id`,
  ])
  if (!rows[0]) throw new Error('Post not found')
  return rows[0].bookmarked as boolean
}
export async function getUserBookmarks(userId: number): Promise<PostMeta[]> {
  const rows = await sql`SELECT p.id,p.slug,p.title,p.excerpt,p.tags,p.published,p.created_at,p.updated_at FROM bookmarks b JOIN posts p ON p.slug=b.post_slug WHERE b.user_id=${userId} AND p.published=true ORDER BY b.created_at DESC`
  return serializeRows(rows as Record<string, unknown>[]) as unknown as PostMeta[]
}
export async function getUserLikedPosts(userId: number): Promise<PostMeta[]> {
  const rows = await sql`
    SELECT p.id,p.slug,p.title,p.excerpt,p.tags,p.published,p.created_at,p.updated_at,p.cover_image,
           p.author_id,u.name as author_name
    FROM post_reactions r
    JOIN posts p ON p.slug = r.post_slug
    LEFT JOIN users u ON u.id = p.author_id
    WHERE r.user_id=${userId} AND r.type='like' AND p.published=true
    ORDER BY r.created_at DESC`
  return serializeRows(rows as Record<string, unknown>[]) as unknown as PostMeta[]
}

// ─── Follows ─────────────────────────────────────────────────────────────────
export interface FollowStatus { isFollowing: boolean; isMutual: boolean }
export async function getFollowStatus(followerId: number, followingId: number): Promise<FollowStatus> {
  const a = await sql`SELECT 1 FROM follows WHERE follower_id=${followerId} AND following_id=${followingId} LIMIT 1`
  const b = await sql`SELECT 1 FROM follows WHERE follower_id=${followingId} AND following_id=${followerId} LIMIT 1`
  return { isFollowing: a.length > 0, isMutual: a.length > 0 && b.length > 0 }
}
export async function toggleFollow(followerId: number, followingId: number): Promise<FollowStatus> {
  const { isFollowing } = await getFollowStatus(followerId, followingId)
  if (isFollowing) await sql`DELETE FROM follows WHERE follower_id=${followerId} AND following_id=${followingId}`
  else await sql`INSERT INTO follows(follower_id,following_id) VALUES(${followerId},${followingId})`
  return getFollowStatus(followerId, followingId)
}
export interface FollowUser { id: number; name: string; avatar: string | null; bio: string | null; isMutual: boolean }
export async function getFollowing(userId: number): Promise<FollowUser[]> {
  const rows = await sql`
    SELECT u.id,u.name,u.avatar,u.bio,
      EXISTS(SELECT 1 FROM follows f2 WHERE f2.follower_id=u.id AND f2.following_id=${userId}) as is_mutual
    FROM follows f JOIN users u ON u.id=f.following_id
    WHERE f.follower_id=${userId} ORDER BY f.created_at DESC
  `
  return (rows as Record<string, unknown>[]).map(r => ({ ...serializeRow(r), isMutual: r.is_mutual as boolean })) as unknown as FollowUser[]
}
export async function getFollowers(userId: number): Promise<FollowUser[]> {
  const rows = await sql`
    SELECT u.id,u.name,u.avatar,u.bio,
      EXISTS(SELECT 1 FROM follows f2 WHERE f2.follower_id=${userId} AND f2.following_id=u.id) as is_mutual
    FROM follows f JOIN users u ON u.id=f.follower_id
    WHERE f.following_id=${userId} ORDER BY f.created_at DESC
  `
  return (rows as Record<string, unknown>[]).map(r => ({ ...serializeRow(r), isMutual: r.is_mutual as boolean })) as unknown as FollowUser[]
}
export async function getFollowCounts(userId: number): Promise<{ following: number; followers: number }> {
  const a = await sql`SELECT COUNT(*) as cnt FROM follows WHERE follower_id=${userId}`
  const b = await sql`SELECT COUNT(*) as cnt FROM follows WHERE following_id=${userId}`
  return { following: Number((a[0] as { cnt: string }).cnt), followers: Number((b[0] as { cnt: string }).cnt) }
}
