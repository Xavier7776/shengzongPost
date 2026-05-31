// app/blog/[slug]/PostContent.tsx
import { getPostBySlug } from '@/lib/db'
import TableOfContents from '@/components/sections/TableOfContents'
import AttachmentList from '@/components/sections/AttachmentList'
import CodeCopyButton from '@/components/sections/CodeCopyButton'
import ImageLazyLoad from '@/components/sections/ImageLazyLoad'

// ── 旧 Markdown 兼容渲染（仅用于历史文章） ────────────────────────
function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/)
  return parts.map((part, i) =>
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={i} className="font-bold text-gray-900">{part.slice(2, -2)}</strong>
      : part
  )
}

function renderMarkdown(content: string) {
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
          <img src={url} alt={alt} className="w-full rounded-2xl object-contain shadow-md" style={{ maxHeight: 420 }} />
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

interface PostContentProps {
  slug: string
}

export default async function PostContent({ slug }: PostContentProps) {
  const post = await getPostBySlug(slug)
  if (!post) return null

  const isHtml = post.content.trimStart().startsWith('<')

  return (
    <>
      <TableOfContents contentSelector=".post-content, .space-y-5" />

      {isHtml ? (
        <div
          className="post-content"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      ) : (
        <div className="space-y-5">{renderMarkdown(post.content)}</div>
      )}

      <AttachmentList attachments={(post as any).attachments ?? []} />

      <CodeCopyButton />
      <ImageLazyLoad />
    </>
  )
}
