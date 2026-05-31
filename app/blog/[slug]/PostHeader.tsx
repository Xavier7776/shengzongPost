// app/blog/[slug]/PostHeader.tsx
import { getPostBySlug } from '@/lib/db'
import AuthorCard from '@/components/sections/AuthorCard'

interface PostHeaderProps {
  slug: string
}

// 判断是否是新文章（7天内发布）
function isNew(dateStr: string): boolean {
  const date = new Date(dateStr)
  const now = new Date()
  const diffDays = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  return diffDays <= 3
}

export default async function PostHeader({ slug }: PostHeaderProps) {
  const post = await getPostBySlug(slug)
  if (!post) return null

  return (
    <header className="mb-12">
      {/* 日期 + NEW 标记 */}
      <div className="flex items-center gap-3 mb-4">
        <time className="text-blue-600 font-mono text-sm">{post.created_at.slice(0, 10)}</time>
        {isNew(post.created_at) && (
          <span className="bg-gradient-to-r from-orange-400 to-amber-400 text-white text-[9px] font-extrabold tracking-wider px-2 py-0.5 rounded-full shadow-md shadow-orange-200/50 animate-bounce">
            NEW
          </span>
        )}
      </div>
      
      <h1 className="text-3xl md:text-4xl lg:text-[2.75rem] font-black tracking-tight leading-[1.15] text-gray-900 mb-8">
        {post.title}
      </h1>
      {post.author_name && (
        <AuthorCard
          name={post.author_name}
          avatar={post.author_avatar ?? null}
          bio={post.author_bio ?? null}
          authorId={post.author_id ?? null}
        />
      )}
      <p className="text-gray-500 text-lg leading-relaxed mb-8">{post.excerpt}</p>
      <div className="flex gap-3 flex-wrap">
        {post.tags.map(t => (
          <span key={t} className="px-3 py-1 bg-gray-100 text-gray-500 text-[10px] font-black uppercase tracking-widest rounded-md">{t}</span>
        ))}
      </div>
    </header>
  )
}
