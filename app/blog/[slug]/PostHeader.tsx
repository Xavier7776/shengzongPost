// app/blog/[slug]/PostHeader.tsx
import { getPostBySlug } from '@/lib/db'
import Link from 'next/link'
import AuthorCard from '@/components/sections/AuthorCard'

interface PostHeaderProps {
  slug: string
  variant?: 'standard' | 'learn'
}

// 判断是否是新文章（7天内发布）
function isNew(dateStr: string): boolean {
  const date = new Date(dateStr)
  const now = new Date()
  const diffDays = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  return diffDays <= 3
}

// 计算字数和预计阅读时间
// - 中文字数：统计所有中文字符
// - 英文字数：按空格分词
// - 阅读速度：中文 400字/分钟，英文 200词/分钟
function calculateReadingStats(content: string): { totalWords: number; minutes: number } {
  // 去除 HTML 标签和实体
  const text = content
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]+`/g, ' ')
  // 中文字符数
  const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length
  // 英文词数（去除中文后按空格分词）
  const englishText = text.replace(/[\u4e00-\u9fa5]/g, ' ')
  const englishWords = englishText
    .split(/\s+/)
    .filter(w => /[a-zA-Z]/.test(w)).length
  // 总字数 = 中文字符 + 英文单词
  const totalWords = chineseChars + englishWords
  // 阅读时间（分钟）= 中文/400 + 英文/200，至少 1 分钟
  const minutes = Math.max(1, Math.ceil((chineseChars / 400) + (englishWords / 200)))
  return { totalWords, minutes }
}

export default async function PostHeader({ slug, variant = 'standard' }: PostHeaderProps) {
  const post = await getPostBySlug(slug)
  if (!post) return null

  const { totalWords, minutes } = calculateReadingStats(post.content)

  if (variant === 'learn') {
    // The study edition may explicitly distinguish reading time from hands-on practice.
    // Use its published reading estimate instead of showing an unrelated text-only estimate.
    const lead = post.content.slice(0, 380)
    const readingMatch = lead.match(/(?:阅读时间约|阅读约|预计阅读)\s*(\d{1,3})\s*分钟/)
    const practiceMatch = lead.match(/(?:动手实验|动手实践|动手练习)\s*约?\s*(\d{1,3})\s*分钟/)
    const readingMinutes = readingMatch ? Number(readingMatch[1]) : minutes
    const practiceMinutes = practiceMatch ? Number(practiceMatch[1]) : null
    return (
      <header className="learn-post-header">
        <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
          <time className="font-mono font-medium text-blue-600">{post.created_at.slice(0, 10)}</time>
          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">技术深度精读</span>
          {isNew(post.created_at) && <span className="text-xs font-semibold text-amber-600">NEW</span>}
        </div>
        <h1 className="learn-post-title text-gray-900">{post.title}</h1>
        <p className="learn-post-excerpt text-gray-600">{post.excerpt}</p>
        <div className="learn-post-byline flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500">
          <span className="inline-flex items-center gap-2">
            <span aria-hidden="true" className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
              {(post.author_name || 'M').slice(0, 1)}
            </span>
            {post.author_id ? (
              <Link href={'/profile/' + post.author_id} className="font-semibold text-gray-700 hover:text-blue-600">{post.author_name || 'MindStack'}</Link>
            ) : <span className="font-semibold text-gray-700">{post.author_name || 'MindStack'}</span>}
          </span>
          <span>预计阅读 {readingMinutes} 分钟</span>
          {practiceMinutes && <span>动手练习约 {practiceMinutes} 分钟</span>}
          <div className="flex flex-wrap gap-2">
            {post.tags.filter(t => t !== '自动发布').slice(0, 2).map(t =>
              <span key={t} className="rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-500">{t}</span>
            )}
          </div>
        </div>
      </header>
    )
  }

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

      <h1 className="text-3xl md:text-4xl lg:text-[2.75rem] font-black tracking-tight leading-[1.15] text-gray-900 mb-4">
        {post.title}
      </h1>
      {/* 字数统计 + 预计阅读时间 */}
      <div className="flex items-center gap-2 mb-8 text-sm text-gray-600">
        <span>约 {totalWords} 字</span>
        <span className="text-gray-600">·</span>
        <span>预计阅读 {minutes} 分钟</span>
      </div>
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
