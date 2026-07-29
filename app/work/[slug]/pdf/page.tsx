// app/work/[slug]/pdf/page.tsx
// 项目 PDF 预览/下载页面：渲染附件里的真实 MD 文件内容
// 优先级：附件中的 .md 文件（fetch 原文） → project.content（兜底）
// 访问 /work/mindstack/pdf → 预览页面 → 点击按钮 → 打印对话框 → 另存为 PDF
// CSS 分页控制：标题不会被切半，段落不会被截断
import { notFound } from 'next/navigation'
import { getProjectBySlug, getAllProjects } from '@/lib/db-works'
import PrintClient from './PrintClient'

export const dynamic = 'force-dynamic'

export async function generateStaticParams() {
  const projects = await getAllProjects()
  return projects.map(p => ({ slug: p.slug }))
}

export default async function PdfPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const project = await getProjectBySlug(slug)
  if (!project) return notFound()

  // PDF 内容来源：优先读取附件里的真实 MD 文件，回退到 project.content
  let pdfContent = ''

  // 1. 查找附件中的 .md 文件（size > 0 表示真实上传的文件）
  const mdAttachment = (project.attachments ?? []).find(
    att => att.size > 0 && /\.md$/i.test(att.filename)
  )

  if (mdAttachment) {
    try {
      const res = await fetch(mdAttachment.url, { cache: 'no-store' })
      if (res.ok) {
        pdfContent = await res.text()
      }
    } catch (e) {
      console.error('[PdfPage] fetch MD attachment failed:', e)
    }
  }

  // 2. 兜底：附件 MD fetch 失败或无 MD 附件时，使用 project.content
  if (!pdfContent.trim()) {
    pdfContent = project.content ?? ''
  }

  if (!pdfContent.trim()) return notFound()

  // 从 MD 内容提取第一个 # 标题作为报告标题（用于 toolbar 显示）
  // 不使用 project.name，避免显示与报告内容无关的项目名
  const titleMatch = pdfContent.match(/^#\s+(.+)$/m)
  const reportTitle = titleMatch ? titleMatch[1].trim() : project.name

  // 传递 MD 附件文件名，用于设置打印时的 PDF 文件名（与 MD 文件名一致）
  const mdFilename = mdAttachment?.filename ?? null

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PRINT_STYLES }} />
      <PrintClient content={pdfContent} title={reportTitle} mdFilename={mdFilename} />
    </>
  )
}

const PRINT_STYLES = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  .pdf-page-body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
    color: #1f2937; line-height: 1.8; background: #f3f4f6;
    min-height: 100vh;
  }
  /* 顶部工具栏（屏幕显示，打印隐藏） */
  .toolbar {
    position: sticky; top: 0; z-index: 100;
    display: flex; align-items: center; justify-content: space-between; gap: 16px;
    padding: 16px 24px; background: white; border-bottom: 1px solid #e5e7eb;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  }
  .toolbar-left { display: flex; align-items: center; gap: 12px; min-width: 0; }
  .toolbar-title { font-size: 16px; font-weight: 800; color: #111827; }
  .toolbar-hint { font-size: 12px; color: #6b7280; margin-top: 2px; }
  .download-btn {
    display: inline-flex; align-items: center; gap: 8px; flex-shrink: 0;
    padding: 10px 20px; background: #2563eb; color: white; border: none; border-radius: 10px;
    font-size: 14px; font-weight: 700; cursor: pointer; transition: background 0.2s;
  }
  .download-btn:hover:not(:disabled) { background: #1d4ed8; }
  .download-btn:disabled { opacity: 0.6; cursor: not-allowed; }
  /* 提示条（屏幕显示，打印隐藏） */
  .tip-bar {
    display: flex; align-items: center; gap: 8px;
    margin: 16px 24px; padding: 10px 16px;
    background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px;
    font-size: 13px; color: #1e40af; line-height: 1.6;
  }
  .tip-bar strong { color: #1e3a8a; }
  /* 文档正文容器（屏幕显示为白纸效果） */
  .print-root {
    max-width: 800px; margin: 16px auto 48px; padding: 48px 40px; background: white;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-radius: 8px;
  }
  .print-body h1 { font-size: 1.6rem; font-weight: 800; margin-top: 0; margin-bottom: 1rem; padding-bottom: 0.4rem; border-bottom: 1px solid #e5e7eb; }
  .print-body h2 { font-size: 1.2rem; font-weight: 700; margin-top: 1.5rem; }
  .print-body h3 { font-size: 1rem; font-weight: 600; margin-top: 1.2rem; }
  .print-body p { margin: 0.6rem 0; }
  .print-body ul, .print-body ol { padding-left: 1.5rem; margin: 0.6rem 0; }
  .print-body li { margin: 0.2rem 0; }
  .print-body strong { color: #111827; }
  .print-body code { background: #f3f4f6; padding: 0.1rem 0.3rem; border-radius: 0.2rem; font-size: 0.875em; font-family: "SF Mono", "Fira Code", monospace; }
  .print-body pre { background: #1f2937; color: #f9fafb; padding: 0.8rem; border-radius: 0.4rem; overflow-x: auto; margin: 0.8rem 0; }
  .print-body pre code { background: transparent; padding: 0; }
  .print-body blockquote { border-left: 3px solid #3b82f6; padding-left: 1rem; color: #6b7280; margin: 0.8rem 0; }
  .print-body hr { border: 0; border-top: 1px solid #e5e7eb; margin: 1.5rem 0; }
  .print-body a { color: #2563eb; }
  .print-body table { width: 100%; border-collapse: collapse; margin: 0.8rem 0; }
  .print-body th, .print-body td { border: 1px solid #e5e7eb; padding: 0.4rem 0.6rem; text-align: left; }
  .print-body th { background: #f9fafb; font-weight: 700; }

  /* === 打印分页控制 === */
  @media print {
    body { background: white; }
    /* 隐藏工具栏和提示条 */
    .toolbar, .tip-bar { display: none !important; }
    /* 正文铺满页面 */
    .print-root {
      max-width: none; margin: 0; padding: 0 16px;
      box-shadow: none; border-radius: 0;
    }

    /* 标题不会被切半：标题后避免立即分页 */
    .print-body h1, .print-body h2, .print-body h3, .print-body h4 {
      page-break-after: avoid;
      break-after: avoid;
    }
    /* 标题不会被孤悬在页底：标题前避免分页（除非空间不足） */
    .print-body h1, .print-body h2 {
      page-break-before: auto;
      break-before: auto;
    }
    /* 段落、列表、表格、代码块不会被截断 */
    .print-body p, .print-body li, .print-body pre, .print-body blockquote {
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .print-body table, .print-body tr {
      page-break-inside: avoid;
      break-inside: avoid;
    }
  }
`
