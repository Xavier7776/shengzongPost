import SectionHeading from '@/components/ui/SectionHeading'
import GalleryGrid from '@/components/sections/GalleryGrid'
import { GALLERY_IMAGES } from '@/lib/data'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '视觉存档 — ARC.',
  description: '极简主义摄影与视觉创作存档',
}

export default function GalleryPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-24 animate-in">
      <SectionHeading>视觉存档</SectionHeading>
      <GalleryGrid images={GALLERY_IMAGES} />
    </div>
  )
}
