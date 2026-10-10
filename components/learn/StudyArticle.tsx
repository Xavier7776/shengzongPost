'use client'
import { useCallback, useEffect, useRef } from 'react'
import type { Edition } from '@/lib/learn/document'
import { learningLabels, learningState, selfTestPassed, type LearningProgress } from '@/lib/learn/progress'
import LearnInteractive from './LearnInteractive'
import { useLearningProgress } from './useLearningProgress'

export default function StudyArticle({ edition, slug, fingerprint }: { edition: Edition; slug: string; fingerprint: string }) {
  const { records, available, update } = useLearningProgress()
  const root = useRef<HTMLDivElement>(null)
  const resumed = useRef(false)
  const previous = records[slug], current = previous?.fingerprint === fingerprint ? previous : undefined
  const correct = Object.fromEntries(edition.blocks.flatMap((b, i) => b.type === 'quiz' ? [[String(i), b.answerIndex]] : []))
  const passed = selfTestPassed(current?.answers ?? {}, correct)
  const state = current ? learningState(current.practiceDone, passed, current.completedAt) : 'not_started'
  useEffect(() => {
    if (resumed.current || !current || new URLSearchParams(window.location.search).get('resume') !== '1') return
    const article = root.current?.querySelector('.learn-article')
    if (!article) return
    resumed.current = true
    window.scrollTo({ top: Math.max(0, window.scrollY + article.getBoundingClientRect().top + current.position), behavior: 'instant' })
  }, [current])
  const fresh = (): LearningProgress => ({ slug, title: edition.title, fingerprint, state: 'in_progress', answers: {}, practiceDone: false, position: 0, section: '', updatedAt: Date.now(), completedAt: null })
  function change(patch: (record: LearningProgress) => LearningProgress) {
    update(slug, old => {
      const record = patch(old?.fingerprint === fingerprint ? old : fresh())
      const eligible = selfTestPassed(record.answers, correct) && record.practiceDone
      return { ...record, completedAt: eligible ? record.completedAt : null, state: learningState(record.practiceDone, eligible, record.completedAt), updatedAt: Date.now() }
    })
  }
  // shortcut: Pixel positions can shift with viewport width; add stable section anchors if readers need cross-device resume.
  const savePosition = useCallback(() => {
    const article = root.current?.querySelector('.learn-article')
    if (!article) return
    const position = Math.max(0, Math.min(10_000_000, -article.getBoundingClientRect().top))
    let section = ''
    article.querySelectorAll('h2,h3').forEach(h => { if (h.getBoundingClientRect().top <= 160) section = h.textContent?.slice(0, 220) ?? '' })
    update(slug, old => old?.fingerprint === fingerprint ? { ...old, position, section, updatedAt: Date.now() } : old ?? null)
  }, [fingerprint, slug, update])
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined
    const onScroll = () => { if (!timer) timer = setTimeout(() => { timer = undefined; savePosition() }, 1000) }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('pagehide', savePosition)
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('pagehide', savePosition); if (timer) clearTimeout(timer) }
  }, [savePosition])
  return <div ref={root}>
    <section aria-label="学习进度" className="my-5 rounded-xl border border-indigo-100 bg-indigo-50 p-5 text-sm leading-7">
      <p><strong>{learningLabels[state]}</strong> · {passed ? '已通过本期全部自测' : '自测尚未全部通过'}</p>
      <p>浏览记录只表示打开过文章。学习进度仅保存在本机浏览器，其他使用此浏览器的人也可见；不上传、不按账号同步。</p>
      {!available && <p role="status">浏览器无法保存；本页仍可学习，离开后可能丢失本次进度。</p>}
      {previous && !current && <p>文章内容已有更正；旧版记录保留，开始学习或作答将记录当前版本，自测需重新完成。</p>}
      {state === 'not_started' && <button type="button" className="mt-2 rounded-lg border border-indigo-300 px-4 py-2 font-semibold" onClick={() => change(r => r)}>开始学习</button>}
      {current && current.position > 0 && <button type="button" className="mt-2 rounded-lg border border-indigo-300 px-4 py-2" onClick={() => { const article = root.current?.querySelector('.learn-article'); if (article) window.scrollTo({ top: Math.max(0, window.scrollY + article.getBoundingClientRect().top + current.position), behavior: 'instant' }) }}>继续上次位置{current.section ? ' · ' + current.section : ''}</button>}
    </section>
    <LearnInteractive edition={edition} quizProgress={{ answers: current?.answers ?? {}, onAnswer: (i, answer) => change(r => ({ ...r, answers: { ...r.answers, [i]: answer } })) }} practiceControls={<div className="mt-5 border-t pt-4 text-sm leading-7">
      <label className="flex items-start gap-2"><input type="checkbox" className="mt-2" checked={current?.practiceDone ?? false} onChange={event => change(r => ({ ...r, practiceDone: event.target.checked }))}/><span>我已动手完成上述实践并核对验收标准（个人确认，本站未自动检验）。</span></label>
      <p>完成标准：本期全部自测答对、主动确认实践，再点击完成。修改为错误答案或取消实践会取消完成状态。</p>
      {state === 'completed' ? <><p>完成时间：{new Date(current!.completedAt!).toLocaleString()}</p><button type="button" className="mt-2 rounded-lg border px-4 py-2" onClick={() => change(r => ({ ...r, completedAt: null }))}>取消完成</button></> : <button type="button" disabled={!passed || !current?.practiceDone} className="mt-2 rounded-lg border border-indigo-300 px-4 py-2 font-semibold disabled:cursor-not-allowed disabled:opacity-50" onClick={() => change(r => ({ ...r, completedAt: Date.now() }))}>标记本期已完成</button>}
      {previous && <button type="button" className="ml-3 mt-2 rounded-lg border px-4 py-2" onClick={() => { if (window.confirm('重置本期的本地答案、位置和完成状态？原有浏览历史会保留。')) update(slug, () => null) }}>重置本期学习</button>}
    </div>}/>
  </div>
}
