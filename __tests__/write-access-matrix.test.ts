// @vitest-environment node
/// <reference types="vite/client" />
import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
const { admin, session, effects } = vi.hoisted(() => ({ admin: vi.fn(), session: vi.fn(), effects: Object.fromEntries(["addPoints", "createComment", "createCursorEffect", "createEditRequest", "createFrame", "createGalleryImage", "createHeroSlide", "createPost", "createPostImage", "createProject", "createResearchReport", "deleteComment", "deleteCursorEffect", "deleteEditRequest", "deleteFrame", "deleteGalleryImage", "deleteHeroSlide", "deletePost", "deletePostImage", "deleteProject", "deleteReaction", "deleteResearchReport", "destroy", "equipCursorEffect", "equipFrame", "files", "getAdminUserId", "getAllCursorEffectsAdmin", "getAllFramesAdmin", "getAllHeroSlides", "getAllProjectsAdmin", "getApprovedComments", "getEditRequestById", "getEditRequestsByUser", "getEnabledHeroSlides", "getEnabledProjects", "getFollowCounts", "getFollowStatus", "getFollowers", "getFollowing", "getNotifications", "getPoints", "getPostBySlug", "getPostBySlugAdmin", "getPostImages", "getPostReactions", "getResearchReportById", "getResearchReports", "getUserBookmarks", "getUserById", "getUserByVerifyTokenAndId", "getUserEquippedCursorEffect", "getUserEquippedFrame", "getUserRoleById", "hasPointTransaction", "hasReadPost", "incrementViewCount", "isBookmarked", "markAllNotificationsAsRead", "markNotificationAsRead", "markPostRead", "publish", "purchaseCursorEffect", "purchaseFrame", "reviewEditRequest", "send", "setVerifyToken", "sql", "toggleBookmark", "toggleCommentLike", "toggleFollow", "trackVisitor", "updateCommentStatus", "updateCursorEffect", "updateFrame", "updateGalleryImage", "updateHeroSlide", "updatePost", "updateProject", "updateUserPassword", "upload", "upsertReaction"].map(name => [name, vi.fn()])) }))
vi.mock('@/lib/auth', () => ({ requireAdminApi: admin, requireAdmin: () => { throw new Error('API used page redirect') } }))
vi.mock('next-auth', () => ({ getServerSession: session }))
vi.mock('@/lib/authOptions', () => ({ authOptions: {} }))
vi.mock('@/lib/db', () => effects)
vi.mock('@/lib/db/_core', () => ({ sql: effects.sql }))
vi.mock('@/lib/uploadLarge', () => ({ uploadLarge: effects.upload }))
vi.mock('@/lib/learn/publish', () => ({ reviseEdition: effects.publish, publishEdition: effects.publish }))
vi.mock('cloudinary', () => ({ v2: { config: vi.fn(), uploader: { destroy: effects.destroy } } }))
vi.mock('resend', () => ({ Resend: class { emails = { send: effects.send } } }))
vi.mock('fs/promises', () => ({ mkdir: effects.files, writeFile: effects.files }))
vi.mock('node:fs/promises', () => ({ default: { mkdir: effects.files, writeFile: effects.files } }))
const routes = import.meta.glob('../app/api/**/route.ts')
const cases = [
  [
    "../app/api/admin/learn/[slug]/route.ts",
    "PATCH"
  ],
  [
    "../app/api/admin/shop/cursors/[id]/route.ts",
    "PATCH"
  ],
  [
    "../app/api/admin/shop/cursors/[id]/route.ts",
    "DELETE"
  ],
  [
    "../app/api/admin/shop/cursors/route.ts",
    "POST"
  ],
  [
    "../app/api/admin/shop/cursors/upload/route.ts",
    "POST"
  ],
  [
    "../app/api/admin/shop/frames/[id]/route.ts",
    "PATCH"
  ],
  [
    "../app/api/admin/shop/frames/[id]/route.ts",
    "DELETE"
  ],
  [
    "../app/api/admin/shop/frames/route.ts",
    "POST"
  ],
  [
    "../app/api/admin/shop/pets/import/route.ts",
    "POST"
  ],
  [
    "../app/api/bookmarks/route.ts",
    "POST"
  ],
  [
    "../app/api/comments/[id]/route.ts",
    "PATCH"
  ],
  [
    "../app/api/comments/[id]/route.ts",
    "DELETE"
  ],
  [
    "../app/api/comments/route.ts",
    "POST"
  ],
  [
    "../app/api/comments/route.ts",
    "PATCH"
  ],
  [
    "../app/api/edit-requests/all/[id]/route.ts",
    "PATCH"
  ],
  [
    "../app/api/edit-requests/route.ts",
    "POST"
  ],
  [
    "../app/api/follows/route.ts",
    "POST"
  ],
  [
    "../app/api/gallery/[id]/route.ts",
    "DELETE"
  ],
  [
    "../app/api/gallery/[id]/route.ts",
    "PATCH"
  ],
  [
    "../app/api/gallery/upload/route.ts",
    "POST"
  ],
  [
    "../app/api/notifications/read-all/route.ts",
    "POST"
  ],
  [
    "../app/api/notifications/route.ts",
    "POST"
  ],
  [
    "../app/api/posts/[slug]/route.ts",
    "PATCH"
  ],
  [
    "../app/api/posts/[slug]/route.ts",
    "DELETE"
  ],
  [
    "../app/api/posts/batch/route.ts",
    "POST"
  ],
  [
    "../app/api/posts/image/route.ts",
    "POST"
  ],
  [
    "../app/api/posts/image/route.ts",
    "DELETE"
  ],
  [
    "../app/api/posts/route.ts",
    "POST"
  ],
  [
    "../app/api/projects/[id]/route.ts",
    "PATCH"
  ],
  [
    "../app/api/projects/[id]/route.ts",
    "DELETE"
  ],
  [
    "../app/api/projects/route.ts",
    "POST"
  ],
  [
    "../app/api/projects/upload/route.ts",
    "POST"
  ],
  [
    "../app/api/reactions/route.ts",
    "POST"
  ],
  [
    "../app/api/research/points/route.ts",
    "POST"
  ],
  [
    "../app/api/research/reports/[id]/route.ts",
    "DELETE"
  ],
  [
    "../app/api/research/reports/route.ts",
    "POST"
  ],
  [
    "../app/api/shop/cursors/equip/route.ts",
    "POST"
  ],
  [
    "../app/api/shop/cursors/purchase/route.ts",
    "POST"
  ],
  [
    "../app/api/shop/frames/equip/route.ts",
    "POST"
  ],
  [
    "../app/api/shop/frames/purchase/route.ts",
    "POST"
  ],
  [
    "../app/api/slides/[id]/route.ts",
    "PATCH"
  ],
  [
    "../app/api/slides/[id]/route.ts",
    "DELETE"
  ],
  [
    "../app/api/slides/route.ts",
    "POST"
  ],
  [
    "../app/api/slides/upload/route.ts",
    "POST"
  ],
  [
    "../app/api/upload-md/route.ts",
    "POST"
  ],
  [
    "../app/api/user/avatar/route.ts",
    "POST"
  ],
  [
    "../app/api/user/password/route.ts",
    "POST"
  ],
  [
    "../app/api/user/password/route.ts",
    "PATCH"
  ],
  [
    "../app/api/user/profile/route.ts",
    "PATCH"
  ],
  [
    "../app/api/user/upload/route.ts",
    "POST"
  ]
]
beforeEach(() => { admin.mockReset().mockResolvedValue(null); session.mockReset().mockResolvedValue(null); for (const effect of Object.values(effects)) effect.mockClear() })
describe('every privileged or account-bound custom write entry', () => {
  it.each(cases)('%s %s rejects anonymous/spoofed identity without body or side effects', async (path, method) => {
    const handlers = await routes[path]() as Record<string, (req: NextRequest, ctx: unknown) => Promise<Response>>
    let reads = 0
    const body = new ReadableStream<Uint8Array>({ pull(controller) { reads++; controller.enqueue(new TextEncoder().encode('{"user_id":7,"role":"admin"}')); controller.close() } }, { highWaterMark: 0 })
    const req = new NextRequest('https://blog.test/api/test', { method, headers: { 'content-type': 'application/json', 'x-user-id': '7', 'x-role': 'admin' }, body, signal: new AbortController().signal, duplex: 'half' } as RequestInit & { signal: AbortSignal })
    const response = await handlers[method](req, { params: Promise.resolve({ id: '1', slug: 'test-only' }) })
    expect([401,403]).toContain(response.status)
    expect(reads).toBe(0)
    for (const effect of Object.values(effects)) expect(effect).not.toHaveBeenCalled()
  })
})
