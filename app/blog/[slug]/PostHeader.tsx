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

export default async function PostHeader({ slug }: PostHeaderProps) {
  const post = await getPostBySlug(slug)
  if (!post) return null

  const { totalWords, minutes } = calculateReadingStats(post.content)

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
      <div className="flex items-center gap-2 mb-8 text-sm text-gray-400">
        <span>约 {totalWords} 字</span>
        <span className="text-gray-300">·</span>
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
