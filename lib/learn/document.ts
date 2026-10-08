/** Validated, inert data format for automated educational articles. */
export const TOPICS = {
  agent: 'Agent 前沿', rag: 'RAG 与检索',
  engineering: '软件工程', multimodal: '多模态技术',
} as const
export type Topic = keyof typeof TOPICS
export type SourceKind = 'arxiv' | 'github_release'
export interface Source {
  id: string; topic: Topic; kind: SourceKind; title: string
  url: string; publishedAt: string; excerpt: string
}
export type Block =
  | { type: 'heading'; level: 2 | 3; text: string }
  | { type: 'paragraph'; text: string; sourceIds: string[] }
  | { type: 'callout'; tone: 'insight' | 'warning'; title: string; text: string; sourceIds: string[] }
  | { type: 'diagram'; title: string; caption: string; steps: { title: string; description: string }[]; sourceIds: string[] }
  | { type: 'chart'; title: string; caption: string; unit: string; illustrative: true; points: { label: string; value: number }[]; sourceIds: string[] }
  | { type: 'code'; language: string; code: string; caption: string; illustrative: true }
  | { type: 'quiz'; question: string; options: string[]; answerIndex: number; explanation: string; sourceIds: string[] }
export interface Edition {
  version: 1; date: string; topic: Topic; title: string; excerpt: string
  lead: string; primarySourceId: string; sources: Source[]; blocks: Block[]
  practice: { title: string; minutes: number; steps: string[]; acceptance: string }
  takeaways: string[]; careerTip: string
  otherUpdates: { sourceId: string; summary: string }[]
}
type Obj = Record<string, unknown>
const obj = (v: unknown): v is Obj => v !== null && typeof v === 'object' && !Array.isArray(v)
const str = (v: unknown, min = 1, max = 9000): v is string =>
  typeof v === 'string' && v.trim().length >= min && v.length <= max
const strings = (v: unknown, min: number, max: number): v is string[] =>
  Array.isArray(v) && v.length >= min && v.length <= max && v.every(x => str(x, 1, 500))

