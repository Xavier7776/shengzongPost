import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
const { session, admin, getPrivate, getPublished, dbRole, sql, revalidate } = vi.hoisted(() => ({
  session: vi.fn(), admin: vi.fn(), getPrivate: vi.fn(), getPublished: vi.fn(),
  dbRole: vi.fn(), sql: vi.fn(), revalidate: vi.fn(),
}))
vi.mock('next-auth', () => ({ getServerSession: session }))
vi.mock('@/lib/authOptions', () => ({ authOptions: {} }))
vi.mock('@/lib/auth', () => ({ requireAdminApi: admin }))
vi.mock('@/lib/db', () => ({
  getPostBySlugAdmin: getPrivate,
  getPostBySlug: getPublished,
  getUserRoleById: dbRole,
  updatePost: vi.fn(), deletePost: vi.fn(),
  sql,
}))
vi.mock('next/cache', () => ({ revalidateTag: vi.fn(), revalidatePath: revalidate }))
import { GET } from '@/app/api/posts/[slug]/route'
import { POST as batchPost } from '@/app/api/posts/batch/route'

const item = { slug: 'article', content: 'Published body', published: true, author_id: 7 }
const getReq = new NextRequest('https://blog.example/api/posts/article')
function batchRequest(action: string, slugs: unknown) {
  return new NextRequest('https://blog.example/api/posts/batch', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ action, slugs }),
  })
}
const ctx = { params: Promise.resolve({ slug: 'article' }) }
beforeEach(() => {
  for (const stub of [session, admin, getPrivate, getPublished, dbRole, sql, revalidate]) stub.mockReset()
  session.mockResolvedValue({ user: { id: '7', role: 'user' } })
  dbRole.mockResolvedValue('user')
  getPublished.mockResolvedValue(item)
  getPrivate.mockResolvedValue({ ...item, published: false, content: 'Draft' })
  admin.mockResolvedValue(null)
  sql.mockResolvedValue([])
})

describe('article content access policy', () => {
  it('rejects anonymous users', async () => {
    session.mockResolvedValue(null)
    expect((await GET(getReq, ctx)).status).toBe(401)
    expect(getPrivate).not.toHaveBeenCalled()
  })
  it('lets a post owner see their published content without exposing a private draft', async () => {
    const response = await GET(getReq, ctx)
    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe('private, no-store')
    expect(await response.json()).toMatchObject({ content: 'Published body', author_id: 7 })
    expect(getPrivate).not.toHaveBeenCalled()
  })
  it('hides posts belonging to other users, even when published', async () => {
    getPublished.mockResolvedValue({ ...item, author_id: 1 })
    expect((await GET(getReq, ctx)).status).toBe(404)
    expect(getPrivate).not.toHaveBeenCalled()
  })
  it('hides draft content from non-admin and revoked admin JWTs', async () => {
    getPublished.mockResolvedValue(null)
    expect((await GET(getReq, ctx)).status).toBe(404)
    session.mockResolvedValue({ user: { id: '7', role: 'admin' } })
    expect((await GET(getReq, ctx)).status).toBe(404)
    expect(getPrivate).not.toHaveBeenCalled()
  })
  it('allows a live database-backed admin to view draft content', async () => {
    session.mockResolvedValue({ user: { id: '7', role: 'admin' } })
    dbRole.mockResolvedValue('admin')
    const response = await GET(getReq, ctx)
    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({ content: 'Draft', published: false })
    expect(getPrivate).toHaveBeenCalledWith('article')
    expect(getPublished).not.toHaveBeenCalled()
  })
})

describe('bulk post mutations', () => {
  it('rejects ordinary users before reading or changing data', async () => {
    expect((await batchPost(batchRequest('delete', ['article']))).status).toBe(403)
    expect(sql).not.toHaveBeenCalled()
  })
  it('rejects invalid action, excessive batch size and malformed slugs', async () => {
    admin.mockResolvedValue({ user: { role: 'admin' } })
    expect((await batchPost(batchRequest('invalid', ['article']))).status).toBe(400)
    expect((await batchPost(batchRequest('delete', new Array(51).fill('a')))).status).toBe(400)
    expect((await batchPost(batchRequest('delete', ['article', 4]))).status).toBe(400)
    expect(sql).not.toHaveBeenCalled()
  })
  it('counts only affected rows and invalidates public paths', async () => {
    admin.mockResolvedValue({ user: { role: 'admin' } })
    sql.mockResolvedValue([{ slug: 'article' }])
    const response = await batchPost(batchRequest('unpublish', ['article', 'missing', 'article']))
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ ok: true, count: 1 })
    expect(revalidate).toHaveBeenCalledWith('/blog')
    expect(revalidate).toHaveBeenCalledWith('/learn')
    expect(revalidate).toHaveBeenCalledWith('/blog/article')
    expect(sql).toHaveBeenCalledOnce()
  })
})
