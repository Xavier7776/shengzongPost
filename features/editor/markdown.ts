/**
 * 编辑器用的极简 Markdown → HTML 转换。
 *
 * 用途：把历史遗留的 Markdown 正文喂给 Tiptap 作为初始内容。
 * 注意：这不是站点的正文渲染器 —— 前端渲染走 `marked`（见 shared/markdown 的后续统一计划），
 * 这里的输出直接进 Tiptap 的 content，会经过 ProseMirror schema 过滤。
 */
export function mdToHtml(md: string): string {
  if (!md || md.trim().startsWith('<')) return md
  return md
    .replace(/^### (.+)$/gm, '<h3>$1</h3>').replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^> (.+)$/gm, '<blockquote><p>$1</p></blockquote>')
    .replace(/^- (.+)$/gm, '<li>$1</li>').replace(/(<li>.*<\/li>\n?)+/g, s => `<ul>${s}</ul>`)
    .replace(/```[\w]*\n([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
    .replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />').replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/^(?!<[hupboa]|<li|<pre|<block)(.+)$/gm, '<p>$1</p>').replace(/\n{2,}/g, '')
}
