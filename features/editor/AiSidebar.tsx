'use client'

import { ChevronRight, FileText, Loader2, PenLine, AlignLeft, Sparkles, Wand2, X } from 'lucide-react'
import type { AiMode, AiProvider, useAiWriting } from './useAiWriting'

type Ai = ReturnType<typeof useAiWriting>

interface AiModeDef {
  key: AiMode; label: string; desc: string; icon: React.ReactNode
}

const BASE_AI_MODES: AiModeDef[] = [
  { key: 'draft',    label: '生成草稿', desc: '描述主题，AI 帮你写出完整草稿',  icon: <FileText className="w-4 h-4" /> },
  { key: 'continue', label: '续写内容', desc: '基于已有内容，AI 接着写后续段落', icon: <PenLine  className="w-4 h-4" /> },
  { key: 'excerpt',  label: '生成摘要', desc: '根据正文，AI 自动生成列表页摘要', icon: <AlignLeft className="w-4 h-4" /> },
]

const REWRITE_MODE: AiModeDef = {
  key: 'rewrite', label: '改写选中', desc: '选中编辑器中的文字，AI 按你的指令改写并替换', icon: <Wand2 className="w-4 h-4" />,
}

interface Props {
  ai: Ai
  /** 是否显示 mimo / gemini provider 切换（仅管理员编辑器） */
  showProvider?: boolean
  /** 摘要可被应用时的快捷入口 */
  onApplyExcerpt?: () => void
}

