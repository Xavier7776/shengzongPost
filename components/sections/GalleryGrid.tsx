'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { useScrollReveal } from '@/lib/hooks'
import Card3D from '@/components/ui/Card3D'
import type { GALLERY_IMAGES } from '@/lib/data'

type GalleryImage = (typeof GALLERY_IMAGES)[number]

function GalleryItem({
  img,
  index,
  onClick,
}: {
  img: GalleryImage
  index: number
  onClick: (img: GalleryImage) => void
}) {
  const [ref, isVisible] = useScrollReveal()

  return (
    <div
      ref={ref}
      className={`break-inside-avoid transition-all duration-1000 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
      }`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <Card3D>
        <div
          className="relative overflow-hidden rounded-2xl cursor-zoom-in bg-gray-100 group aspect-[4/5]"
          onClick={() => onClick(img)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={img.url}
            alt={img.title}
            className="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-end p-8">
            <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500 text-white">
              <span className="text-[10px] font-black tracking-[0.2em] uppercase mb-2 block text-blue-400">
                {img.category}
              </span>
              <span className="text-xl font-bold">{img.title}</span>
            </div>
          </div>
        </div>
      </Card3D>
    </div>
  )
}

export default function GalleryGrid({ images }: { images: GalleryImage[] }) {
  const [lightboxImg, setLightboxImg] = useState<GalleryImage | null>(null)

  return (
    <>
      <div className="columns-1 sm:columns-2 lg:columns-3 gap-8 space-y-8">
        {images.map((img, i) => (
          <GalleryItem key={img.id} img={img} index={i} onClick={setLightboxImg} />
        ))}
      </div>

      {lightboxImg && (
        <div
          className="fixed inset-0 z-[100] bg-white/80 backdrop-blur-2xl flex items-center justify-center p-6"
          onClick={() => setLightboxImg(null)}
        >
          {/* Close button */}
          <button
            className="absolute top-8 right-8 p-2.5 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600 hover:text-gray-900 transition-colors z-10"
            onClick={() => setLightboxImg(null)}
          >
            <X className="w-5 h-5" />
          </button>

          <div
            className="relative max-w-4xl w-full flex flex-col items-center"
            onClick={e => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightboxImg.url}
              alt={lightboxImg.title}
              className="max-w-full max-h-[75vh] object-contain rounded-2xl shadow-2xl shadow-gray-300/60"
            />
            <div className="mt-6 bg-white border border-gray-100 shadow-lg px-8 py-4 rounded-2xl flex flex-col items-center gap-1">
              <span className="text-blue-600 text-[10px] font-black tracking-widest uppercase">
                {lightboxImg.category}
              </span>
              <h4 className="text-lg font-black text-gray-900">{lightboxImg.title}</h4>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
