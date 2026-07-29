'use client'
// app/work/[slug]/pdf/PrintClient.tsx
// 客户端组件：渲染 Markdown 为 HTML，提供"打印"按钮
// 使用浏览器原生打印功能 + CSS 分页控制，确保：
// 1. 标题不会被切半（page-break-after: avoid）
// 2. 段落不会被截断（page-break-inside: avoid）
// 3. 用户在打印对话框中选择"另存为 PDF"即可保存
// 4. 打印前设置 document.title 为 MD 文件名，使保存的 PDF 文件名与 MD 文件一致
// 5. 渲染后去重连续相同的 <a> 标签（修复参考文献 URL 重复问题）
import { useState, useEffect, useRef } from 'react'
import { marked } from 'marked'
import { FileText, Printer } from 'lucide-react'

marked.setOptions({ gfm: true, breaks: true })

interface Props {
  /** Markdown 原文 */
  content: string
  /** 项目名称（显示在页头） */
  title: string
  /** MD 附件文件名（用于设置打印时的 PDF 文件名，去掉 .md 后缀） */
  mdFilename?: string | null
}

export default function PrintClient({ content, title, mdFilename }: Props) {
  const [printing, setPrinting] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  const html = marked.parse(content) as string

  // 渲染后去重：同一父元素内 href 和文本都相同的 <a> 只保留第一个
  // 场景：MD 源码里写了 "https://example.com ... [https://example.com](https://example.com)"
  // GFM autolink 把裸 URL 变成 <a>，显式链接又生成一个 <a>，导致同一 <li> 内同一 URL 出现两次
  useEffect(() => {
    const root = contentRef.current
    if (!root) return
    const links = Array.from(root.querySelectorAll('a'))
    const seen = new Map<HTMLElement, Set<string>>()
    const toRemove: HTMLElement[] = []
    for (const link of links) {
      const parent = link.parentElement
      if (!parent) continue
      const href = link.getAttribute('href') ?? ''
      const text = (link.textContent ?? '').trim()
      const key = `${href}\u0000${text}`
      if (!seen.has(parent)) seen.set(parent, new Set())
      const set = seen.get(parent)!
      if (set.has(key)) {
        toRemove.push(link)
      } else {
        set.add(key)
      }
    }
    toRemove.forEach(el => el.remove())
  }, [html])

  const handlePrint = () => {
    if (printing) return
    setPrinting(true)
    // 打印前设置 document.title，使打印对话框默认文件名与 MD 文件名一致
    const originalTitle = document.title
    if (mdFilename) {
      document.title = mdFilename.replace(/\.md$/i, '')
    }
    setTimeout(() => {
      window.print()
      // 打印对话框关闭后恢复原标题
      setTimeout(() => {
        document.title = originalTitle
        setPrinting(false)
      }, 500)
    }, 100)
  }

  return (
    <div className="pdf-page-body">
      {/* 顶部工具栏：打印时隐藏 */}
      <div className="toolbar">
        <div className="toolbar-left">
          <FileText className="w-5 h-5 text-blue-600" />
          <div>
            <p className="toolbar-title">{title}</p>
            <p className="toolbar-hint">PDF 预览 · 点击右侧按钮打印或另存为 PDF</p>
          </div>
        </div>
        <button onClick={handlePrint} disabled={printing} className="download-btn">
          <Printer className="w-4 h-4" />
          {printing ? '正在准备...' : '打印'}
        </button>
      </div>

      {/* 提示条：打印时隐藏 */}
      <div className="tip-bar">
        <Printer className="w-3.5 h-3.5 flex-shrink-0" />
        <span>
          点击「打印」后，在弹出的打印对话框中将<strong>「目标」</strong>选择为
          <strong>「另存为 PDF」</strong>，然后点击保存即可。
          <br />
          CSS 会自动在标题前分页，标题不会被切半也不会孤悬在页底。
        </span>
      </div>

      {/* 文档正文：不加额外标题，使用 MD 原文的第一行标题 */}
      <div className="print-root">
        <div className="print-body" ref={contentRef} dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </div>
  )
}
