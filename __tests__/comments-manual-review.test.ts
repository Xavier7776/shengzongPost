vi.mock('@/lib/auth-rate-limit', () => ({ allowAuthAttempt: vi.fn().mockResolvedValue(true) }))
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
const { createComment, getSession, fetchSpy } = vi.hoisted(() => ({
  createComment: vi.fn(), getSession: vi.fn(), fetchSpy: vi.fn(),
}))
vi.mock('next-auth', () => ({ getServerSession: getSession }))
vi.mock('@/lib/authOptions', () => ({ authOptions: {} }))
vi.mock('@/lib/db', () => ({
  createComment, getApprovedComments: vi.fn(), toggleCommentLike: vi.fn(),
}))
import { POST } from '@/app/api/comments/route'
beforeEach(() => {
  createComment.mockReset().mockResolvedValue({ id: 42 })
  getSession.mockReset().mockResolvedValue({ user: { id: '7', name: 'Tester' } })
  fetchSpy.mockReset()
  vi.stubGlobal('fetch', fetchSpy)
})
afterEach(() => vi.unstubAllGlobals())

describe('comment moderation after removing AI endpoints', () => {
  it('keeps new comments pending for manual moderation with no model requests', async () => {
    const req = new NextRequest('https://example.test/api/comments', {
      method: 'POST', body: JSON.stringify({ post_slug: 'sample', content: '很有价值的分享' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await POST(req)
    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({ ok: true, pending: true })
    expect(createComment).toHaveBeenCalledWith(expect.objectContaining({
      post_slug: 'sample', user_id: 7, content: '很有价值的分享',
    }))
    expect(fetchSpy).not.toHaveBeenCalled()
  })
  it('rejects anonymous comments without database or model calls', async () => {
    getSession.mockResolvedValue(null)
    const req = new NextRequest('https://example.test/api/comments', {
      method: 'POST', body: JSON.stringify({ post_slug: 'sample', content: 'hello' }),
      headers: { 'Content-Type': 'application/json' },
    })
    expect((await POST(req)).status).toBe(401)
    expect(createComment).not.toHaveBeenCalled()
    expect(fetchSpy).not.toHaveBeenCalled()
  })
})
