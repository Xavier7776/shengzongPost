import Link from 'next/link'
import { sql } from '@/lib/db/_core'
import { TOPICS, type Topic } from '@/lib/learn/document'
export const revalidate=60
export default async function LearnIndex(){
  let rows: Awaited<ReturnType<typeof sql>>
  try {
    rows=await sql`SELECT p.slug,p.title,p.excerpt,l.topic,l.edition_date FROM learn_editions l
      JOIN posts p ON p.id=l.post_id WHERE p.published=TRUE ORDER BY l.edition_date DESC LIMIT 90`
  } catch (error) {
    if ((error as { code?: string }).code !== '42P01') throw error
    rows=[]
  }
  return <main className="mx-auto max-w-5xl px-6 pb-24 pt-32">
    <h1 className="text-4xl font-black">AI 技术图解精读</h1>
    <p className="my-6 text-gray-500">Agent · RAG · 软件工程 · 多模态。每天一篇有来源、有实践的深度学习专刊。</p>
    {rows.length===0&&<p className="py-8 text-gray-500">精读专刊准备中，敬请期待。</p>}
    <div className="grid gap-4 sm:grid-cols-2">{rows.map((r:any)=>
      <Link key={r.slug} href={'/blog/'+r.slug} className="rounded-xl border p-6 hover:border-blue-400">
        <div className="mb-3 text-xs text-blue-600">{TOPICS[r.topic as Topic]} · {String(r.edition_date).slice(0,10)}</div>
        <h2 className="text-xl font-bold">{r.title}</h2><p className="mt-3 text-sm text-gray-600">{r.excerpt}</p>
      </Link>)}</div>
  </main>
}
