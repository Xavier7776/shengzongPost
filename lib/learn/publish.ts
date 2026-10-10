import { sql } from '@/lib/db/_core'
import { invalidatePublishedContent } from '@/lib/content-cache'
import type { Edition, EditionV2 } from './document'
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
  const artifacts = e.version===2 ? [e.evidence,...e.otherUpdates,...e.blocks.filter(b=>b.type!=='heading'&&b.type!=='code'&&'evidenceType' in b)].flatMap(b=>
    'reproduction' in b && b.reproduction ? [b.reproduction.artifactUrl] : []) : []
  const checks = [...e.sources.map(s=>({id:'sources.'+s.id,url:s.url,allowed:trustedUrl(s.url,s.kind)})),
    ...Array.from(new Set(artifacts)).map((url,i)=>({id:'reproduction.'+i,url,allowed:/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/blob\/[a-f0-9]{40}\/[\w./-]+$/.test(url)}))]
  const verified = await Promise.all(checks.map(async source => {
    if (!source.allowed) return source.id + ': untrusted URL'
    try {
      const response = await fetch(source.url, {redirect:'error', signal:AbortSignal.timeout(4000), cache:'no-store'})
      await response.body?.cancel()
      return response.ok ? null : source.id + ': HTTP ' + response.status
    } catch { return source.id + ': unreachable or timed out' }
  }))
  const reasons = verified.filter((reason): reason is string => reason !== null)
  if (reasons.length) throw new PublicationError('source_unverified', slugFor(e), false, reasons)
}

/** Human-reviewed correction: compare-and-swap both representations in one statement. */
export async function reviseEdition(e: EditionV2, previousFingerprint: string) {
  const verdict=validateEdition(e)
  if(!verdict.ok || e.version!==2 || !/^[a-f0-9]{64}$/.test(previousFingerprint)) throw new Error('invalid correction contract')
  e=JSON.parse(canonicalEdition(e)) as EditionV2
  const slug=slugFor(e),rows=await readPublication(e),old=rows[0]?.document as Edition
  if(!old || !validateEdition(old).ok || !matches(rows,old)) throw new PublicationError('conflict',slug)
  if(editionFingerprint(old)===editionFingerprint(e))return {updated:false,alreadyExists:true,slug,fingerprint:editionFingerprint(e),dbStatus:'db_ready',cacheStatus:'unchanged',publicStatus:await publicVisibility(e)}
  const history=old.version===2?old.revisions:[],last=e.revisions[e.revisions.length-1]
  if(editionFingerprint(old)!==previousFingerprint || old.date!==e.date || old.topic!==e.topic ||
    e.revisions.length!==history.length+1 || canonicalEdition({...e,revisions:e.revisions.slice(0,-1)})!==canonicalEdition({...e,revisions:history}) ||
    last?.previousFingerprint!==previousFingerprint)throw new PublicationError('conflict',slug)
  await verifySources(e)
  const written=await sql`WITH current AS (
    SELECT p.id FROM posts p JOIN learn_editions l ON l.post_id=p.id
    WHERE p.slug=${slug} AND p.published=true AND l.status='published'
      AND l.edition_date=${old.date}::date AND l.topic=${old.topic} AND p.tags=${[TOPICS[old.topic],'AI技术精读','自动发布']}
      AND l.document=${JSON.stringify(old)}::jsonb AND p.content=${textVersion(old)}
      AND p.title=${old.title} AND p.excerpt=${old.excerpt}
    FOR UPDATE OF p,l
  ), updated_post AS (
    UPDATE posts p SET title=${e.title},excerpt=${e.excerpt},content=${textVersion(e)},updated_at=NOW()
    FROM current WHERE p.id=current.id RETURNING p.id
  ), updated_edition AS (
    UPDATE learn_editions l SET document=${JSON.stringify(e)}::jsonb
    FROM updated_post WHERE l.post_id=updated_post.id RETURNING l.post_id
  ) SELECT COUNT(*)::int AS updated FROM updated_edition`
  const updated=Number(written[0]?.updated)===1
  let readback
  try {readback=await readPublication(e)} catch {throw new PublicationError('readback_failed',slug,false,[],updated?true:null)}
  if(!matches(readback,e))throw new PublicationError(updated?'readback_failed':'conflict',slug,false,[],updated)
  // A transport retry can return zero after the first statement already committed.
  return {updated,alreadyExists:!updated,slug,fingerprint:editionFingerprint(e),dbStatus:'db_ready',
    cacheStatus:invalidatePublishedContent([slug]),publicStatus:await publicVisibility(e)}
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
    cacheStatus=invalidatePublishedContent([slug])
  }
  return { created, alreadyExists: !created, slug, verified:true, fingerprint:editionFingerprint(e),
    dbStatus:'db_ready' as const, cacheStatus, publicStatus:await publicVisibility(e) }
}
