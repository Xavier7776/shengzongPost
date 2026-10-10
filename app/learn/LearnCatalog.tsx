'use client'

import Link from 'next/link'
import { useEffect, useState, type ReactNode } from 'react'
import { BookOpen, ArrowRight, Clock, CheckCircle2, Layers, CalendarDays } from 'lucide-react'
import { getReadingHistory } from '@/components/sections/ReadingHistory'
import { TOPICS, type Topic } from '@/lib/learn/document'
import { learningLabels } from '@/lib/learn/progress'
import { useLearningProgress } from '@/components/learn/useLearningProgress'

export interface LearnCatalogArticle {
  slug: string
  title: string
  excerpt: string
  topic: Topic
  date: string
}
interface Props {
  articles: LearnCatalogArticle[]
  topic: Topic | null
  topicCounts: Partial<Record<Topic, number>>
  total: number
  page: number
  pageSize: number
  learningPaths?: ReactNode
}
const kinds = (Object.keys(TOPICS) as Topic[])
const target = (topic: Topic | null, page = 1) => {
  const query = new URLSearchParams()
  if (topic) query.set('topic', topic)
  if (page > 1) query.set('page', String(page))
  const text = query.toString()
  return '/learn' + (text ? '?' + text : '')
}
const iconFor: Record<Topic,string> = {
  agent: 'Agent · 工具与规划',
  rag: 'RAG · 检索与证据',
  engineering: '工程 · AI 原生开发',
  multimodal: '多模态 · 视觉与音频',
}