export function chinaDate(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now)
  const value = (key: string) => parts.find(p => p.type === key)?.value ?? ''
  return [value('year'), value('month'), value('day')].join('-')
}
export function trustedUrl(url: string, kind: SourceKind): boolean {
  try {
    const u = new URL(url)
    if (u.protocol !== 'https:' || u.username || u.password || u.port || u.search || u.hash) return false
    return kind === 'arxiv'
      ? u.hostname === 'arxiv.org' && /^\/abs\/[a-zA-Z0-9./-]+$/.test(u.pathname)
      : u.hostname === 'github.com' && /^\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+\/releases\/tag\/[^/]+$/.test(u.pathname)
  } catch { return false }
}
/** Structural, provenance and safety gate, not independent scientific fact-checking. */
export function validateEdition(raw: unknown): { ok: boolean; errors: string[]; charCount: number } {
  const errors: string[] = []
  if (!obj(raw)) return { ok: false, errors: ['not an object'], charCount: 0 }
  if (JSON.stringify(raw).length > 180000) errors.push('payload exceeds size limit')
  if (raw.version !== 1) errors.push('unsupported content schema')
  const date = raw.date
  const dateMs = typeof date === 'string' ? Date.parse(date + 'T00:00:00Z') : NaN
  if (!str(date, 10, 10) || !/^\d{4}-\d{2}-\d{2}$/.test(String(date)) || !Number.isFinite(dateMs)) errors.push('invalid date')
  if (typeof raw.topic !== 'string' || !(raw.topic in TOPICS)) errors.push('invalid topic')
  if (!str(raw.title, 12, 120)) errors.push('invalid title')
  if (!str(raw.excerpt, 60, 400)) errors.push('invalid excerpt')
  if (!str(raw.lead, 100, 1500)) errors.push('invalid lead')
  if (!str(raw.careerTip, 60, 1000)) errors.push('missing career guidance')
  const ids = new Set<string>()
  const urls = new Set<string>()
  if (!Array.isArray(raw.sources) || raw.sources.length < 2 || raw.sources.length > 5) errors.push('needs 2-5 real sources')
  for (const [i, item] of (Array.isArray(raw.sources) ? raw.sources : []).entries()) {
    if (!obj(item)) { errors.push('source ' + i + ': invalid'); continue }
    if (!str(item.id, 2, 12) || !/^s\d+$/.test(String(item.id)) || ids.has(String(item.id))) errors.push('source ' + i + ': duplicate/invalid id')
    else ids.add(String(item.id))
    if (item.topic !== raw.topic || !str(item.title, 8, 250) || !str(item.excerpt, 100, 9500)) errors.push('source ' + i + ': insufficient evidence')
    if ((item.kind !== 'arxiv' && item.kind !== 'github_release') || !str(item.url, 25, 1200) ||
        !trustedUrl(String(item.url), item.kind as SourceKind) || urls.has(String(item.url))) errors.push('source ' + i + ': untrusted/duplicate URL')
    else urls.add(String(item.url))
    const published = typeof item.publishedAt === 'string' ? Date.parse(item.publishedAt) : NaN
    if (!Number.isFinite(published) || !Number.isFinite(dateMs) ||
        published > dateMs + 2 * 86400000 || published < dateMs - 8 * 86400000) errors.push('source ' + i + ': outside last 7 days')
  }
  if (!str(raw.primarySourceId, 2, 12) || !ids.has(String(raw.primarySourceId))) errors.push('missing primary source')
  function cite(block: Obj, i: number) {
    if (!strings(block.sourceIds, 1, 5) || block.sourceIds.some(id => !ids.has(id))) errors.push('block ' + i + ': missing/verifiably invalid citations')
  }
  const blocks = Array.isArray(raw.blocks) ? raw.blocks : []
  if (blocks.length < 15 || blocks.length > 50) errors.push('needs 15-50 blocks')
  const counts: Record<string, number> = {}
  let narrative = typeof raw.lead === 'string' ? raw.lead : ''
  for (const [i, b] of blocks.entries()) {
    if (!obj(b) || !str(b.type, 2, 20)) { errors.push('block ' + i + ': invalid'); continue }
    counts[b.type] = (counts[b.type] ?? 0) + 1
    switch (b.type) {
      case 'heading':
        if ((b.level !== 2 && b.level !== 3) || !str(b.text, 4, 130)) errors.push('block ' + i + ': heading')
        break
      case 'paragraph':
        if (!str(b.text, 120, 1500)) errors.push('block ' + i + ': paragraph')
        if (typeof b.text === 'string') narrative += b.text
        cite(b, i); break
      case 'callout':
        if ((b.tone !== 'insight' && b.tone !== 'warning') || !str(b.title, 4, 100) || !str(b.text, 50, 900)) errors.push('block ' + i + ': callout')
        if (typeof b.text === 'string') narrative += b.text
        cite(b, i); break
      case 'diagram':
        if (!str(b.title, 5, 120) || !str(b.caption, 10, 350) ||
            !Array.isArray(b.steps) || b.steps.length < 3 || b.steps.length > 9 ||
            b.steps.some(s => !obj(s) || !str(s.title, 2, 100) || !str(s.description, 15, 300))) errors.push('block ' + i + ': diagram')
        if (Array.isArray(b.steps)) narrative += b.steps.map(s => obj(s) && typeof s.description === 'string' ? s.description : '').join('')
        cite(b, i); break
      case 'chart':
        if (!str(b.title, 5, 120) || !str(b.caption, 15, 350) || !str(b.unit, 1, 24) ||
            b.illustrative !== true || !Array.isArray(b.points) || b.points.length < 2 || b.points.length > 9 ||
            b.points.some(p => !obj(p) || !str(p.label, 1, 40) ||
              typeof p.value !== 'number' || !Number.isFinite(p.value) || p.value < 0 || p.value > 1000000)) errors.push('block ' + i + ': chart must be illustrative')
        cite(b, i); break
      case 'code':
        if (!str(b.language, 1, 20) || !str(b.code, 50, 6000) ||
            !str(b.caption, 15, 300) || b.illustrative !== true) errors.push('block ' + i + ': example code')
        break
      case 'quiz':
        if (!str(b.question, 20, 350) || !strings(b.options, 2, 5) ||
            !Number.isInteger(b.answerIndex) || Number(b.answerIndex) < 0 ||
            Number(b.answerIndex) >= (Array.isArray(b.options) ? b.options.length : 0) ||
            !str(b.explanation, 40, 550)) errors.push('block ' + i + ': quiz')
        cite(b, i); break
      default: errors.push('block ' + i + ': unknown component')
    }
  }
  for (const [kind, n] of Object.entries({ heading: 5, paragraph: 8, callout: 1, diagram: 1, chart: 1, code: 1, quiz: 2 })) {
    if ((counts[kind] ?? 0) < n) errors.push('missing block: ' + kind)
  }
  if (!obj(raw.practice) || !str(raw.practice.title, 6, 120) ||
      !Number.isInteger(raw.practice.minutes) || Number(raw.practice.minutes) < 15 ||
      Number(raw.practice.minutes) > 60 || !strings(raw.practice.steps, 2, 6) ||
      !str(raw.practice.acceptance, 30, 800)) errors.push('practice / acceptance missing')
  if (!strings(raw.takeaways, 3, 3)) errors.push('requires three takeaways')
  if (!Array.isArray(raw.otherUpdates) || raw.otherUpdates.length < 1 || raw.otherUpdates.length > 3 ||
      raw.otherUpdates.some(x => !obj(x) || !str(x.sourceId, 2, 12) || !ids.has(String(x.sourceId)) ||
        x.sourceId === raw.primarySourceId || !str(x.summary, 40, 400))) errors.push('other updates invalid')
  if (narrative.length < 2600 || narrative.length > 11000 ||
      (narrative.match(/[\u4e00-\u9fff]/g) ?? []).length < 1600) errors.push('depth / Chinese length gate failed')
  return { ok: errors.length === 0, errors, charCount: narrative.length }
}
