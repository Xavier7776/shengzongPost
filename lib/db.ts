// lib/db.ts
import { neon } from '@neondatabase/serverless'

if (!process.env.DATABASE_URL) throw new Error('Missing DATABASE_URL')
export const sql = neon(process.env.DATABASE_URL)

// ─── serializer ───────────────────────────────────────────────────────────────
function serializeRow(row: Record<string, unknown>): Record<string, unknown> {
  const r: Record<string, unknown> = {}
  for (const k of Object.keys(row))
    r[k] = row[k] instanceof Date ? (row[k] as Date).toISOString() : row[k]
  return r
}
function serializeRows(rows: Record<string, unknown>[]) { return rows.map(serializeRow) }

// ─── Posts ────────────────────────────────────────────────────────────────────
export interface Post {
  id: number; slug: string; title: string; excerpt: string; content: string
  tags: string[]; published: boolean; created_at: string; updated_at: string
}
export type PostMeta = Omit<Post, 'content'>

export async function getAllPosts(): Promise<PostMeta[]> {
  const rows = await sql`SELECT id,slug,title,excerpt,tags,published,created_at,updated_at FROM posts WHERE published=true ORDER BY created_at DESC`
  return serializeRows(rows as Record<string, unknown>[]) as unknown as PostMeta[]
}
export async function getPostBySlug(slug: string): Promise<Post | null> {
  const rows = await sql`SELECT * FROM posts WHERE slug=${slug} AND published=true LIMIT 1`
  return rows[0] ? serializeRow(rows[0] as Record<string, unknown>) as unknown as Post : null
}
export async function getAllPostsAdmin(): Promise<PostMeta[]> {
  const rows = await sql`SELECT id,slug,title,excerpt,tags,published,created_at,updated_at FROM posts ORDER BY created_at DESC`
  return serializeRows(rows as Record<string, unknown>[]) as unknown as PostMeta[]
}
export async function getPostBySlugAdmin(slug: string): Promise<Post | null> {
  const rows = await sql`SELECT * FROM posts WHERE slug=${slug} LIMIT 1`
  return rows[0] ? serializeRow(rows[0] as Record<string, unknown>) as unknown as Post : null
}
export async function createPost(data: { slug: string; title: string; excerpt: string; content: string; tags: string[]; published: boolean }): Promise<Post> {
  const rows = await sql`INSERT INTO posts(slug,title,excerpt,content,tags,published) VALUES(${data.slug},${data.title},${data.excerpt},${data.content},${data.tags},${data.published}) RETURNING *`
  return serializeRow(rows[0] as Record<string, unknown>) as unknown as Post
}
export async function updatePost(slug: string, data: Partial<{ title: string; excerpt: string; content: string; tags: string[]; published: boolean; slug: string }>): Promise<Post> {
  const rows = await sql`UPDATE posts SET title=COALESCE(${data.title??null},title),excerpt=COALESCE(${data.excerpt??null},excerpt),content=COALESCE(${data.content??null},content),tags=COALESCE(${data.tags??null},tags),published=COALESCE(${data.published??null},published),slug=COALESCE(${data.slug??null},slug),updated_at=NOW() WHERE slug=${slug} RETURNING *`
  return serializeRow(rows[0] as Record<string, unknown>) as unknown as Post
}
export async function deletePost(slug: string): Promise<void> { await sql`DELETE FROM posts WHERE slug=${slug}` }
export async function incrementViewCount(slug: string): Promise<void> {
  await sql`UPDATE posts SET view_count = COALESCE(view_count, 0) + 1 WHERE slug=${slug}`
}
export async function getOrCreateAiBot(): Promise<User> {
  const existing = await sql`SELECT * FROM users WHERE email='ai-bot@system.internal' LIMIT 1`
  if (existing[0]) return serializeRow(existing[0] as Record<string, unknown>) as unknown as User
  const rows = await sql`
    INSERT INTO users(email, name, password, role, verified)
    VALUES('ai-bot@system.internal', 'AI 助手', 'DISABLED', 'ai', true)
    RETURNING *
  `
  return serializeRow(rows[0] as Record<string, unknown>) as unknown as User
}

// ─── Gallery ─────────────────────────────────────────────────────────────────
export interface GalleryImage { id: number; url: string; public_id: string; title: string; category: string; sort_order: number; created_at: string }
export async function getAllGalleryImages(): Promise<GalleryImage[]> {
  const rows = await sql`SELECT * FROM gallery_images ORDER BY sort_order ASC, created_at DESC`
  return serializeRows(rows as Record<string, unknown>[]) as unknown as GalleryImage[]
}
export async function createGalleryImage(data: { url: string; public_id: string; title: string; category: string }): Promise<GalleryImage> {
  const rows = await sql`INSERT INTO gallery_images(url,public_id,title,category) VALUES(${data.url},${data.public_id},${data.title},${data.category}) RETURNING *`
  return serializeRow(rows[0] as Record<string, unknown>) as unknown as GalleryImage
}
export async function updateGalleryImage(id: number, data: Partial<{ title: string; category: string; sort_order: number }>): Promise<GalleryImage> {
  const rows = await sql`UPDATE gallery_images SET title=COALESCE(${data.title??null},title),category=COALESCE(${data.category??null},category),sort_order=COALESCE(${data.sort_order??null},sort_order) WHERE id=${id} RETURNING *`
  return serializeRow(rows[0] as Record<string, unknown>) as unknown as GalleryImage
}
export async function deleteGalleryImage(id: number): Promise<string> {
  const rows = await sql`DELETE FROM gallery_images WHERE id=${id} RETURNING public_id`
  return (rows[0] as { public_id: string }).public_id
}