/** AI 写作助手侧边栏 */
export function AiSidebar({ ai, showProvider = false, onApplyExcerpt }: Props) {
  const modes = showProvider ? [...BASE_AI_MODES, REWRITE_MODE] : BASE_AI_MODES

  return (
    <aside className="w-80 border-l border-gray-100 bg-white flex flex-col overflow-hidden flex-shrink-0">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2 text-sm font-black text-gray-700">
          <Sparkles className="w-4 h-4 text-violet-500" />AI 写作助手
        </div>
        <button onClick={() => ai.setAiOpen(false)} className="text-gray-300 hover:text-gray-600 transition-colors"><X className="w-4 h-4" /></button>
      </div>

      {/* 模型 provider 切换（仅管理员） */}
      {showProvider && (
        <div className="px-4 py-2.5 border-b border-gray-100 flex items-center gap-1.5">
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 mr-1">模型</span>
          {(['mimo', 'gemini'] as AiProvider[]).map(p => (
            <button key={p} onClick={() => ai.setAiProvider(p)}
              className={`flex-1 text-xs font-bold py-1.5 rounded-lg transition-colors ${
                ai.aiProvider === p ? 'bg-violet-100 text-violet-700' : 'text-gray-500 hover:bg-gray-50'
              }`}>
              {p === 'mimo' ? 'MiMo' : 'Gemini'}
            </button>
          ))}
        </div>
      )}

      <div className="px-4 py-3 border-b border-gray-100 space-y-1.5">
        {modes.map(m => (
          <button key={m.key} onClick={() => { ai.setAiMode(m.key); ai.setAiResult(''); ai.setAiError('') }}
            className={`w-full flex items-start gap-2.5 px-3 py-2.5 rounded-xl text-left transition-colors ${ai.aiMode === m.key ? 'bg-violet-50 text-violet-700' : 'hover:bg-gray-50 text-gray-600'}`}>
            <span className={`mt-0.5 flex-shrink-0 ${ai.aiMode === m.key ? 'text-violet-500' : 'text-gray-400'}`}>{m.icon}</span>
            <div><p className="text-xs font-black">{m.label}</p><p className="text-[10px] text-gray-400 leading-tight mt-0.5">{m.desc}</p></div>
            {ai.aiMode === m.key && <ChevronRight className="w-3.5 h-3.5 ml-auto self-center text-violet-400 flex-shrink-0" />}
          </button>
        ))}
      </div>

      <div className="px-4 py-3 flex-shrink-0">
        {ai.aiMode === 'draft' && (
          <textarea value={ai.aiPrompt} onChange={e => ai.setAiPrompt(e.target.value)} placeholder="描述你想写的主题和要点..." rows={4}
            className="w-full text-xs text-gray-700 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-violet-400 resize-none transition" />
        )}
        {ai.aiMode === 'continue' && <p className="text-xs text-gray-400 bg-gray-50 rounded-xl px-3 py-2.5">将基于编辑器中的现有内容进行续写</p>}
        {ai.aiMode === 'excerpt'  && (
          <p className="text-xs text-gray-400 bg-gray-50 rounded-xl px-3 py-2.5 flex items-center gap-2">
            <span>将根据文章标题和正文自动生成摘要</span>
            {ai.aiResult && !ai.aiLoading && onApplyExcerpt && (
              <button onClick={onApplyExcerpt} className="ml-auto text-violet-500 hover:text-violet-700 font-black text-[10px]">← 应用</button>
            )}
          </p>
        )}
        {ai.aiMode === 'rewrite'  && (
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-violet-500">改写指令</p>
            <textarea value={ai.aiPrompt} onChange={e => ai.setAiPrompt(e.target.value)} placeholder="如：更简洁、更正式、修复语法、改成口语化..." rows={3}
              className="w-full text-xs text-gray-700 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-violet-400 resize-none transition" />
            <p className="text-[10px] text-gray-400 leading-relaxed">提示：先在编辑器中选中要改写的文字，再点「开始改写」。改写结果会替换原选中文本。</p>
          </div>
        )}
        {ai.aiError && <p className="text-xs text-red-500 mt-2">{ai.aiError}</p>}
        <div className="flex gap-2 mt-2.5">
          {ai.aiLoading ? (
            <button onClick={ai.abort}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-black bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
              <X className="w-3.5 h-3.5" />停止
            </button>
          ) : (
            <button onClick={ai.handleAiGenerate}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-black bg-violet-600 hover:bg-violet-700 text-white transition-colors">
              <Sparkles className="w-3.5 h-3.5" />{ai.aiResult ? '重新生成' : (ai.aiMode === 'rewrite' ? '开始改写' : '开始生成')}
            </button>
          )}
          {ai.aiResult && !ai.aiLoading && ai.aiMode !== 'excerpt' && (
            <button onClick={ai.handleApply}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-black bg-blue-600 hover:bg-blue-700 text-white transition-colors">
              插入编辑器
            </button>
          )}
        </div>
      </div>

      {(ai.aiLoading || ai.aiResult) && (
        <div className="flex-1 overflow-y-auto px-4 pb-4 flex flex-col gap-3">
          <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-1.5 pt-1">
            {ai.aiLoading && <Loader2 className="w-3 h-3 animate-spin text-violet-400" />}
            生成结果 {ai.aiLoading && <span className="text-violet-400 normal-case tracking-normal font-normal">· 生成中…</span>}
          </div>
          {ai.aiMode !== 'excerpt' ? (
            <div className="border border-gray-100 rounded-xl overflow-hidden">
              <div className="bg-gray-50 px-3 py-1.5 border-b border-gray-100">
                <span className="text-[9px] font-black uppercase tracking-widest text-gray-300">渲染预览</span>
              </div>
              <div className="p-3 max-h-[300px] overflow-y-auto">
                <div className="ai-preview text-xs" dangerouslySetInnerHTML={{ __html: ai.aiResult + (ai.aiLoading ? '<span class="ai-cursor"></span>' : '') }} />
              </div>
            </div>
          ) : (
            <pre className="text-xs text-gray-700 whitespace-pre-wrap font-sans leading-relaxed bg-gray-50 rounded-xl p-3 min-h-[60px]">
              {ai.aiResult}
              {ai.aiLoading && <span className="inline-block w-1.5 h-3.5 bg-violet-400 animate-pulse ml-0.5 align-middle" />}
            </pre>
          )}
          {ai.aiResult && !ai.aiLoading && ai.aiMode !== 'excerpt' && (
            <button onClick={ai.handleApply} className="w-full py-2.5 rounded-xl text-xs font-black bg-blue-600 hover:bg-blue-700 text-white transition-colors">
              {ai.aiMode === 'rewrite' ? '替换选中文本' : '插入到编辑器'}
            </button>
          )}
          {ai.aiResult && !ai.aiLoading && ai.aiMode === 'excerpt' && (
            <button onClick={ai.handleApply} className="w-full py-2.5 rounded-xl text-xs font-black bg-blue-600 hover:bg-blue-700 text-white transition-colors">
              应用为摘要
            </button>
          )}
        </div>
      )}
    </aside>
  )
}
