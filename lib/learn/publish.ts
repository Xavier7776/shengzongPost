import { sql } from '@/lib/db/_core'
import { revalidatePath } from 'next/cache'
import type { Edition } from './document'
import { TOPICS, trustedUrl, validateEdition } from './document'
import { getSiteUrl } from '@/lib/site-url'
import { canonicalEdition, editionFingerprint, PublicationError, slugFor, textVersion } from './publication-contract'
export { slugFor, textVersion } from './publication-contract'

async function readPublication(e: Edition) {
  return sql`SELECT p.id,p.slug,p.title,p.excerpt,p.content,p.tags,p.published,
      l.post_id,l.edition_date::text,l.topic,l.document,l.status
    FROM posts p FULL OUTER JOIN learn_editions l ON l.post_id=p.id
    WHERE p.slug=${slugFor(e)} OR l.edition_date=${e.date}::date`
}
function matches(rows: Record<string, unknown>[], e: Edition): boolean {
  const row = rows[0]
  return rows.length === 1 && row.id === row.post_id && row.post_id != null &&
    row.slug === slugFor(e) && row.published === true && row.status === 'published' &&
    row.edition_date === e.date && row.topic === e.topic && row.title === e.title && row.excerpt === e.excerpt &&
    row.content === textVersion(e) && JSON.stringify(row.tags) === JSON.stringify([TOPICS[e.topic],'AI技术精读','自动发布']) &&
    validateEdition(row.document).ok && editionFingerprint(row.document as Edition) === editionFingerprint(e)
}
async function verifySources(e: Edition) {
  // No redirects: even a trusted source must not redirect a server fetch to an internal host.
  const verified = await Promise.all(e.sources.map(async source => {
    if (!trustedUrl(source.url, source.kind)) return 'sources.' + source.id + ': untrusted URL'
    try {
      const response = await fetch(source.url, {redirect:'error', signal:AbortSignal.timeout(4000), cache:'no-store'})
      await response.body?.cancel()
      return response.ok ? null : 'sources.' + source.id + ': HTTP ' + response.status
    } catch { return 'sources.' + source.id + ': unreachable or timed out' }
  }))
  const reasons = verified.filter((reason): reason is string => reason !== null)
  if (reasons.length) throw new PublicationError('source_unverified', slugFor(e), false, reasons)
}
export async function publicVisibility(e: Edition) {
  const fingerprint = editionFingerprint(e)
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(new URL('/blog/' + slugFor(e), getSiteUrl()).href,
        {signal:AbortSignal.timeout(3000), cache:'no-store', redirect:'error'})
      const html = response.ok ? await response.text() : ''
      if (html.includes(`data-learn-fingerprint="${fingerprint}"`) && html.includes(`data-learn-slug="${slugFor(e)}"`)) return 'public_ready' as const
    } catch { /* Public delay does not justify another database write. */ }
    if (attempt < 2) await new Promise(resolve => setTimeout(resolve, 250))
  }
  return 'public_pending' as const
}
/** Atomic insert followed by independent verification; never overwrite an existing edition. */
export async function publishEdition(e: Edition) {
  const verdict = validateEdition(e)
  if (!verdict.ok) throw new Error('quality gate rejected: ' + verdict.errors.join('; '))
  // Freeze caller-owned objects before the first await, preserving all content and array order.
  e = JSON.parse(canonicalEdition(e)) as Edition
  const slug = slugFor(e)
  const existing = await readPublication(e)
  if (existing.length && !matches(existing, e)) throw new PublicationError('conflict', slug)
  let created = false
  if (!existing.length) {
    await verifySources(e)
    let rows
    try { rows = await sql`WITH p AS (
    INSERT INTO posts(slug,title,excerpt,content,tags,published,author_id)
    VALUES(${slug},${e.title},${e.excerpt},${textVersion(e)},
      ${[TOPICS[e.topic],'AI技术精读','自动发布']},TRUE,
      (SELECT id FROM users WHERE role='admin' ORDER BY id LIMIT 1))
    ON CONFLICT(slug) DO NOTHING RETURNING id
  ), l AS (
    INSERT INTO learn_editions(post_id,edition_date,topic,document)
    SELECT id,${e.date}::date,${e.topic},${JSON.stringify(e)}::jsonb FROM p
    RETURNING post_id
  ) SELECT (SELECT COUNT(*)::int FROM l) AS inserted` } catch (error) {
      if ((error as {code?:string}).code === '23505') throw new PublicationError('conflict', slug)
      throw error
    }
    created = Number(rows[0]?.inserted) === 1
    let readback
    try { readback = await readPublication(e) } catch { throw new PublicationError('readback_failed', slug, created) }
    if (!matches(readback, e)) throw new PublicationError(created ? 'readback_failed' : 'conflict', slug, created)
  }
  let cacheStatus: 'invalidated' | 'unchanged' | 'failed' = 'unchanged'
  if (created) {
    try { revalidatePath('/blog'); revalidatePath('/learn'); revalidatePath('/blog/' + slug); cacheStatus = 'invalidated' }
    catch { cacheStatus = 'failed' }
  }
  return { created, alreadyExists: !created, slug, verified:true, fingerprint:editionFingerprint(e),
    dbStatus:'db_ready' as const, cacheStatus, publicStatus:await publicVisibility(e) }
}
