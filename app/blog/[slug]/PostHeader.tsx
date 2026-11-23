import { readingStats } from '@/lib/reading-stats'
// app/blog/[slug]/PostHeader.tsx
import type { Post } from '@/lib/db/posts'
import Link from 'next/link'
import BlogReaderToolbar from './BlogReaderToolbar'
import PostActions from '@/components/sections/PostActions'

interface PostHeaderProps {
  post: Post
  variant?: 'standard' | 'learn'
}

export default function PostHeader({ post, variant = 'standard' }: PostHeaderProps) {
  const { totalWords, minutes, practiceMinutes } = readingStats(post.content, post.slug)
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
        <span>预计阅读 {minutes} 分钟</span>
        {practiceMinutes && <span className="reader-practice-time">动手练习约 {practiceMinutes} 分钟</span>}
        <span className="sr-only">约 {totalWords} 字</span>
      </div>
      <div className="reader-header-actions"><PostActions slug={post.slug} compact /><BlogReaderToolbar variant={variant} /></div>
    </div>
    {post.excerpt && <p className="reader-abstract">{post.excerpt}</p>}
  </header>
}
