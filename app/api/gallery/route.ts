import { logFailure } from '@/lib/security/log'
// app/api/gallery/route.ts
import { NextResponse } from 'next/server'
import { getAllGalleryImages } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const images = await getAllGalleryImages()
    return NextResponse.json(images)
  } catch (err) {
    logFailure('app/api/gallery', err)
    return NextResponse.json({ error: '获取失败' }, { status: 500 })
  }
}
