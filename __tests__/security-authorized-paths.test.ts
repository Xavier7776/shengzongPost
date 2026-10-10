// @vitest-environment node
import { NextRequest } from 'next/server'
import { beforeEach, expect, it, vi } from 'vitest'
const mocks = vi.hoisted(() => ({ admin: vi.fn(), session: vi.fn(), sql: vi.fn(), upload: vi.fn(), gallery: vi.fn(), report: vi.fn(), remove: vi.fn(), edit: vi.fn(), quota: vi.fn(), adminId: vi.fn(), image: vi.fn() }))
vi.mock('@/lib/auth', () => ({ requireAdminApi: mocks.admin }))
vi.mock('next-auth', () => ({ getServerSession: mocks.session }))
vi.mock('@/lib/authOptions', () => ({ authOptions: {} }))
vi.mock('@/lib/auth-rate-limit', () => ({ allowAuthAttempt: mocks.quota }))
vi.mock('@/lib/uploadLarge', () => ({ uploadLarge: mocks.upload }))
vi.mock('@/lib/db', () => ({ sql: mocks.sql, createGalleryImage: mocks.gallery, getResearchReportById: mocks.report, deleteResearchReport: mocks.remove, getEditRequestById: mocks.edit, createPostImage: mocks.image, getAdminUserId: mocks.adminId, getPostImages: vi.fn(), deletePostImage: vi.fn() }))
vi.mock('cloudinary', () => ({ v2: { config: vi.fn(), uploader: { destroy: vi.fn() } } }))
import { POST as galleryUpload } from '@/app/api/gallery/upload/route'
import { POST as postUpload } from '@/app/api/posts/image/route'
import { PATCH as profile } from '@/app/api/user/profile/route'
import { GET as ownEdit } from '@/app/api/edit-requests/my/[id]/route'
import { DELETE as removeReport } from '@/app/api/research/reports/[id]/route'
beforeEach(() => {
  Object.values(mocks).forEach(mock => mock.mockReset())
  mocks.admin.mockResolvedValue({ user: { id: '7', role: 'admin' } })
  mocks.session.mockResolvedValue({ user: { id: '7', role: 'user' } })
  mocks.quota.mockResolvedValue(true)
  mocks.upload.mockResolvedValue({ secure_url: 'https://res.cloudinary.com/test/image/upload/test.png', public_id: 'test', width: 1, height: 1 })
  mocks.gallery.mockImplementation(async value => value)
  mocks.image.mockImplementation(async value => ({ ...value, id: 3 }))
})
const json = (url: string, data: unknown) => new NextRequest('https://blog.test'+url, { method: 'PATCH', headers: { Origin: 'https://blog.test', Cookie: 'signed-session=test', 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
function multipart(bytes: Uint8Array) {
  const form = new FormData()
  form.set('file', new Blob([bytes as BlobPart], { type: 'image/png' }), 'test.png')
  return new NextRequest('https://blog.test/api/gallery/upload', { method: 'POST', headers: { Origin: 'https://blog.test' }, body: form })
}
it('accepts authorized raster uploads and rejects disguised HTML before provider/database writes', async () => {
  const fakeUpload = await galleryUpload(multipart(new TextEncoder().encode('<script>alert(1)</script>')))
  expect(fakeUpload.status).toBe(400)
  expect(mocks.upload).not.toHaveBeenCalled()
  const png = Uint8Array.from([137,80,78,71,13,10,26,10,0])
  expect((await galleryUpload(multipart(png))).status).toBe(200)
  expect(mocks.upload).toHaveBeenCalledTimes(1)
  expect(mocks.gallery).toHaveBeenCalledWith(expect.objectContaining({ public_id: 'test' }))
  mocks.admin.mockResolvedValue({ user: { role: 'admin' } })
  mocks.adminId.mockResolvedValue(9)
  expect((await postUpload(multipart(png))).status).toBe(200)
  expect(mocks.image).toHaveBeenCalledWith(expect.objectContaining({ uploaded_by: 9 }))
})
it('uses the signed owner ID rather than client identity or role fields', async () => {
  expect((await profile(json('/api/user/profile', { name: 'User', id: 99, role: 'admin', website: 'javascript:alert(1)' }))).status).toBe(400)
  expect(mocks.sql).not.toHaveBeenCalled()
  expect((await profile(json('/api/user/profile', { name: 42 }))).status).toBe(400)
  expect((await profile(json('/api/user/profile', { name: 'User', id: 99, role: 'admin' }))).status).toBe(200)
  expect(mocks.sql.mock.calls[0].at(-1)).toBe(7)
  expect(mocks.sql.mock.calls[0][0].join('')).not.toMatch(/role\s*=/)
  mocks.edit.mockResolvedValue({ user_id: 99, content: 'private' })
  const get = new NextRequest('https://blog.test/api/edit-requests/my/3')
  expect((await ownEdit(get, { params: { id: '3' } })).status).toBe(403)
  mocks.edit.mockResolvedValue({ user_id: 7, content: 'own' })
  expect((await ownEdit(get, { params: { id: '3' } })).status).toBe(200)
  const deletion = new NextRequest('https://blog.test/api/research/reports/3', { method: 'DELETE', headers: { Origin: 'https://blog.test' } })
  expect((await removeReport(deletion, { params: Promise.resolve({ id: '3' }) })).status).toBe(200)
  expect(mocks.remove).toHaveBeenCalledWith(7, 3)
})
