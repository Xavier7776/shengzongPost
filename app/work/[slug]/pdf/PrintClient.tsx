'use client'
// app/work/[slug]/pdf/PrintClient.tsx
// 客户端组件：渲染 Markdown 为 HTML，提供"打印"按钮
// 使用浏览器原生打印功能 + CSS 分页控制，确保：
// 1. 标题不会被切半（page-break-after: avoid）
// 2. 段落不会被截断（page-break-inside: avoid）
// 3. 用户在打印对话框中选择"另存为 PDF"即可保存
// 4. 打印前设置 document.title 为 MD 文件名，使保存的 PDF 文件名与 MD 文件一致
// 5. 渲染后去重连续相同的 <a> 标签（修复参考文献 URL 重复问题）
// 6. 目录侧边栏：屏幕显示，打印隐藏，点击滚动到对应标题，滚动位置高亮
// 7. 字号调节：影响屏幕预览和打印
// 8. 打印页脚：屏幕隐藏，打印时每页底部显示文档标题和打印日期
import { useState, useEffect, useRef } from 'react'
import { marked } from 'marked'
import { FileText, Printer, Minus, Plus } from 'lucide-react'

marked.setOptions({ gfm: true, breaks: true })

interface TocItem {
  id: string
  text: string
  level: number
}

interface Props {
  /** Markdown 原文 */
  content: string
  /** 项目名称（显示在页头） */
  title: string
  /** MD 附件文件名（用于设置打印时的 PDF 文件名，去掉 .md 后缀） */
  mdFilename?: string | null
}

// 正文字号范围
const DEFAULT_FONT_SIZE = 16
const MIN_FONT_SIZE = 12
const MAX_FONT_SIZE = 24

