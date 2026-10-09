import { sql } from '@/lib/db/_core'
import { TOPICS, type Topic } from '@/lib/learn/document'
import LearnCatalog, { type LearnCatalogArticle } from './LearnCatalog'
import type { Metadata } from 'next'

export const revalidate = 60
export const metadata: Metadata = {
  title: 'AI 技术图解精读 · MindStack',
  description: 'Agent 前沿、RAG 与检索、AI 原生软件工程、多模态技术：可核对的一手资料、架构图、代码、自测和实践。',
  alternates: { canonical: '/learn' },
}
const PAGE_SIZE = 24
type Params = { topic?: string; page?: string }
function selectedTopic(value: string | undefined): Topic | null {
  return value && Object.prototype.hasOwnProperty.call(TOPICS, value) ? value as Topic : null
}

export default async function LearnIndex({ searchParams }: { searchParams?: Params | Promise<Params> } = {}) {
  const params = await searchParams
  const topic = selectedTopic(params?.topic)
  const rawPage = Number.parseInt(params?.page ?? '1', 10)
  const page = Number.isFinite(rawPage) ? Math.max(1, Math.min(10000, rawPage)) : 1
  const offset = (page-1) * PAGE_SIZE

  let rows: Awaited<ReturnType<typeof sql>> = []
  let counts: Awaited<ReturnType<typeof sql>> = []
  let total = 0
  try {
    const items = topic
      ? sql`SELECT p.slug,p.title,p.excerpt,l.topic,l.edition_date::text AS edition_date
          FROM learn_editions l JOIN posts p ON p.id=l.post_id
          WHERE p.published=TRUE AND l.topic=${topic}
          ORDER BY l.edition_date DESC LIMIT ${PAGE_SIZE} OFFSET ${offset}`
      : sql`SELECT p.slug,p.title,p.excerpt,l.topic,l.edition_date::text AS edition_date
          FROM learn_editions l JOIN posts p ON p.id=l.post_id
          WHERE p.published=TRUE
          ORDER BY l.edition_date DESC LIMIT ${PAGE_SIZE} OFFSET ${offset}`
    const count = topic
      ? sql`SELECT COUNT(*)::int AS total FROM learn_editions l
          JOIN posts p ON p.id=l.post_id WHERE p.published=TRUE AND l.topic=${topic}`
      : sql`SELECT COUNT(*)::int AS total FROM learn_editions l
          JOIN posts p ON p.id=l.post_id WHERE p.published=TRUE`
    const grouped = sql`SELECT l.topic, COUNT(*)::int AS total FROM learn_editions l
      JOIN posts p ON p.id=l.post_id WHERE p.published=TRUE
      GROUP BY l.topic ORDER BY l.topic`
    const [pageRows, totalRows, countRows] = await Promise.all([items, count, grouped])
    rows = pageRows
    counts = countRows
    total = Number(totalRows[0]?.total ?? 0)
  } catch (error) {
    // Keep the public study center readable on partially migrated environments.
    if ((error as {code?:string}).code !== '42P01') throw error
  }

  const articles: LearnCatalogArticle[] = rows.map(row => ({
    slug: String(row.slug),
    title: String(row.title),
    excerpt: String(row.excerpt ?? ''),
    topic: row.topic as Topic,
    date: String(row.edition_date).slice(0,10),
  }))
  const topicCounts = Object.fromEntries(
    counts.map(row => [String(row.topic), Number(row.total)]),
  ) as Partial<Record<Topic, number>>
  return <LearnCatalog
    articles={articles} topic={topic} topicCounts={topicCounts}
    total={total} page={page} pageSize={PAGE_SIZE}
  />
}
