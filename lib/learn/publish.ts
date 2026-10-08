import { sql } from '@/lib/db/_core'
import { revalidatePath } from 'next/cache'
import type { Edition } from './document'
import { TOPICS, validateEdition } from './document'

export const slugFor = (e: Edition) => 'daily-learn-' + e.date
export function textVersion(e: Edition) {
  return [e.lead, ...e.blocks.map(b => {
    if ('text' in b) return b.text
    if (b.type === 'diagram') return b.steps.map(s => s.title + ': ' + s.description).join(' ')
    if (b.type === 'quiz') return b.question + ': ' + b.explanation
    if (b.type === 'code') return b.caption + '\n' + b.code
    return b.title + ': ' + b.caption
  }), e.practice.title, ...e.practice.steps, ...e.takeaways, e.careerTip,
  ...e.sources.map(s => s.title + ' — ' + s.url)].join('\n\n')
}
/** Idempotent single SQL statement; conflicts with manually edited existing posts fail closed. */
export async function publishEdition(e: Edition) {
  const verdict = validateEdition(e)
  if (!verdict.ok) throw new Error('quality gate rejected: ' + verdict.errors.join('; '))
  const slug = slugFor(e)
  const rows = await sql`WITH p AS (
    INSERT INTO posts(slug,title,excerpt,content,tags,published,author_id)
    VALUES(${slug},${e.title},${e.excerpt},${textVersion(e)},
      ${[TOPICS[e.topic],'AI技术精读','自动发布']},TRUE,
      (SELECT id FROM users WHERE role='admin' ORDER BY id LIMIT 1))
    ON CONFLICT(slug) DO NOTHING RETURNING id
  ), l AS (
    INSERT INTO learn_editions(post_id,edition_date,topic,document)
    SELECT id,${e.date}::date,${e.topic},${JSON.stringify(e)}::jsonb FROM p
    RETURNING post_id
  ) SELECT (SELECT COUNT(*)::int FROM l) AS inserted`
  const created = Number(rows[0]?.inserted ?? 0) === 1
  if (!created) {
    const existing = await sql`SELECT l.post_id FROM learn_editions l JOIN posts p ON p.id=l.post_id
      WHERE l.edition_date=${e.date}::date AND p.slug=${slug} AND p.published=TRUE LIMIT 1`
    if (!existing.length) throw new Error('publication conflict')
  }
  if (created) { revalidatePath('/blog'); revalidatePath('/learn'); revalidatePath('/blog/' + slug) }
  return { created, slug }
}
