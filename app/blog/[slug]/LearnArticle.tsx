import { sql } from '@/lib/db/_core'
import { type Edition } from '@/lib/learn/document'
import { editionFingerprint } from '@/lib/learn/publication-contract'
import { auditPublication, type PublicationRow } from '@/lib/learn/operations'
import StudyArticle from '@/components/learn/StudyArticle'
export default async function LearnArticle({slug,content}:{slug:string;content:string}) {
  let rows
  try {
    rows=await sql`SELECT p.id,l.post_id,p.slug,p.title,p.published,p.content,p.created_at::text,
      l.edition_date::text,l.topic,l.document,l.status FROM learn_editions l JOIN posts p ON p.id=l.post_id
      WHERE p.slug=${slug} AND p.published=TRUE LIMIT 1`
  } catch (error) {
    if ((error as { code?: string }).code === '42P01') return null
    throw error
  }
  const row=rows[0] as PublicationRow | undefined
  if (!row || row.slug!==slug || row.content!==content) return null
  const audit=auditPublication(row)
  if (audit.code!=='ok' && audit.code!=='historical') return null
  const edition=row.document as Edition
  const fingerprint = editionFingerprint(edition)
  return <div data-learn-fingerprint={fingerprint} data-learn-slug={slug} data-learn-validation={audit.code}>
    <StudyArticle key={slug+':'+fingerprint} edition={edition} slug={slug} fingerprint={fingerprint}/>
  </div>
}
