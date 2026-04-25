'use client'

// components/admin/AdminPostList.tsx
import { useState, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { PenLine, Eye, EyeOff, X } from 'lucide-react'
import AdminActions from '@/components/admin/AdminActions'

interface PostMeta {
  id: number
  slug: string
  title: string
  excerpt: string
  tags: string[]
  published: boolean
  created_at: string
  updated_at: string
  cover_image: string | null
  author_name?: string | null
  author_avatar?: string | null
  author_id?: number | null
}

export default function AdminPostList({ posts }: { posts: PostMeta[] }) {
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [activeStatus, setActiveStatus] = useState<'all' | 'published' | 'draft'>('all')

  // 聚合所有 tags
  const allTags = useMemo(() => {
    const set = new Set<string>()
    posts.forEach(p => p.tags?.forEach(t => set.add(t)))
    return Array.from(set).sort()
  }, [posts])

  const filtered = useMemo(() => posts.filter(p => {
    if (activeTag && !p.tags?.includes(activeTag)) return false
    if (activeStatus === 'published' && !p.published) return false
    if (activeStatus === 'draft' && p.published) return false
    return true
  }), [posts, activeTag, activeStatus])

  return (
    <main className="max-w-4xl mx-auto px-8 py-10">
      {/* ── 筛选栏 ── */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {/* 状态筛选 */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 mr-2">
          {(['all', 'published', 'draft'] as const).map(s => (
            <button
              key={s}
              onClick={() => setActiveStatus(s)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                activeStatus === s
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {s === 'all' && '全部'}
              {s === 'published' && <><Eye className="w-3 h-3" />已发布</>}
              {s === 'draft' && <><EyeOff className="w-3 h-3" />草稿</>}
            </button>
          ))}
        </div>

        {/* 分隔 */}
        {allTags.length > 0 && <span className="w-px h-5 bg-gray-200" />}

        {/* Tag 筛选 */}
        {allTags.map(tag => (
          <button
            key={tag}
            onClick={() => setActiveTag(activeTag === tag ? null : tag)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wide transition-all ${
              activeTag === tag
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {tag}
            {activeTag === tag && <X className="w-3 h-3" />}
          </button>
        ))}

        {/* 结果数 */}
        <span className="ml-auto text-xs text-gray-400 font-mono">
          {filtered.length} / {posts.length} 篇
        </span>
      </div>

      {/* ── 文章列表 ── */}
      {filtered.length === 0 ? (
        <div className="text-center py-24 text-gray-300">
          <PenLine className="w-12 h-12 mx-auto mb-4" />
          <p className="font-bold">没有符合条件的文章</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(post => (
            <div
              key={post.slug}
              className="bg-white border border-gray-100 rounded-2xl px-6 py-5 flex items-center justify-between gap-4 hover:border-gray-200 transition-colors"
            >
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                  <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${
                    post.published
                      ? 'bg-green-50 text-green-600'
                      : 'bg-gray-100 text-gray-400'
                  }`}>
                    {post.published ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    {post.published ? '已发布' : '草稿'}
                  </span>
                  <time className="text-xs text-gray-400 font-mono">{post.created_at.slice(0, 10)}</time>
                  {/* Tags */}
                  {post.tags?.slice(0, 3).map(t => (
                    <button
                      key={t}
                      onClick={() => setActiveTag(activeTag === t ? null : t)}
                      className={`text-[10px] font-black uppercase tracking-wide px-2 py-0.5 rounded-md transition-colors ${
                        activeTag === t
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-400 hover:bg-blue-50 hover:text-blue-500'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                <h2 className="font-bold text-gray-900 truncate mb-1.5">{post.title}</h2>
                <p className="text-xs text-gray-400 font-mono truncate mb-2">/{post.slug}</p>

                {/* 作者信息 */}
                {post.author_name && (
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-5 h-5 rounded-full overflow-hidden bg-blue-100 flex-shrink-0 flex items-center justify-center ring-1 ring-white">
                      {post.author_avatar
                        ? <Image src={post.author_avatar} alt={post.author_name} width={20} height={20} unoptimized className="w-full h-full object-cover" />
                        : <span className="text-blue-600 text-[9px] font-black">{post.author_name.charAt(0).toUpperCase()}</span>
                      }
                    </div>
                    {post.author_id
                      ? <Link href={`/profile/${post.author_id}`} className="text-xs font-bold text-gray-500 hover:text-blue-600 transition-colors">
                          {post.author_name}
                        </Link>
                      : <span className="text-xs font-bold text-gray-400">{post.author_name}</span>
                    }
                  </div>
                )}
              </div>

              <AdminActions slug={post.slug} published={post.published} />
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
