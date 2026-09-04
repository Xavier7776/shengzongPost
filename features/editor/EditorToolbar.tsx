'use client'

import {
  Bold, Italic, Heading2, Heading3, List, ListOrdered,
  Quote, Code, Minus, Link as LinkIcon, Undo, Redo, Code2,
  Table, ImagePlus, Youtube,
} from 'lucide-react'
import type { Editor } from '@tiptap/react'
import type { useEditorDialogs } from './useEditorDialogs'

type Dialogs = ReturnType<typeof useEditorDialogs>

interface Props {
  editor: Editor | null
  dialogs: Dialogs
}

/** 工具栏按钮 */
function TB({ onClick, active, disabled, title, children }: {
  onClick: () => void; active?: boolean; disabled?: boolean; title: string; children: React.ReactNode
}) {
  return (
    <button type="button" onMouseDown={e => { e.preventDefault(); onClick() }} disabled={disabled} title={title}
      className={`p-1.5 rounded-lg transition-colors ${active ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'} disabled:opacity-30`}>
      {children}
    </button>
  )
}

export function EditorToolbar({ editor, dialogs }: Props) {
  return (
    <div className="relative bg-white border-b border-gray-100 px-6 py-2 flex items-center gap-0.5 flex-wrap">
      <TB onClick={() => editor?.chain().focus().undo().run()} title="撤销 Ctrl+Z" disabled={!editor?.can().undo()}><Undo className="w-4 h-4" /></TB>
      <TB onClick={() => editor?.chain().focus().redo().run()} title="重做 Ctrl+Y" disabled={!editor?.can().redo()}><Redo className="w-4 h-4" /></TB>
      <div className="w-px h-5 bg-gray-200 mx-1.5" />
      <TB onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} title="二级标题" active={editor?.isActive('heading', { level: 2 })}><Heading2 className="w-4 h-4" /></TB>
      <TB onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()} title="三级标题" active={editor?.isActive('heading', { level: 3 })}><Heading3 className="w-4 h-4" /></TB>
      <div className="w-px h-5 bg-gray-200 mx-1.5" />
      <TB onClick={() => editor?.chain().focus().toggleBold().run()} title="加粗 Ctrl+B" active={editor?.isActive('bold')}><Bold className="w-4 h-4" /></TB>
      <TB onClick={() => editor?.chain().focus().toggleItalic().run()} title="斜体 Ctrl+I" active={editor?.isActive('italic')}><Italic className="w-4 h-4" /></TB>
      <TB onClick={() => editor?.chain().focus().toggleCode().run()} title="行内代码" active={editor?.isActive('code')}><Code className="w-4 h-4" /></TB>
      <div className="w-px h-5 bg-gray-200 mx-1.5" />
      <TB onClick={() => editor?.chain().focus().toggleBulletList().run()} title="无序列表" active={editor?.isActive('bulletList')}><List className="w-4 h-4" /></TB>
      <TB onClick={() => editor?.chain().focus().toggleOrderedList().run()} title="有序列表" active={editor?.isActive('orderedList')}><ListOrdered className="w-4 h-4" /></TB>
      <TB onClick={() => editor?.chain().focus().toggleBlockquote().run()} title="引用块" active={editor?.isActive('blockquote')}><Quote className="w-4 h-4" /></TB>
      <TB onClick={() => editor?.chain().focus().toggleCodeBlock().run()} title="代码块" active={editor?.isActive('codeBlock')}><Code2 className="w-4 h-4" /></TB>
      <div className="w-px h-5 bg-gray-200 mx-1.5" />
      <TB onClick={dialogs.link.openPopup} title="插入链接" active={editor?.isActive('link')}><LinkIcon className="w-4 h-4" /></TB>
      <TB onClick={() => editor?.chain().focus().setHorizontalRule().run()} title="水平分隔线"><Minus className="w-4 h-4" /></TB>
      <div className="w-px h-5 bg-gray-200 mx-1.5" />
      <TB onClick={() => dialogs.table.setOpen(v => !v)} title="插入表格" active={editor?.isActive('table') || dialogs.table.open}><Table className="w-4 h-4" /></TB>
      <TB onClick={() => dialogs.imgUrl.setOpen(v => !v)} title="插入图片 URL"><ImagePlus className="w-4 h-4" /></TB>
      <TB onClick={dialogs.insertVideo} title="嵌入视频 (YouTube / Bilibili)"><Youtube className="w-4 h-4" /></TB>

      {/* ── 链接弹窗 ── */}
      {dialogs.link.open && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-gray-200 rounded-2xl shadow-xl p-4 w-80"
          onKeyDown={e => { if (e.key === 'Enter') dialogs.link.apply(); if (e.key === 'Escape') dialogs.link.setOpen(false) }}>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">插入链接</p>
          <input autoFocus value={dialogs.link.url} onChange={e => dialogs.link.setUrl(e.target.value)}
            placeholder="https://example.com"
            className="w-full text-sm bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 mb-2 focus:outline-none focus:border-blue-400 focus:bg-white transition" />
          <input value={dialogs.link.text} onChange={e => dialogs.link.setText(e.target.value)}
            placeholder="显示文字（留空则包裹选区）"
            className="w-full text-sm bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 mb-3 focus:outline-none focus:border-blue-400 focus:bg-white transition" />
          <div className="flex gap-2">
            <button onClick={dialogs.link.apply}
              className="flex-1 text-xs font-black bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl transition">确认</button>
            {editor?.isActive('link') && (
              <button onClick={() => { editor.chain().focus().unsetLink().run(); dialogs.link.setOpen(false) }}
                className="text-xs font-black text-red-500 hover:text-red-700 px-3 py-2 rounded-xl hover:bg-red-50 transition">移除</button>
            )}
            <button onClick={() => dialogs.link.setOpen(false)}
              className="text-xs font-black text-gray-400 hover:text-gray-600 px-3 py-2 rounded-xl hover:bg-gray-100 transition">取消</button>
          </div>
        </div>
      )}

      {/* ── 表格弹窗 ── */}
      {dialogs.table.open && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-gray-200 rounded-2xl shadow-xl p-4 w-64"
          onKeyDown={e => { if (e.key === 'Enter') dialogs.table.apply(); if (e.key === 'Escape') dialogs.table.setOpen(false) }}>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">插入表格</p>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-[10px] text-gray-400 font-bold block mb-1">行数</label>
              <input type="number" min={1} max={20} value={dialogs.table.rows} onChange={e => dialogs.table.setRows(Number(e.target.value))}
                className="w-full text-sm bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-400 focus:bg-white transition" />
            </div>
            <div>
              <label className="text-[10px] text-gray-400 font-bold block mb-1">列数</label>
              <input type="number" min={1} max={10} value={dialogs.table.cols} onChange={e => dialogs.table.setCols(Number(e.target.value))}
                className="w-full text-sm bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-400 focus:bg-white transition" />
            </div>
          </div>
          <label className="flex items-center gap-2 text-xs text-gray-600 mb-3 cursor-pointer">
            <input type="checkbox" checked={dialogs.table.withHeader} onChange={e => dialogs.table.setWithHeader(e.target.checked)}
              className="w-3.5 h-3.5 accent-blue-600" />
            包含表头行
          </label>
          <div className="flex gap-2">
            <button onClick={dialogs.table.apply}
              className="flex-1 text-xs font-black bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl transition">插入</button>
            <button onClick={() => dialogs.table.setOpen(false)}
              className="text-xs font-black text-gray-400 hover:text-gray-600 px-3 py-2 rounded-xl hover:bg-gray-100 transition">取消</button>
          </div>
        </div>
      )}

      {/* ── 图片 URL 弹窗 ── */}
      {dialogs.imgUrl.open && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-gray-200 rounded-2xl shadow-xl p-4 w-80"
          onKeyDown={e => { if (e.key === 'Enter') dialogs.imgUrl.apply(); if (e.key === 'Escape') dialogs.imgUrl.setOpen(false) }}>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">插入图片</p>
          <input autoFocus value={dialogs.imgUrl.url} onChange={e => dialogs.imgUrl.setUrl(e.target.value)}
            placeholder="图片 URL（https://...）"
            className="w-full text-sm bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 mb-2 focus:outline-none focus:border-blue-400 focus:bg-white transition" />
          <input value={dialogs.imgUrl.alt} onChange={e => dialogs.imgUrl.setAlt(e.target.value)}
            placeholder="Alt 描述（可选）"
            className="w-full text-sm bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 mb-1 focus:outline-none focus:border-blue-400 focus:bg-white transition" />
          <p className="text-[10px] text-gray-400 mb-3">或使用顶部「插图」按钮上传本地文件</p>
          <div className="flex gap-2">
            <button onClick={dialogs.imgUrl.apply}
              className="flex-1 text-xs font-black bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl transition">插入</button>
            <button onClick={() => dialogs.imgUrl.setOpen(false)}
              className="text-xs font-black text-gray-400 hover:text-gray-600 px-3 py-2 rounded-xl hover:bg-gray-100 transition">取消</button>
          </div>
        </div>
      )}
    </div>
  )
}
