'use client'

import Link from 'next/link'
import { useScrollReveal } from '@/lib/hooks'
import Card3D from '@/components/ui/Card3D'
import type { BLOG_POSTS } from '@/lib/data'

type Post = (typeof BLOG_POSTS)[number]

interface BlogCardProps {
  post: Post
  index: number
}

export default function BlogCard({ post, index }: BlogCardProps) {
  const [ref, isVisible] = useScrollReveal()

  return (
    <div
      ref={ref}
      className={`transition-all duration-1000 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
      }`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <Card3D className="h-full">
        <Link href={`/blog/${post.id}`}>
          <article className="group cursor-pointer flex flex-col h-full p-8 rounded-2xl bg-white border border-gray-100/80 shadow-sm">
            <time className="text-xs text-gray-400 font-mono mb-4 block">{post.date}</time>
            <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors leading-tight">
              {post.title}
            </h3>
            <p className="text-gray-500 text-sm line-clamp-3 mb-6 flex-1 leading-relaxed">
              {post.excerpt}
            </p>
            <div className="flex space-x-2 mt-auto">
              {post.tags.map(t => (
                <span
                  key={t}
                  className="text-[10px] uppercase tracking-widest font-bold bg-blue-50 text-blue-600 px-2.5 py-1 rounded-md"
                >
                  {t}
                </span>
              ))}
            </div>
          </article>
        </Link>
      </Card3D>
    </div>
  )
}
