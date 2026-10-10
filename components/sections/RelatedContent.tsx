import Link from 'next/link'
import { getDiscoveryContent } from '@/lib/db/discovery'
import { postSeries, publicDiscoveryPosts, relatedPosts } from '@/lib/content-discovery'

export default async function RelatedContent({ slug, projectSlug }: { slug?: string; projectSlug?: string }) {
  try {
    const { posts, projects } = await getDiscoveryContent()
    const current = slug ? publicDiscoveryPosts(posts).find(post => post.slug === slug) : undefined
    if (slug && !current) return null
    const suggestions = relatedPosts(posts, current, projectSlug)
    const series = current ? postSeries(current) : []
    const projectLinks = projects.filter(project => series.some(s => s.project === project.slug))
    if (!suggestions.length && !projectLinks.length) return null
    return <section aria-label={projectSlug ? '项目相关技术文章' : '相关推荐'} className="my-12 border-t border-gray-100 pt-8">
      <h2 className="text-xl font-bold text-gray-900">{projectSlug ? '技术决策与工程延伸' : '接下来读什么'}</h2>
      <p className="mt-2 text-sm leading-7 text-gray-600">{projectSlug ? '以下文章提供相关架构、实践与评估思路；项目实际 Benchmarks 和实现进度以项目正文及证据为准。' : '按系列、标签和主题继续探索。推荐理由见每张卡片。'}</p>
      <ul className="mt-5 grid gap-3 sm:grid-cols-2">
        {suggestions.map(({ post, reason }) => <li key={post.slug}><Link href={'/blog/'+encodeURIComponent(post.slug)} className="block h-full rounded-xl border border-gray-200 p-4 hover:border-blue-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600">
          <p className="text-xs font-semibold text-blue-700">{reason}</p><h3 className="mt-2 break-words font-semibold leading-7">{post.title}</h3><p className="mt-2 line-clamp-2 text-sm leading-7 text-gray-600">{post.excerpt}</p>
        </Link></li>)}
      </ul>
      {projectLinks.length > 0 && <nav aria-label="相关作品集" className="mt-5 flex flex-wrap gap-3">{projectLinks.map(project => <Link className="rounded-lg border px-4 py-2 text-sm font-semibold text-blue-700 hover:border-blue-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600" href={'/work/'+encodeURIComponent(project.slug)} key={project.slug}>工程案例 · {project.name}</Link>)}</nav>}
    </section>
  } catch { console.error('[discovery] related content unavailable'); return null }
}
