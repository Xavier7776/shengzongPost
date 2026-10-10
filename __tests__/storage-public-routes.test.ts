// @vitest-environment node
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
const mocks = vi.hoisted(() => ({ admin: vi.fn(), session: vi.fn(), quota: vi.fn(), sql: vi.fn(), upload: vi.fn(), metadata: vi.fn(), remote: vi.fn(), list: vi.fn(), create: vi.fn(), update: vi.fn(), subscribe: vi.fn(), like: vi.fn(), track: vi.fn(), view: vi.fn(), reward: vi.fn(), bookmark: vi.fn(), reaction: vi.fn(), reactions: vi.fn() }))
vi.mock('@/lib/auth', () => ({ requireAdminApi: mocks.admin }))
vi.mock('next-auth', () => ({ getServerSession: mocks.session }))
vi.mock('@/lib/authOptions', () => ({ authOptions: {} }))
vi.mock('@/lib/db/_core', () => ({ sql: mocks.sql }))
vi.mock('@/lib/auth-rate-limit', async original => ({ ...await original<typeof import('@/lib/auth-rate-limit')>(), allowAuthAttempt: mocks.quota }))
vi.mock('@/lib/uploadLarge', () => ({ uploadLarge: mocks.upload }))
vi.mock('@/lib/security/pet-assets', async original => ({ ...await original<typeof import('@/lib/security/pet-assets')>(), readPetMetadata: mocks.metadata }))
vi.mock('@/lib/security/remote-assets', async original => ({ ...await original<typeof import('@/lib/security/remote-assets')>(), readRemoteBytes: mocks.remote }))
vi.mock('@/lib/db', () => ({ sql: mocks.sql, getAllCursorEffectsAdmin: mocks.list, createCursorEffect: mocks.create, updateCursorEffect: mocks.update, subscribeNewsletter: mocks.subscribe, likeGalleryImage: mocks.like, trackVisitor: mocks.track, incrementViewCount: mocks.view, rewardPostRead: mocks.reward, toggleBookmark: mocks.bookmark, toggleReaction: mocks.reaction, getPostReactions: mocks.reactions, getUserBookmarks: vi.fn(), isBookmarked: vi.fn() }))
import { POST as avatar } from '@/app/api/user/avatar/route'
import { POST as cursor } from '@/app/api/admin/shop/cursors/upload/route'
import { POST as pet } from '@/app/api/admin/shop/pets/import/route'
import { POST as newsletter } from '@/app/api/newsletter/route'
import { POST as like } from '@/app/api/gallery/[id]/like/route'
import { POST as analytics } from '@/app/api/analytics/track/route'
import { POST as view } from '@/app/api/posts/view/route'
import { POST as bookmark } from '@/app/api/bookmarks/route'
import { POST as reaction } from '@/app/api/reactions/route'
const png = Uint8Array.from([137,80,78,71,13,10,26,10,0])
const gif = Buffer.from('GIF89a' + 'synthetic')
const url = 'https://res.cloudinary.com/test/image/upload/new.png'
const petSource = 'https://codex-pets.net/assets/pets/test.png'
function json(path: string, body: unknown, headers = {}) {
  return new NextRequest('https://blog.test' + path, { method: 'POST', headers: { Origin: 'https://blog.test', 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) })
}
function multipart(path: string, bytes: Uint8Array, type = 'image/png', name = 'file.png') {
  const data = new FormData()
  data.set('file', new Blob([bytes as BlobPart], { type }), name)
  data.set('key', 'test')
  return new NextRequest('https://blog.test' + path, { method: 'POST', headers: { Origin: 'https://blog.test' }, body: data })
}
beforeEach(() => {
  Object.values(mocks).forEach(mock => mock.mockReset())
  vi.stubEnv('NEXTAUTH_SECRET', 'synthetic-secret')
  mocks.admin.mockResolvedValue({ user: { id: '7' } })
  mocks.session.mockResolvedValue({ user: { id: '7' } })
  mocks.quota.mockResolvedValue(true)
  mocks.upload.mockResolvedValue({ secure_url: url, public_id: 'new', width: 1536, height: 1872 })
  mocks.metadata.mockResolvedValue({ pet: { id: 'test', description: 'safe', spritesheetUrl: petSource, validationReport: { cellSize: '192x208' } } })
  mocks.remote.mockResolvedValue(png)
  mocks.list.mockResolvedValue([])
  mocks.create.mockResolvedValue({ id: 3 })
  mocks.subscribe.mockResolvedValue({ alreadySubscribed: false })
  mocks.like.mockResolvedValue(1)
})
afterEach(() => vi.unstubAllEnvs())
it('stores an immutable avatar and fails without a local fallback or DB write when provider fails', async () => {
  expect((await avatar(multipart('/api/user/avatar', png))).status).toBe(200)
  expect(mocks.upload).toHaveBeenCalledWith(expect.any(Buffer), expect.objectContaining({ overwrite: false, public_id: expect.stringMatching(/^user_7_/), transformation: [{ width: 200, height: 200, crop: 'fill', gravity: 'face' }] }))
  expect(mocks.sql.mock.calls[0].slice(1)).toEqual([url, 7])
  mocks.sql.mockClear(); mocks.upload.mockRejectedValue(new Error('provider failure'))
  const failure = await avatar(multipart('/api/user/avatar', png))
  expect(failure.status).toBe(500)
  expect(JSON.stringify(await failure.json())).not.toContain('/avatars/')
  expect(mocks.sql).not.toHaveBeenCalled()
})
it('rejects disguised images, GIF avatars, unauthorized cursor uploads, and invalid keys before storage', async () => {
  expect((await avatar(multipart('/api/user/avatar', gif, 'image/png'))).status).toBe(400)
  expect((await cursor(multipart('/api/admin/shop/cursors/upload', png, 'image/gif', 'fake.gif'))).status).toBe(400)
  mocks.admin.mockResolvedValue(null)
  expect((await cursor(multipart('/api/admin/shop/cursors/upload', gif, 'image/gif', 'test.gif'))).status).toBe(401)
  expect(mocks.upload).not.toHaveBeenCalled()
})
it('stores original cursor GIF bytes with a unique ID and no transformation', async () => {
  expect((await cursor(multipart('/api/admin/shop/cursors/upload', gif, 'image/gif', 'test.gif'))).status).toBe(200)
  expect(mocks.upload).toHaveBeenCalledWith(gif, expect.objectContaining({ overwrite: false, public_id: expect.stringMatching(/^test_/), resource_type: 'image' }))
  expect(mocks.upload.mock.calls[0][1]).not.toHaveProperty('transformation')
})
it('imports the unchanged atlas into durable storage and preserves a previous poster on update', async () => {
  mocks.list.mockResolvedValue([{ id: 12, key: 'test', poster_url: 'https://res.cloudinary.com/test/image/upload/old.png' }])
  const response = await pet(json('/api/admin/shop/pets/import', { key: 'test', price: 0 }))
  expect(response.status).toBe(200)
  expect(mocks.update).toHaveBeenCalledWith(12, expect.objectContaining({ sprite_url: url, price: 0, cols: 8, rows: 9, poster_url: 'https://res.cloudinary.com/test/image/upload/old.png' }))
  expect((await response.json()).posterUrl).toBe('https://res.cloudinary.com/test/image/upload/old.png')
})
it('validates price, both downloads, metadata and atlas geometry before the corresponding effects', async () => {
  expect((await pet(json('/api/admin/shop/pets/import', { key: 'test', price: -1 }))).status).toBe(400)
  expect(mocks.metadata).not.toHaveBeenCalled()
  mocks.metadata.mockResolvedValue({ pet: { id: 'test', spritesheetUrl: petSource, posterUrl: petSource, tags: [42] } })
  expect((await pet(json('/api/admin/shop/pets/import', { key: 'test' }))).status).toBe(500)
  expect(mocks.upload).not.toHaveBeenCalled()
  mocks.metadata.mockResolvedValue({ pet: { id: 'test', spritesheetUrl: petSource, posterUrl: petSource } })
  mocks.remote.mockResolvedValueOnce(png).mockResolvedValueOnce(Buffer.from('<svg/>'))
  expect((await pet(json('/api/admin/shop/pets/import', { key: 'test' }))).status).toBe(500)
  expect(mocks.upload).not.toHaveBeenCalled()
  mocks.upload.mockResolvedValue({ secure_url: url, public_id: 'new', width: 1, height: 1 })
  expect((await pet(json('/api/admin/shop/pets/import', { key: 'test' }))).status).toBe(500)
  expect(mocks.create).not.toHaveBeenCalled(); expect(mocks.update).not.toHaveBeenCalled()
})
it('does not mutate pet records when storage or DB confirmation fails', async () => {
  mocks.upload.mockRejectedValue(new Error('provider failure'))
  expect((await pet(json('/api/admin/shop/pets/import', { key: 'test' }))).status).toBe(500)
  expect(mocks.create).not.toHaveBeenCalled()
  mocks.upload.mockResolvedValue({ secure_url: url, public_id: 'new', width: 1536, height: 1872 })
  mocks.create.mockRejectedValue(new Error('DB unavailable'))
  expect((await pet(json('/api/admin/shop/pets/import', { key: 'test' }))).status).toBe(500)
  expect(mocks.upload).toHaveBeenCalledTimes(2)
})
it('throttles public writes before mutations and does not coerce invalid emails or IDs', async () => {
  expect((await newsletter(json('/api/newsletter', { email: ['x@test.invalid'] }))).status).toBe(400)
  expect((await like(json('/api/gallery/0/like', {}), { params: { id: '0' } })).status).toBe(400)
  mocks.quota.mockResolvedValue(false)
  expect((await newsletter(json('/api/newsletter', { email: 'USER@TEST.INVALID' }))).status).toBe(429)
  expect(mocks.quota).toHaveBeenCalledWith(expect.any(Request), 'newsletter', 'user@test.invalid')
  expect((await like(json('/api/gallery/1/like', {}), { params: { id: '1' } })).status).toBe(429)
  expect((await view(json('/api/posts/view', { slug: 'safe' }))).status).toBe(429)
  expect((await bookmark(json('/api/bookmarks', { slug: 'safe' }))).status).toBe(429)
  expect((await reaction(json('/api/reactions', { slug: 'safe', type: 'like' }))).status).toBe(429)
  for (const name of ['subscribe', 'like', 'view', 'reward', 'bookmark', 'reaction'] as const) expect(mocks[name]).not.toHaveBeenCalled()
})
const tracking = { path: '/blog/test?token=secret#fragment', referrer: 'https://source.test/private?token=secret', sessionId: '12345678-1234-4123-8123-123456789abc', visitorId: '87654321-1234-4123-8123-123456789abc', isLoggedIn: true }
it('minimizes analytics records and derives signed-in status exclusively from server session', async () => {
  mocks.session.mockResolvedValue(null)
  expect((await analytics(json('/api/analytics/track', tracking, { 'x-real-ip': '203.0.113.7', 'user-agent': 'private-agent' }))).status).toBe(204)
  expect(mocks.track).toHaveBeenCalledWith(expect.objectContaining({ path: '/blog/test', referrer: 'https://source.test', user_agent: null, ip_hash: expect.stringMatching(/^[a-f0-9]{32}$/), is_logged_in: false }))
  expect(JSON.stringify(mocks.track.mock.calls)).not.toContain('secret')
  expect(JSON.stringify(mocks.track.mock.calls)).not.toContain('203.0.113.7')
})
it('rejects private paths, malformed IDs and oversized tracking before effects, and drops throttled events', async () => {
  for (const path of ['/admin/reviews', '/onlyus/pet', '/login', '/profile/123', '//evil.test']) {
    expect((await analytics(json('/api/analytics/track', { ...tracking, path }))).status).toBe(204)
  }
  expect((await analytics(json('/api/analytics/track', { ...tracking, visitorId: 'forged' }))).status).toBe(204)
  expect(mocks.quota).not.toHaveBeenCalled()
  expect((await analytics(json('/api/analytics/track', { ...tracking, extra: 'x'.repeat(17*1024) }))).status).toBe(413)
  mocks.quota.mockResolvedValue(false)
  expect((await analytics(json('/api/analytics/track', tracking))).status).toBe(204)
  expect(mocks.track).not.toHaveBeenCalled()
})
