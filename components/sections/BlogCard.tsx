'use client'
// components/sections/BlogCard.tsx
import Link from 'next/link'
import Image from 'next/image'
import { useScrollReveal } from '@/lib/hooks'
import Card3D from '@/components/ui/Card3D'
import { Calendar, Clock } from 'lucide-react'

interface Post {
  id: number
  slug?: string
  title: string
  date: string
  excerpt: string
  tags: string[]
  cover_image?: string | null
  author_name?: string | null
  author_avatar?: string | null
}

interface BlogCardProps {
  post: Post
  index: number
}

function readingTime(excerpt: string) {
  const mins = Math.max(1, Math.round(excerpt.length / 300 * 3))
  return `${mins} 分钟阅读`
}

const GRADIENTS = [
  'from-blue-900 via-blue-700 to-indigo-800',
  'from-violet-900 via-purple-700 to-fuchsia-800',
  'from-slate-800 via-blue-900 to-cyan-900',
  'from-indigo-900 via-blue-800 to-sky-700',
]

export default function BlogCard({ post, index }: BlogCardProps) {
  const [ref, isVisible] = useScrollReveal()
  const href = post.slug ? `/blog/${post.slug}` : `/blog/${post.id}`
  const gradient = GRADIENTS[index % GRADIENTS.length]
  const firstTag = post.tags?.[0] ?? ''

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
      style={{ transitionDelay: `${index * 80}ms` }}
    >
      <Card3D className="h-full">
        <Link href={href} className="group block h-full">
          <article className="flex flex-col h-full bg-white rounded-2xl overflow-hidden border border-gray-100/80 shadow-sm">

            {/* 封面图 */}
            <div className="relative aspect-[16/9] overflow-hidden flex-shrink-0">
              {post.cover_image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={post.cover_image}
                  alt={post.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className={`w-full h-full bg-gradient-to-br ${gradient}`} />
              )}

              {/* 分类角标 */}
              {firstTag && (
                <div className="absolute top-3 left-3">
                  <span className="text-[10px] font-black tracking-widest uppercase bg-white/20 backdrop-blur-sm text-white px-2.5 py-1 rounded-lg border border-white/20">
                    {firstTag}
                  </span>
                </div>
              )}
            </div>

            {/* 文字内容 */}
            <div className="flex flex-col flex-1 p-5">
              <h3 className="text-base font-black text-gray-900 mb-2 leading-snug group-hover:text-blue-600 transition-colors line-clamp-2">
                {post.title}
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed line-clamp-2 mb-4 flex-1">
                {post.excerpt}
              </p>

              {/* 标签 */}
              {post.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {post.tags.map(t => (
                    <span
                      key={t}
                      className="text-[10px] uppercase tracking-widest font-bold bg-gray-50 text-gray-400 px-2 py-0.5 rounded-md border border-gray-100"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}

              {/* 底部元信息 */}
              <div className="flex items-center gap-3 text-xs text-gray-400 pt-3 border-t border-gray-50 mt-auto">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {post.date}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {readingTime(post.excerpt)}
                </span>
                {post.author_name && (
                  <span className="flex items-center gap-1.5 ml-auto truncate min-w-0">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full overflow-hidden bg-blue-100 flex items-center justify-center">
                      {post.author_avatar
                        ? <Image src={post.author_avatar} alt={post.author_name} width={20} height={20} unoptimized className="w-full h-full object-cover" />
                        : <span className="text-blue-600 text-[9px] font-black">{post.author_name.charAt(0).toUpperCase()}</span>
                      }
                    </span>
                    <span className="truncate">{post.author_name}</span>
                  </span>
                )}
                {!post.author_name && (
                  <span className="ml-auto text-gray-300 group-hover:text-blue-400 transition-colors text-base leading-none">↗</span>
                )}
                {post.author_name && (
                  <span className="flex-shrink-0 text-gray-300 group-hover:text-blue-400 transition-colors text-base leading-none">↗</span>
                )}
              </div>
            </div>

          </article>
        </Link>
      </Card3D>
    </div>
  )
}
