// app/api/gallery/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { deleteGalleryImage, updateGalleryImage } from '@/lib/db'
import { cloudinary } from '@/lib/cloudinary'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin()
    const id = Number(params.id)
    const publicId = await deleteGalleryImage(id)

    // 同步删除 Cloudinary 上的文件
    await cloudinary.uploader.destroy(publicId)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[gallery/delete]', err)
    return NextResponse.json({ error: '删除失败' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin()
    const id = Number(params.id)
    const data = await req.json()
    const image = await updateGalleryImage(id, data)
    return NextResponse.json({ success: true, image })
  } catch (err) {
    console.error('[gallery/patch]', err)
    return NextResponse.json({ error: '更新失败' }, { status: 500 })
  }
}
