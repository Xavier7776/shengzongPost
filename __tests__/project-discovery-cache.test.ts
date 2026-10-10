import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
const { admin, create, update, remove, invalidate } = vi.hoisted(() => ({ admin: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn(), invalidate: vi.fn() }))
vi.mock('@/lib/auth', () => ({ requireAdminApi: admin }))
vi.mock('@/lib/db', () => ({ createProject: create, updateProject: update, deleteProject: remove, getEnabledProjects: vi.fn(), getAllProjectsAdmin: vi.fn() }))
vi.mock('@/lib/content-cache', () => ({ invalidatePublishedContent: invalidate }))
vi.mock('@/lib/cloudinary', () => ({ cloudinary: { uploader: { destroy: vi.fn() } } }))
import { POST } from '@/app/api/projects/route'
import { PATCH, DELETE } from '@/app/api/projects/[id]/route'
const req = (method: string, body?: unknown) => new NextRequest('https://site.example/api/projects/1', { method, ...(body === undefined ? {} : { body: JSON.stringify(body) }) })
beforeEach(() => {
  for (const mock of [admin, create, update, remove, invalidate]) mock.mockReset()
  admin.mockResolvedValue({ user: { id: '1', role: 'admin' } })
  create.mockResolvedValue({ slug: 'New', name: 'New', enabled: true })
  update.mockResolvedValue({ slug: 'Mnemo', enabled: false })
  remove.mockResolvedValue(null)
  invalidate.mockReturnValue('invalidated')
})
describe('committed project changes invalidate recommendations', () => {
  it('rejects anonymous writes before any mutation or discovery invalidation', async () => {
    admin.mockResolvedValue(null)
    expect((await POST(req('POST', {}))).status).toBe(401)
    expect((await PATCH(req('PATCH', {}), { params: { id: '1' } })).status).toBe(401)
    expect((await DELETE(req('DELETE'), { params: { id: '1' } })).status).toBe(401)
    for (const mock of [create, update, remove, invalidate]) expect(mock).not.toHaveBeenCalled()
  })
  it('invalidates created, disabled and deleted projects only after each database commit', async () => {
    expect((await POST(req('POST', { slug: 'New', name: 'New' }))).headers.get('X-Content-Cache-Status')).toBe('invalidated')
    expect(create.mock.invocationCallOrder[0]).toBeLessThan(invalidate.mock.invocationCallOrder[0])
    invalidate.mockClear()
    expect((await PATCH(req('PATCH', { enabled: false }), { params: { id: '1' } })).status).toBe(200)
    expect(update).toHaveBeenCalledWith(1, { enabled: false })
    expect(update.mock.invocationCallOrder[0]).toBeLessThan(invalidate.mock.invocationCallOrder[0])
    invalidate.mockClear()
    expect((await DELETE(req('DELETE'), { params: { id: '1' } })).status).toBe(200)
    expect(remove.mock.invocationCallOrder[0]).toBeLessThan(invalidate.mock.invocationCallOrder[0])
  })
  it('reports a committed update even if caches fail, and never invalidates a rejected database mutation', async () => {
    invalidate.mockReturnValue('failed')
    const response = await PATCH(req('PATCH', { enabled: false }), { params: { id: '1' } })
    expect(response.status).toBe(200)
    expect(response.headers.get('X-Content-Cache-Status')).toBe('failed')
    expect((await response.json()).ok).toBe(true)
    invalidate.mockClear(); update.mockRejectedValue(new Error('unique constraint'))
    expect((await PATCH(req('PATCH', { slug: 'Taken' }), { params: { id: '1' } })).status).toBe(409)
    expect(invalidate).not.toHaveBeenCalled()
  })
})