// 把标题文本转成合法的 HTML id（保留中文、字母、数字、连字符）
function slugify(text: string): string {
  const id = text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[!@#$%^&*()+=\[\]{};':"\\|,.<>/?`~]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  return id || `heading-${Math.random().toString(36).slice(2, 8)}`
}

export default function PrintClient({ content, title, mdFilename }: Props) {
  const [printing, setPrinting] = useState(false)
  const [fontSize, setFontSize] = useState(DEFAULT_FONT_SIZE)
  const [tocItems, setTocItems] = useState<TocItem[]>([])
  const [activeId, setActiveId] = useState<string>('')
  const contentRef = useRef<HTMLDivElement>(null)

  const html = marked.parse(content) as string

  // 渲染后处理：
  // 1. 给 h1/h2/h3 标题设置 id（用于目录跳转和高亮）
  // 2. 去重同一父元素内 href 和文本都相同的 <a>（修复参考文献 URL 重复问题）
  useEffect(() => {
    const root = contentRef.current
    if (!root) return

    // 1. 给标题设置 id，并构建目录
    const headings = Array.from(root.querySelectorAll('h1, h2, h3'))
    const usedIds = new Set<string>()
    const items: TocItem[] = []
    headings.forEach((h) => {
      const level = parseInt(h.tagName[1], 10)
      const text = (h.textContent ?? '').trim()
      if (!text) return
      let id = slugify(text)
      // 处理 id 冲突
      let suffix = 1
      while (usedIds.has(id)) {
        id = `${slugify(text)}-${suffix++}`
      }
      usedIds.add(id)
      h.id = id
      items.push({ id, text, level })
    })
    setTocItems(items)

    // 2. 去重 <a>
    // 场景 1：MD 源码里写了 "https://example.com ... [https://example.com](https://example.com)"
    //   GFM autolink 把裸 URL 变成 <a>，显式链接又生成一个 <a>，导致同一 <li> 内同一 URL 出现两次
    // 场景 2：GFM 把 "url(url)" 当成单个 <a>（配对圆括号规则），href 和文本都含重复 URL
    //   需要截断 href 和文本到第一个 ( 之前
    const links = Array.from(root.querySelectorAll('a'))
    for (const link of links) {
      const href = link.getAttribute('href') ?? ''
      const text = link.textContent ?? ''
      // 修复 href 中包含圆括号重复 URL 的情况：url(url) → url
      if (href.includes('(http')) {
        const cleanHref = href.replace(/\((https?:\/\/[^\s()]+)\)$/, '')
        if (cleanHref !== href) link.setAttribute('href', cleanHref)
      }
      // 修复文本中包含圆括号重复 URL 的情况
      if (text.includes('(http')) {
        const cleanText = text.replace(/\((https?:\/\/[^\s()]+)\)$/, '')
        if (cleanText !== text) link.textContent = cleanText
      }
    }
    // 然后按父元素分组去重相同 href+text 的 <a>
    const seen = new Map<HTMLElement, Set<string>>()
    const toRemove: HTMLElement[] = []
    for (const link of links) {
      const parent = link.parentElement
      if (!parent) continue
      const href = link.getAttribute('href') ?? ''
      const linkText = (link.textContent ?? '').trim()
      const key = `${href}\u0000${linkText}`
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

  // 监听滚动，高亮当前目录项
  // 用 scroll 事件 + 计算最近经过的标题，比 IntersectionObserver 更可靠
  useEffect(() => {
    if (tocItems.length === 0) return

    const updateActive = () => {
      // 偏移量：sticky 工具栏高度 + 一点缓冲
      const offset = 120
      let current = ''
      for (const item of tocItems) {
        const el = document.getElementById(item.id)
        if (!el) continue
        // 标题顶部相对于视口的位置
        const top = el.getBoundingClientRect().top
        // 标题已经滚过偏移线 → 它是"当前所在章节"
        if (top <= offset) {
          current = item.id
        } else {
          // 后面的标题还没到，停止遍历
          break
        }
      }
      // 没有标题滚过偏移线时（页面顶部），默认高亮第一个标题
      if (!current) {
        current = tocItems[0].id
      }
      // 到达页面底部时，高亮最后一个标题
      if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 50) {
        current = tocItems[tocItems.length - 1].id
      }
      setActiveId(current)
    }

    updateActive()
    window.addEventListener('scroll', updateActive, { passive: true })
    window.addEventListener('resize', updateActive)
    return () => {
      window.removeEventListener('scroll', updateActive)
      window.removeEventListener('resize', updateActive)
    }
  }, [tocItems])

  // 点击目录项：平滑滚动到对应标题
  const handleTocClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    const target = document.getElementById(id)
    if (target) {
      // 顶部留出 sticky 工具栏的高度（约 80px）
      const top = target.getBoundingClientRect().top + window.scrollY - 80
      window.scrollTo({ top, behavior: 'smooth' })
      setActiveId(id)
    }
  }

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

  // 字号调节
  const increaseFontSize = () => setFontSize(s => Math.min(MAX_FONT_SIZE, s + 1))
  const decreaseFontSize = () => setFontSize(s => Math.max(MIN_FONT_SIZE, s - 1))

  // 当前日期（YYYY-MM-DD），用于打印页脚
  const now = new Date()
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

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
        <div className="toolbar-right">
          {/* 字号调节：影响正文 .print-body 的 font-size */}
          <div className="font-size-controls" title="调节正文字号">
            <button
              onClick={decreaseFontSize}
              disabled={fontSize <= MIN_FONT_SIZE}
              className="font-size-btn"
              aria-label="缩小字号"
            >
              <Minus className="w-3 h-3" />
              <span style={{ fontSize: '12px' }}>A</span>
            </button>
            <span className="font-size-value">{fontSize}</span>
            <button
              onClick={increaseFontSize}
              disabled={fontSize >= MAX_FONT_SIZE}
              className="font-size-btn"
              aria-label="放大字号"
            >
              <span style={{ fontSize: '15px' }}>A</span>
              <Plus className="w-3 h-3" />
            </button>
          </div>
          <button onClick={handlePrint} disabled={printing} className="download-btn">
            <Printer className="w-4 h-4" />
            {printing ? '正在准备...' : '打印'}
          </button>
        </div>
      </div>

      {/* 提示条：打印时隐藏 */}
      <div className="tip-bar">
        <Printer className="w-3.5 h-3.5 flex-shrink-0" />
        <span>
          点击「打印」后，在弹出的打印对话框中将<strong>「目标」</strong>选择为
          <strong>「另存为 PDF」</strong>，然后点击保存即可。
        </span>
      </div>

      {/* 文档区域：左侧目录侧边栏 + 右侧正文 */}
      <div className="content-layout">
        {/* 目录侧边栏：屏幕显示，打印隐藏 */}
        {tocItems.length > 0 && (
          <aside className="toc-sidebar">
            <p className="toc-title">目录</p>
            <nav className="toc-nav">
              {tocItems.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={(e) => handleTocClick(e, item.id)}
                  className={`toc-item toc-level-${item.level}${activeId === item.id ? ' toc-active' : ''}`}
                  title={item.text}
                >
                  {item.text}
                </a>
              ))}
            </nav>
          </aside>
        )}

        {/* 文档正文：不加额外标题，使用 MD 原文的第一行标题 */}
        <div className="print-root">
          <div
            className="print-body"
            ref={contentRef}
            style={{ fontSize: `${fontSize}px` }}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </div>

      {/* 打印页脚：屏幕隐藏，打印时每页底部显示标题和日期 */}
      <div className="print-footer">
        <span className="print-footer-title">{title}</span>
        <span className="print-footer-date">{dateStr}</span>
      </div>
    </div>
  )
}
