// 路径：app/blog/[slug]/page.tsx  ← 完整替换，删掉原来的内联 AuthorCard 函数
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getPostBySlug } from '@/lib/db'
import CommentSection from '@/components/sections/CommentSection'
import PostActions from '@/components/sections/PostActions'
import ViewTracker from '@/components/sections/ViewTracker'
import AuthorCard from '@/components/sections/AuthorCard'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface PageProps { params: { slug: string } }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const post = await getPostBySlug(params.slug)
  if (!post) return { title: '文章不存在 — ARC.' }
  return { title: `${post.title} — ARC.`, description: post.excerpt }
}

function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/)
  return parts.map((part, i) =>
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={i} className="font-bold text-gray-900">{part.slice(2, -2)}</strong>
      : part
  )
}

function renderContent(content: string) {
  const lines = content.split('\n')
  const elements: React.ReactNode[] = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    const trimmed = line.trim()
    if (!trimmed) { i++; continue }
    if (trimmed.startsWith('## ')) {
      elements.push(<h2 key={i} className="text-2xl font-black text-gray-900 mt-14 mb-5 tracking-tight border-b border-gray-100 pb-3">{trimmed.slice(3)}</h2>)
      i++; continue
    }
    if (trimmed.startsWith('### ')) {
      elements.push(<h3 key={i} className="text-lg font-black text-gray-800 mt-10 mb-3 tracking-tight">{trimmed.slice(4)}</h3>)
      i++; continue
    }
    const imgMatch = trimmed.match(/^!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)$/)
    if (imgMatch) {
      const [, alt, url, caption] = imgMatch
      elements.push(
        <figure key={i} className="my-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt={alt} className="w-full rounded-2xl object-cover shadow-md" style={{ maxHeight: 420 }} />
          {caption && <figcaption className="text-center text-xs text-gray-400 mt-3 font-medium tracking-wide">{caption}</figcaption>}
        </figure>
      )
      i++; continue
    }
    if (trimmed.startsWith('> ')) {
      elements.push(
        <blockquote key={i} className="border-l-4 border-blue-400 pl-5 py-1 my-6 bg-blue-50 rounded-r-xl">
          <p className="text-blue-800 italic leading-relaxed text-base">{renderInline(trimmed.slice(2))}</p>
        </blockquote>
      )
      i++; continue
    }
    if (trimmed.startsWith('```')) {
      const lang = trimmed.slice(3).trim()
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i].trim().startsWith('```')) { codeLines.push(lines[i]); i++ }
      elements.push(
        <div key={i} className="my-8 rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
          {lang && <div className="bg-gray-50 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-100">{lang}</div>}
          <pre className="bg-gray-950 text-green-400 p-6 overflow-x-auto text-sm leading-relaxed font-mono"><code>{codeLines.join('\n')}</code></pre>
        </div>
      )
      i++; continue
    }
    if (trimmed.startsWith('- ')) {
      const items: string[] = []
      while (i < lines.length && lines[i].trim().startsWith('- ')) { items.push(lines[i].trim().slice(2)); i++ }
      elements.push(
        <ul key={i} className="my-6 space-y-2">
          {items.map((item, j) => (
            <li key={j} className="flex items-start gap-3 text-gray-600 leading-relaxed">
              <span className="mt-2 w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
              <span>{renderInline(item)}</span>
            </li>
          ))}
        </ul>
      )
      continue
    }
    if (trimmed.match(/^\d+\. /)) {
      const items: string[] = []
      while (i < lines.length && lines[i].trim().match(/^\d+\. /)) { items.push(lines[i].trim().replace(/^\d+\. /, '')); i++ }
      elements.push(
        <ol key={i} className="my-6 space-y-2">
          {items.map((item, j) => (
            <li key={j} className="flex items-start gap-3 text-gray-600 leading-relaxed">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-black flex items-center justify-center mt-0.5">{j + 1}</span>
              <span>{renderInline(item)}</span>
            </li>
          ))}
        </ol>
      )
      continue
    }
    elements.push(<p key={i} className="text-gray-600 leading-[1.9] text-[1.05rem]">{renderInline(trimmed)}</p>)
    i++
  }
  return elements
}

export default async function BlogPostPage({ params }: PageProps) {
  const post = await getPostBySlug(params.slug)
  if (!post) notFound()

  return (
    <div className="max-w-[780px] mx-auto px-6 py-24 animate-in">
      <Link href="/blog" className="flex items-center text-gray-400 hover:text-blue-600 transition-colors mb-16 group font-bold uppercase tracking-widest text-xs">
        <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-2 transition-transform duration-300" />
        返回博客列表
      </Link>
      <article>
        <header className="mb-14">
          <time className="text-blue-600 font-mono text-sm mb-4 block">{post.created_at.slice(0, 10)}</time>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter leading-[1.05] text-gray-900 mb-6">{post.title}</h1>
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
        <div className="space-y-5">{renderContent(post.content)}</div>
      </article>
      <ViewTracker slug={params.slug} />
      <PostActions slug={params.slug} />
      <CommentSection slug={params.slug} />
    </div>
  )
}
