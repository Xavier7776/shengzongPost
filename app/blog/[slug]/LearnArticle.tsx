import { sql } from '@/lib/db/_core'
import { validateEdition, type Edition } from '@/lib/learn/document'
import { textVersion } from '@/lib/learn/publish'
import LearnInteractive from '@/components/learn/LearnInteractive'
export default async function LearnArticle({slug,content}:{slug:string;content:string}) {
  let rows
  try {
    rows=await sql`SELECT l.document FROM learn_editions l JOIN posts p ON p.id=l.post_id
      WHERE p.slug=${slug} AND p.published=TRUE LIMIT 1`
  } catch (error) {
    if ((error as { code?: string }).code === '42P01') return null
    throw error
  }
  const edition=rows[0]?.document as Edition | undefined
  if (!edition || !validateEdition(edition).ok || textVersion(edition)!==content) return null
  return <LearnInteractive edition={edition}/>
}
