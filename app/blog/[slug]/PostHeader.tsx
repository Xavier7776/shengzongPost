// app/blog/[slug]/PostHeader.tsx
import type { Post } from '@/lib/db/posts'
import Link from 'next/link'
import BlogReaderToolbar from './BlogReaderToolbar'
import PostActions from '@/components/sections/PostActions'

interface PostHeaderProps {
  post: Post
  variant?: 'standard' | 'learn'
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

export default function PostHeader({ post, variant = 'standard' }: PostHeaderProps) {
  const { totalWords, minutes } = calculateReadingStats(post.content)
  const lead = post.content.slice(0, 380)
  const readingMatch = variant === 'learn' ? lead.match(/(?:阅读时间约|阅读约|预计阅读)\s*(\d{1,3})\s*分钟/) : null
  const practiceMatch = variant === 'learn' ? lead.match(/(?:动手实验|动手实践|动手练习)\s*约?\s*(\d{1,3})\s*分钟/) : null
  const readingMinutes = readingMatch ? Number(readingMatch[1]) : minutes
  const name = post.author_name || 'MindStack'
  // Keep Chinese words intact when a long mixed-language title wraps.
  const titleWords: string[] = []
  for (const { segment } of new Intl.Segmenter('zh', { granularity: 'word' }).segment(post.title)) {
    if (/^[，。、！？：；）】”’]+$/.test(segment) && titleWords.length) titleWords[titleWords.length - 1] += segment
    else titleWords.push(segment)
  }
  return <header className="reader-header">
    <h1 className="reader-title learn-post-title" aria-label={post.title}>{titleWords.map((word, index) => /^\s+$/.test(word) ? word : <span key={index} className="reader-title-word">{word}</span>)}</h1>
    <div className="reader-meta-row">
      <div className="reader-byline">
        <span className="reader-author-initial" aria-hidden="true">{name.slice(0, 1)}</span>
        {post.author_id ? <Link href={'/profile/' + post.author_id} className="reader-author-name">{name}</Link> : <span className="reader-author-name">{name}</span>}
        <span className="reader-meta-dot" aria-hidden="true">·</span>
        <time dateTime={post.created_at}>{post.created_at.slice(0, 10)}</time>
        <span className="reader-meta-dot" aria-hidden="true">·</span>
        <span>预计阅读 {readingMinutes} 分钟</span>
        {practiceMatch && <span className="reader-practice-time">动手练习约 {Number(practiceMatch[1])} 分钟</span>}
        <span className="sr-only">约 {totalWords} 字</span>
      </div>
      <div className="reader-header-actions"><PostActions slug={post.slug} compact /><BlogReaderToolbar variant={variant} /></div>
    </div>
    {post.excerpt && <p className="reader-abstract">{post.excerpt}</p>}
  </header>
}
