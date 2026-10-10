import type { PostMeta } from '@/lib/db/posts'
import type { Topic } from '@/lib/learn/document'

// Editors manage membership here or with the existing 系列：<title> article tag.
export const READING_SERIES: { title: string; topic: Topic; tags: string[]; project: string | null; steps: { phase: string; slug: string }[] }[] = [
  { title: 'Agent 架构与治理', topic: 'agent', tags: ['agent', 'agents', 'context engineering'], project: 'Mindstack', steps: [
    { phase: '基础知识', slug: 'ai-agent-explained' },
    { phase: '架构理解', slug: 'deep-dive-ai-agent-arch-20260521' },
    { phase: '代码实践', slug: 'ai-coding-agent-infra-20260525' },
    { phase: '实验评估', slug: 'ai-agent-five-plane-governance-architecture-20260612' },
  ] },
  { title: 'RAG 与长期记忆', topic: 'rag', tags: ['rag', 'vector db', 'knowledge-graph', 'memory'], project: 'Mnemo', steps: [
    { phase: '基础知识', slug: 'rag-deep-dive' },
    { phase: '架构理解', slug: 'ai-agent-memory-knowledge-graphs-20260531' },
    { phase: '代码实践', slug: 'context-engineering-ai-agents-20260610' },
    { phase: '实验评估', slug: 'daily-learn-2026-10-09' },
  ] },
  { title: '模型架构与工程', topic: 'engineering', tags: ['transformer', 'attention', 'lora', 'fine-tuning', 'moe'], project: null, steps: [
    { phase: '基础知识', slug: 'transformer-architecture' },
    { phase: '架构理解', slug: 'moe-architecture-deep-dive-20260520' },
    { phase: '代码实践', slug: 'llm-finetuning-guide' },
    { phase: '实验评估', slug: 'flash-attention-deep-dive-20260520' },
  ] },
]
const normalize = (tag: string) => tag.normalize('NFKC').trim().toLowerCase()
const genericTags = new Set(['ai', 'llm', 'llms', '自动发布', 'ai技术精读'])
const publicSlug = new RegExp('^[\\p{L}\\p{N}_-]+$', 'u')
export function postSeries(post: Pick<PostMeta, 'slug' | 'tags'>) {
  const tags = (post.tags ?? []).map(normalize)
  return READING_SERIES.filter(series => series.steps.some(step => step.slug === post.slug) || tags.includes(normalize('系列：'+series.title)))
}
export function publicDiscoveryPosts(posts: PostMeta[]) {
  const seen = new Set<string>()
  return posts.filter(post => {
    if (post.published !== true || !publicSlug.test(post.slug) || seen.has(post.slug)) return false
    seen.add(post.slug)
    return true
  })
}
export function relatedPosts(posts: PostMeta[], current?: PostMeta, projectSlug?: string) {
  const series = projectSlug ? READING_SERIES.filter(s => s.project === projectSlug) : current ? postSeries(current) : []
  const tags = (current?.tags ?? []).map(normalize).filter(tag => !genericTags.has(tag))
  const time = (post: PostMeta) => Date.parse(post.updated_at || post.created_at) || 0
  return publicDiscoveryPosts(posts).filter(post => post.slug !== current?.slug).map(post => {
    const sameSeries = postSeries(post).find(s => series.includes(s))
    const sameTags = (post.tags ?? []).filter(tag => tags.includes(normalize(tag)))
    const topic = READING_SERIES.find(s => series.includes(s) && (post.tags ?? []).some(tag => s.tags.includes(normalize(tag))))
    return { post, priority: sameSeries ? 0 : sameTags.length ? 1 : topic ? 2 : 3,
      reason: sameSeries ? '同系列 · '+sameSeries.title : sameTags.length ? '共同标签 · '+sameTags.slice(0, 2).join('、') : topic ? '相近主题 · '+topic.title : '最近更新' }
  }).sort((a, b) => a.priority-b.priority || time(b.post)-time(a.post) || b.post.id-a.post.id || a.post.slug.localeCompare(b.post.slug)).slice(0, 5)
}
