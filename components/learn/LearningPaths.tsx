import Link from 'next/link'
import { getDiscoveryContent } from '@/lib/db/discovery'
import { publicDiscoveryPosts, READING_SERIES } from '@/lib/content-discovery'
import type { Topic } from '@/lib/learn/document'

export default async function LearningPaths({ topic }: { topic: Topic | null }) {
  try {
    const { posts } = await getDiscoveryContent()
    const published = publicDiscoveryPosts(posts)
    const paths = READING_SERIES.filter(series => !topic || series.topic === topic).map(series => ({ ...series,
      steps: series.steps.flatMap(step => { const post = published.find(p => p.slug === step.slug); return post ? [{ ...step, title: post.title }] : [] }),
    })).filter(series => series.steps.length > 0)
    if (!paths.length) return null
    return <section aria-label="建议学习路线" className="mb-10 rounded-2xl border border-gray-200 p-5 sm:p-7">
      <h2 className="text-xl font-bold">建议学习路线</h2><p className="mt-2 text-sm leading-7 text-gray-600">个人策展的阅读顺序，按基础、架构、实践、评估串联已有文章；不是官方必修课程。实践与评估需要你动手验证，阅读不等于复现。</p>
      <div className="mt-5 grid gap-5 lg:grid-cols-3">{paths.map(series => <div key={series.title}><h3 className="font-semibold">{series.title}</h3><ol aria-label={series.title+'阅读顺序'} className="mt-3 space-y-3">{series.steps.map(step => <li key={step.slug}><Link href={'/blog/'+encodeURIComponent(step.slug)} className="block rounded-lg border p-3 text-sm leading-6 hover:border-blue-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"><span className="block text-xs font-bold text-blue-700">{step.phase}</span>{step.title}</Link></li>)}</ol></div>)}</div>
    </section>
  } catch { console.error('[discovery] learning paths unavailable'); return null }
}