// ─── Users ────────────────────────────────────────────────────────────────────
export interface User {
  id: number; email: string; name: string; password: string
  role: string; phone: string | null; bio: string | null; avatar: string | null
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
export async function createUser(data: { email: string; name: string; password: string }): Promise<User> {
  const rows = await sql`INSERT INTO users(email,name,password) VALUES(${data.email},${data.name},${data.password}) RETURNING *`
  return serializeRow(rows[0] as Record<string, unknown>) as unknown as User
}
export async function updateUserProfile(id: number, data: { name: string; phone?: string | null; bio?: string | null; avatar?: string | null }): Promise<void> {
  await sql`UPDATE users SET name=${data.name},phone=${data.phone??null},bio=${data.bio??null},avatar=${data.avatar??null} WHERE id=${id}`
}
export async function setVerifyToken(userId: number, token: string, expires: Date): Promise<void> {
  await sql`UPDATE users SET verify_token=${token},token_expires=${expires.toISOString()} WHERE id=${userId}`
}
export async function getUserByVerifyToken(token: string): Promise<User | null> {
  const rows = await sql`SELECT * FROM users WHERE verify_token=${token} AND token_expires>NOW() LIMIT 1`
  return rows[0] ? serializeRow(rows[0] as Record<string, unknown>) as unknown as User : null
}
export async function markUserVerified(userId: number): Promise<void> {
  await sql`UPDATE users SET verified=true,verify_token=NULL,token_expires=NULL WHERE id=${userId}`
}

// ─── Comments ────────────────────────────────────────────────────────────────
export interface Comment {
  id: number; post_slug: string; user_id: number; user_name: string
  user_role: string; user_avatar: string | null
  content: string; status: 'pending'|'approved'|'rejected'
  parent_id: number | null; created_at: string
  replies?: Comment[]
}
export async function getApprovedComments(postSlug: string): Promise<Comment[]> {
  const rows = await sql`
    SELECT c.*, u.role as user_role, u.avatar as user_avatar
    FROM comments c
    LEFT JOIN users u ON u.id = c.user_id
    WHERE c.post_slug=${postSlug} AND c.status='approved'
    ORDER BY c.created_at ASC
  `
  const all = serializeRows(rows as Record<string, unknown>[]) as unknown as Comment[]
  // 组装嵌套结构
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

// 删除某篇文章下 AI bot 发布的所有评论（重新发布时先清理，避免重复）
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

// ─── Bookmarks ────────────────────────────────────────────────────────────────
export async function isBookmarked(slug: string, userId: number): Promise<boolean> {
  const rows = await sql`SELECT 1 FROM bookmarks WHERE post_slug=${slug} AND user_id=${userId} LIMIT 1`
  return rows.length > 0
}
export async function toggleBookmark(slug: string, userId: number): Promise<boolean> {
  const exists = await isBookmarked(slug, userId)
  if (exists) { await sql`DELETE FROM bookmarks WHERE post_slug=${slug} AND user_id=${userId}`; return false }
  else { await sql`INSERT INTO bookmarks(post_slug,user_id) VALUES(${slug},${userId})`; return true }
}
export async function getUserBookmarks(userId: number): Promise<PostMeta[]> {
  const rows = await sql`SELECT p.id,p.slug,p.title,p.excerpt,p.tags,p.published,p.created_at,p.updated_at FROM bookmarks b JOIN posts p ON p.slug=b.post_slug WHERE b.user_id=${userId} ORDER BY b.created_at DESC`
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

// ─── Post Images ──────────────────────────────────────────────────────────────
export interface PostImage {
  id: number
  post_slug: string | null   // 关联文章 slug，插入时可为空（先上传后关联）
  url: string
  public_id: string          // Cloudinary public_id，用于删除
  filename: string           // 原始文件名
  size: number               // 文件大小（bytes）
  mime_type: string
  uploaded_by: number        // 上传者 user_id
  created_at: string
}

export async function createPostImage(data: {
  post_slug: string | null
  url: string
  public_id: string
  filename: string
  size: number
  mime_type: string
  uploaded_by: number
}): Promise<PostImage> {
  const rows = await sql`
    INSERT INTO post_images(post_slug, url, public_id, filename, size, mime_type, uploaded_by)
    VALUES(${data.post_slug}, ${data.url}, ${data.public_id}, ${data.filename}, ${data.size}, ${data.mime_type}, ${data.uploaded_by})
    RETURNING *
  `
  return serializeRow(rows[0] as Record<string, unknown>) as unknown as PostImage
}

export async function getPostImages(postSlug?: string): Promise<PostImage[]> {
  const rows = postSlug
    ? await sql`SELECT * FROM post_images WHERE post_slug=${postSlug} ORDER BY created_at DESC`
    : await sql`SELECT * FROM post_images ORDER BY created_at DESC`
  return serializeRows(rows as Record<string, unknown>[]) as unknown as PostImage[]
}

export async function deletePostImage(id: number): Promise<{ public_id: string } | null> {
  const rows = await sql`DELETE FROM post_images WHERE id=${id} RETURNING public_id`
  return rows[0] ? { public_id: rows[0].public_id as string } : null
}

export async function updatePostImageSlug(id: number, postSlug: string): Promise<void> {
  await sql`UPDATE post_images SET post_slug=${postSlug} WHERE id=${id}`
}
