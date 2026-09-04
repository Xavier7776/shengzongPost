'use client'

import { useRef, useState } from 'react'
import type { Editor } from '@tiptap/react'
import { readAiStream } from './ai-stream'

export type AiMode = 'draft' | 'continue' | 'excerpt' | 'rewrite'
export type AiProvider = 'mimo' | 'gemini'

export interface UseAiWritingOptions {
  editor: Editor | null
  title: string
  /** 摘要生成结果的应用方式由调用方决定 */
  onExcerpt: (text: string) => void
  /** AI 结果写入编辑器的方式；默认 setContent / 末尾追加 / 替换选区 */
  onInsert?: (mode: AiMode, text: string) => void
}

/**
 * AI 写作助手的公共状态机：模式、provider、prompt、流式结果、错误、中止。
 * rewrite 模式与 gemini provider 仅管理员编辑器启用。
 */
export function useAiWriting({ editor, title, onExcerpt, onInsert }: UseAiWritingOptions) {
  const [aiOpen, setAiOpen]       = useState(false)
  const [aiMode, setAiMode]       = useState<AiMode>('draft')
  const [aiProvider, setAiProvider] = useState<AiProvider>('mimo')
  const [aiPrompt, setAiPrompt]   = useState('')
  const [aiResult, setAiResult]   = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError]     = useState('')
  const abortRef = useRef<AbortController | null>(null)

  async function handleAiGenerate() {
    setAiLoading(true); setAiResult(''); setAiError('')
    abortRef.current = new AbortController()
    try {
      // rewrite 模式：取编辑器选中文本作为 selection 传给后端
      const sel = editor?.state.selection
      const selection = aiMode === 'rewrite' && sel && !sel.empty
        ? editor!.state.doc.textBetween(sel.from, sel.to, '\n')
        : ''
      if (aiMode === 'rewrite' && !selection) {
        setAiError('请先在编辑器中选中要改写的文字')
        return
      }
      const route = aiProvider === 'gemini' ? '/api/ai/write-gemini' : '/api/ai/write'
      const res = await fetch(route, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        signal: abortRef.current.signal,
        body: JSON.stringify({ mode: aiMode, prompt: aiPrompt, content: editor?.getHTML() ?? '', title, selection }),
      })
      if (!res.ok) { const d = await res.json(); setAiError(d.error ?? 'AI 调用失败'); return }
      await readAiStream(res, delta => setAiResult(p => p + delta))
    } catch (e: any) { if (e.name !== 'AbortError') setAiError('生成失败，请重试') }
    finally { setAiLoading(false) }
  }

  function handleApply() {
    if (!aiResult) return
    if (aiMode === 'excerpt') {
      onExcerpt(aiResult)
    } else if (onInsert) {
      onInsert(aiMode, aiResult)
    } else {
      insertDefault(aiMode, aiResult)
    }
    setAiResult('')
  }

  /** 默认插入行为：draft 覆盖全文，continue / rewrite 追加或替换选区 */
  function insertDefault(mode: AiMode, text: string) {
    if (!editor) return
    if (mode === 'draft') {
      editor.commands.setContent(text)
    } else if (mode === 'continue') {
      editor.commands.insertContentAt(editor.state.doc.content.size, text)
    } else if (mode === 'rewrite') {
      // 替换编辑器选中文本：保留选区位置，插入改写后的内容
      // 若选区已消失（点击侧边栏导致失焦），则插入到文档末尾
      const { selection } = editor.state
      if (!selection.empty) {
        editor.chain().focus()
          .deleteRange({ from: selection.from, to: selection.to })
          .insertContentAt(selection.from, text)
          .run()
      } else {
        editor.commands.insertContentAt(editor.state.doc.content.size, text)
      }
    }
  }

  function abort() {
    abortRef.current?.abort()
    setAiLoading(false)
  }

  return {
    aiOpen, setAiOpen,
    aiMode, setAiMode,
    aiProvider, setAiProvider,
    aiPrompt, setAiPrompt,
    aiResult, setAiResult,
    aiLoading, aiError, setAiError,
    abortRef,
    handleAiGenerate,
    handleApply,
    abort,
    insertDefault,
  }
}
