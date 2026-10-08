import { sql } from '@/lib/db/_core'
import type { Edition } from '@/lib/learn/document'
import LearnInteractive from '@/components/learn/LearnInteractive'
export default async function LearnArticle({slug}:{slug:string}) {
  const rows=await sql`SELECT l.document FROM learn_editions l JOIN posts p ON p.id=l.post_id
    WHERE p.slug=${slug} AND p.published=TRUE LIMIT 1`
  return rows.length ? <LearnInteractive edition={rows[0].document as Edition}/> : null
}
