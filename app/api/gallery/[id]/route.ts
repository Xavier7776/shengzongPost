import { logFailure } from '@/lib/security/log'
import { withWriteGuard } from '@/lib/security/write-guard'
// app/api/gallery/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/auth'
import { deleteGalleryImage, updateGalleryImage } from '@/lib/db'
import { deleteGitHubAsset } from '@/lib/github-assets'

async function handleDELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!await requireAdminApi()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const id = Number((await params).id)
    const publicId = await deleteGalleryImage(id)

    // Remove new GitHub branch entries; historical provider assets stay available.
    await deleteGitHubAsset(publicId)

    return NextResponse.json({ success: true })
  } catch (err) {
    logFailure('app/api/gallery/[id]', err)
    return NextResponse.json({ error: '删除失败' }, { status: 500 })
  }
}

async function handlePATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!await requireAdminApi()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const id = Number((await params).id)
    const data = await req.json()
    const image = await updateGalleryImage(id, data)
    return NextResponse.json({ success: true, image })
  } catch (err) {
    logFailure('app/api/gallery/[id]', err)
    return NextResponse.json({ error: '更新失败' }, { status: 500 })
  }
}

export const DELETE = withWriteGuard(handleDELETE)
export const PATCH = withWriteGuard(handlePATCH)
