// components/sections/FeaturedGallery.tsx
// 首页精选摄影条带：横向滚动展示 is_featured 图片，点击直达 /gallery 灯箱定位
import Link from 'next/link'
import Image from 'next/image'
import { ChevronRight, Camera } from 'lucide-react'
import SectionHeading from '@/components/ui/SectionHeading'
import NewsletterForm from '@/components/sections/NewsletterForm'
import { getAllGalleryImages } from '@/lib/db'

export default async function FeaturedGallery() {
  const all = await getAllGalleryImages()
  // 有精选展示精选；没有则回退到最新几张，避免空区块
  const featured = all.filter(i => i.is_featured)
  const items = (featured.length > 0 ? featured : all).slice(0, 8)

  if (items.length === 0) return null

  return (
    <section className="py-32 border-t border-gray-100">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <p className="font-mono text-[10px] tracking-[0.45em] uppercase text-blue-600 mb-3 flex items-center gap-2">
              <Camera className="w-3.5 h-3.5" />
              Featured Photography
            </p>
            <SectionHeading>视觉存档</SectionHeading>
          </div>
          <Link
            href="/gallery"
            className="text-blue-600 font-bold hover:text-blue-700 flex items-center transition-colors group"
          >
            进入完整画廊
            <ChevronRight className="w-5 h-5 ml-1 transform group-hover:translate-x-2 transition-transform duration-300" />
          </Link>
        </div>
      </div>

      {/* 全宽横向滚动条带 */}
      <div className="flex gap-5 overflow-x-auto px-6 pb-4 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map(img => (
          <Link
            key={img.id}
            href={`/gallery?image=${img.id}`}
            className="group relative flex-shrink-0 w-[240px] md:w-[300px] aspect-[4/5] rounded-2xl overflow-hidden bg-gray-100 snap-start"
          >
            <Image
              src={img.url}
              alt={img.title || '摄影作品'}
              width={600}
              height={750}
              sizes="(max-width: 768px) 240px, 300px"
              className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <p className="absolute bottom-3 left-4 right-4 text-white text-sm font-bold truncate opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
              {img.title || '无标题'}
            </p>
          </Link>
        ))}
      </div>

      {/* 订阅入口 */}
      <div className="max-w-6xl mx-auto px-6 mt-16 flex flex-col md:flex-row md:items-end justify-between gap-6 border-t border-gray-100 pt-12">
        <div>
          <h3 className="text-xl font-black tracking-tight text-gray-900">不错过新内容</h3>
          <p className="mt-1 text-sm text-gray-400">新文章、新作品发布时第一时间通知你。</p>
        </div>
        <NewsletterForm />
      </div>
    </section>
  )
}