export default function LearnCatalog({ articles, topic, topicCounts, total, page, pageSize, learningPaths }: Props) {
  const [visited, setVisited] = useState<Set<string>>(new Set())
  const [lastRead, setLastRead] = useState<{slug:string;title:string}|null>(null)
  const { records, available } = useLearningProgress()
  const [learningFilter, setLearningFilter] = useState('all')
  useEffect(() => {
    const rawHistory = getReadingHistory()
    const history = (Array.isArray(rawHistory) ? rawHistory : []).filter(item => /^daily-learn-\d{4}-\d{2}-\d{2}$/.test(item.slug))
    setVisited(new Set(history.map(item => item.slug)))
    if (history[0]) setLastRead({slug:history[0].slug,title:history[0].title})
  }, [])

  const filtered = articles.filter(article => {
    const r = records[article.slug]
    return learningFilter === 'all' || (learningFilter === 'learning' ? r && r.state !== 'completed' : learningFilter === 'practice' ? r && !r.practiceDone : r?.state === 'completed')
  })
  const featured = !topic && page===1 && learningFilter === 'all' ? articles[0] : undefined
  const listing = featured ? filtered.slice(1) : filtered
  const continuing = Object.values(records).find(r => r.state !== 'completed')
  const completed = Object.values(records).filter(r => r.state === 'completed').length
  const totalPages = Math.max(1,Math.ceil(total / pageSize))

  function ArticleCard({article}:{article:LearnCatalogArticle}) {
    const progress = records[article.slug]
    return <Link scroll={!(progress && progress.state !== 'completed')} href={'/blog/'+article.slug+(progress && progress.state !== 'completed' ? '?resume=1' : '')}
      className="group flex h-full flex-col rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md">
      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs font-medium text-gray-500">
        <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700">{TOPICS[article.topic]}</span>
        <time dateTime={article.date}>{article.date}</time>
        {visited.has(article.slug) && <span className="inline-flex items-center gap-1 text-emerald-700">
          <CheckCircle2 className="h-3.5 w-3.5" /> 浏览过
        </span>}
        {progress && <span className="rounded-full bg-indigo-50 px-2 py-1 text-indigo-700">{learningLabels[progress.state]}（本机）</span>}
      </div>
      <h3 className="text-lg font-bold leading-snug text-gray-900 group-hover:text-blue-700">{article.title}</h3>
      <p className="mt-3 line-clamp-3 text-sm leading-7 text-gray-600">{article.excerpt}</p>
      <span className="mt-auto inline-flex items-center gap-2 pt-6 text-sm font-semibold text-blue-700">
        {progress?.state === 'completed' ? '复习本期' : progress ? '继续学习' : '开始精读'} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1"/>
      </span>
    </Link>
  }

  return <main className="mx-auto w-full max-w-[1320px] px-5 pb-24 pt-28 sm:px-8">
    <header className="mb-9 max-w-3xl">
      <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
        <BookOpen className="h-4 w-4"/> AI 技术图解深度学习
      </div>
      <h1 className="text-3xl font-black leading-tight tracking-tight text-gray-900 sm:text-5xl">
        每天真正掌握一项技术
      </h1>
      <p className="mt-5 text-base leading-8 text-gray-600">
        Agent 前沿、RAG 与检索、AI 原生软件工程和多模态技术。用可追溯的一手资料、架构拆解、实验结果与动手练习，把重要进展变成自己的工程能力。
      </p>
    </header>

    <section aria-label="本机学习记录" className="mb-5 flex flex-wrap items-center gap-4 rounded-xl border p-4 text-sm">
      <p>本机完成记录：<strong>{completed}</strong> 期 · 已浏览不等于已完成；记录仅在此浏览器保存，保留最近 100 期。</p>
      <label>当前页学习状态 <select className="ml-2 rounded border px-2 py-1" value={learningFilter} onChange={event => setLearningFilter(event.target.value)}>
        <option value="all">全部</option><option value="learning">学习中</option><option value="practice">待练习</option><option value="completed">已完成</option>
      </select></label>
      {!available && <p role="status">浏览器无法读取或保存学习记录，仍可阅读公开文章。</p>}
    </section>
    {continuing && <Link scroll={false} href={'/blog/'+continuing.slug+'?resume=1'} className="mb-7 flex items-center justify-between gap-4 rounded-xl border border-indigo-100 bg-indigo-50/60 px-5 py-4 hover:border-indigo-300">
      <div className="min-w-0"><p className="text-xs font-bold text-indigo-600">继续学习 · {learningLabels[continuing.state]}（本机）</p><p className="mt-1 truncate text-sm font-semibold text-indigo-950">{continuing.title}</p></div><ArrowRight className="h-5 w-5 shrink-0 text-indigo-600"/>
    </Link>}
    {!continuing && lastRead && <Link href={'/blog/'+lastRead.slug}
      className="mb-7 flex items-center justify-between gap-4 rounded-xl border border-indigo-100 bg-indigo-50/60 px-5 py-4 hover:border-indigo-300">
      <div className="min-w-0">
        <p className="text-xs font-bold text-indigo-600">最近浏览 · 开始学习</p>
        <p className="mt-1 truncate text-sm font-semibold text-indigo-950">{lastRead.title}</p>
      </div>
      <ArrowRight className="h-5 w-5 shrink-0 text-indigo-600" />
    </Link>}

    <nav aria-label="专刊主题筛选" className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      <Link href={target(null)} aria-current={!topic?'page':undefined}
        className={'rounded-xl border p-4 transition '+(!topic?'border-blue-500 bg-blue-50 text-blue-800':'border-gray-200 bg-white text-gray-700 hover:border-blue-200')}>
        <span className="flex items-center gap-2 text-sm font-bold"><Layers className="h-4 w-4"/> 全部主题</span>
        <span className="mt-2 block text-xs opacity-70">{Object.values(topicCounts).reduce((a,b)=>a+(b||0),0)} 期专刊</span>
      </Link>
      {kinds.map(t=><Link href={target(t)} key={t} aria-current={topic===t?'page':undefined}
        className={'rounded-xl border p-4 transition '+(topic===t?'border-blue-500 bg-blue-50 text-blue-800':'border-gray-200 bg-white text-gray-700 hover:border-blue-200')}>
        <span className="block text-sm font-bold">{TOPICS[t]}</span>
        <span className="mt-2 block text-xs opacity-70">{iconFor[t]} · {topicCounts[t]??0} 期</span>
      </Link>)}
    </nav>

    {learningPaths}
    {featured && <section aria-label="最新技术精读" className="mb-10 rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-7 sm:p-9">
      <div className="mb-3 inline-flex items-center gap-2 text-xs font-bold text-blue-700">
        <CalendarDays className="h-4 w-4"/> 最新一期 · {featured.date}
      </div>
      <h2 className="max-w-4xl text-2xl font-black leading-snug text-gray-900 sm:text-3xl">
        <Link href={'/blog/'+featured.slug} className="hover:text-blue-700">{featured.title}</Link>
      </h2>
      <p className="mt-4 max-w-4xl text-base leading-8 text-gray-600">{featured.excerpt}</p>
      {records[featured.slug] && <p className="mt-3 text-sm font-semibold text-indigo-700">{learningLabels[records[featured.slug].state]}（本机）</p>}
      <Link href={'/blog/'+featured.slug}
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700">
        阅读本期 <ArrowRight className="h-4 w-4"/>
      </Link>
    </section>}

    <section aria-label="历史精读">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
        <h2 className="text-xl font-bold text-gray-900">{topic?TOPICS[topic]+' · 专刊归档':'往期专刊'}</h2>
        <p className="inline-flex items-center gap-1.5 text-xs text-gray-500"><Clock className="h-4 w-4"/> 共 {total} 期</p>
      </div>
      {total===0
        ? <p className="rounded-2xl bg-gray-50 p-8 text-gray-500">
            {topic?'该主题暂无已发布文章。':'精读专刊准备中，敬请期待。'}
          </p>
        : listing.length
          ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{listing.map(item=>
              <ArticleCard article={item} key={item.slug}/>)}</div>
          : <p className="rounded-2xl bg-gray-50 p-8 text-gray-500">{learningFilter === 'all' ? '当前页暂无更多文章。' : '当前页暂无符合学习状态的文章，可切换筛选或查看其他归档页。'}</p>
      }
    </section>

    {totalPages>1 && <nav aria-label="专刊归档分页" className="mt-10 flex items-center justify-center gap-4">
      {page>1 && <Link href={target(topic,page-1)} className="rounded-lg border px-4 py-2 text-sm hover:border-blue-300">上一页</Link>}
      <span className="text-sm text-gray-500">第 {page} / {totalPages} 页</span>
      {page<totalPages && <Link href={target(topic,page+1)} className="rounded-lg border px-4 py-2 text-sm hover:border-blue-300">下一页</Link>}
    </nav>}
  </main>
}
