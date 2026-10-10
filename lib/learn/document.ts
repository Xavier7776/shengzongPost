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
export type BlockV1 =
  | { type: 'heading'; level: 2 | 3; text: string }
  | { type: 'paragraph'; text: string; sourceIds: string[] }
  | { type: 'callout'; tone: 'insight' | 'warning'; title: string; text: string; sourceIds: string[] }
  | { type: 'diagram'; title: string; caption: string; steps: { title: string; description: string }[]; sourceIds: string[] }
  | { type: 'chart'; title: string; caption: string; unit: string; illustrative: true; points: { label: string; value: number }[]; sourceIds: string[] }
  | { type: 'code'; language: string; code: string; caption: string; illustrative: true }
  | { type: 'quiz'; question: string; options: string[]; answerIndex: number; explanation: string; sourceIds: string[] }
export interface EditionV1 {
  version: 1; date: string; topic: Topic; title: string; excerpt: string
  lead: string; primarySourceId: string; sources: Source[]; blocks: BlockV1[]
  practice: { title: string; minutes: number; steps: string[]; acceptance: string }
  takeaways: string[]; careerTip: string
  otherUpdates: { sourceId: string; summary: string }[]
}
export interface ClaimSourceRef { sourceId: string; evidenceLocation: string }
export type EvidenceType = 'paper_report' | 'release_report' | 'teaching_example' | 'site_reproduction'
export interface Evidence {
  evidenceType: EvidenceType; claimSourceRefs: ClaimSourceRef[]
  reproduction?: { artifactUrl: string; commit: string; runAt: string; protocol: string }
}
export interface SourceV2 extends Source {
  authors: string[]; organization: string; version: string; checkedAt: string
  verification: 'verified' | 'pending_review'
  researchQuestion: string; method: string; experimentalData: string; limitations: string
}
export type ChartV2 = Omit<Extract<BlockV1, {type:'chart'}>, 'illustrative' | 'points'> & Evidence & {
  dataOrigin: 'illustrative' | 'paper' | 'reproduced'; xAxis: string; yAxis: string
  points: { label: string; value: number; claimSourceRefs: ClaimSourceRef[]; confidenceInterval: {low:number;high:number} | null }[]
  experiment: { sampleSize: string; metricDirection: 'higher' | 'lower'; baseline: string; conditions: string; randomSeed: string | null }
}
export type BlockV2 = Exclude<BlockV1, {type:'heading'|'code'|'chart'}> & Evidence | Extract<BlockV1, {type:'heading'|'code'}> | ChartV2
export type Block = BlockV1 | BlockV2
export interface Revision { number: number; correctedAt: string; summary: string; previousFingerprint: string }
export interface EditionV2 extends Omit<EditionV1, 'version' | 'sources' | 'blocks' | 'otherUpdates'> {
  version: 2; sources: SourceV2[]; blocks: BlockV2[]
  evidence: Evidence; revisions: Revision[]
  otherUpdates: (EditionV1['otherUpdates'][number] & Evidence)[]
}
export type Edition = EditionV1 | EditionV2
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
  if (raw.version !== 1 && raw.version !== 2) errors.push('unsupported content schema')
  const date = raw.date
  const dateMs = typeof date === 'string' ? Date.parse(date + 'T00:00:00Z') : NaN
  if (!str(date, 10, 10) || !/^\d{4}-\d{2}-\d{2}$/.test(String(date)) || !Number.isFinite(dateMs) ||
      new Date(dateMs).toISOString().slice(0, 10) !== date) errors.push('invalid date')
  if (typeof raw.topic !== 'string' || !Object.prototype.hasOwnProperty.call(TOPICS, raw.topic)) errors.push('invalid topic')
  if (!str(raw.title, 12, 120)) errors.push('invalid title')
  if (!str(raw.excerpt, 60, 400)) errors.push('invalid excerpt')
  if (!str(raw.lead, 100, 1500)) errors.push('invalid lead')
  if (!str(raw.careerTip, 60, 1000)) errors.push('missing career guidance')
  const ids = new Set<string>()
  const urls = new Set<string>()
  if (!Array.isArray(raw.sources) || raw.sources.length < 2 || raw.sources.length > 5) errors.push('needs 2-5 real sources')
  for (const [i, item] of Array.from((Array.isArray(raw.sources) ? raw.sources : []).entries())) {
    if (!obj(item)) { errors.push('source ' + i + ': invalid'); continue }
    if (!str(item.id, 2, 12) || !/^s\d+$/.test(String(item.id)) || ids.has(String(item.id))) errors.push('source ' + i + ': duplicate/invalid id')
    else ids.add(String(item.id))
    if (item.topic !== raw.topic || !str(item.title, 8, 250) || !str(item.excerpt, 100, 9500)) errors.push('source ' + i + ': insufficient evidence')
    if ((item.kind !== 'arxiv' && item.kind !== 'github_release') || !str(item.url, 25, 1200) ||
        !trustedUrl(String(item.url), item.kind as SourceKind) || urls.has(String(item.url))) errors.push('source ' + i + ': untrusted/duplicate URL')
    else urls.add(String(item.url))
    const published = typeof item.publishedAt === 'string' ? Date.parse(item.publishedAt) : NaN
    if (!Number.isFinite(published) || !Number.isFinite(dateMs) ||
        published >= dateMs + 16 * 3600000 || published < dateMs - 7 * 86400000 - 8 * 3600000) errors.push('source ' + i + ': outside last 7 days')
  }
  if (!str(raw.primarySourceId, 2, 12) || !ids.has(String(raw.primarySourceId))) errors.push('missing primary source')
  function cite(block: Obj, i: number) {
    if (!strings(block.sourceIds, 1, 5) || block.sourceIds.some(id => !ids.has(id))) errors.push('block ' + i + ': missing/verifiably invalid citations')
  }
  const blocks = Array.isArray(raw.blocks) ? raw.blocks : []
  if (blocks.length < 15 || blocks.length > 50) errors.push('needs 15-50 blocks')
  const counts: Record<string, number> = {}
  let narrative = typeof raw.lead === 'string' ? raw.lead : ''
  for (const [i, b] of Array.from(blocks.entries())) {
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
            (raw.version === 1 && b.illustrative !== true) || !Array.isArray(b.points) || b.points.length < 2 || b.points.length > 9 ||
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
  if (raw.version === 2) validateProvenance(raw, errors)
  return { ok: errors.length === 0, errors, charCount: narrative.length }
}

function validateProvenance(e: Obj, errors: string[]) {
  const sources = Array.isArray(e.sources) ? e.sources.filter(obj) : []
  const dateEnd = Date.now()
  const timestamp = (v: unknown) => typeof v === 'string' && /T.*(?:Z|[+-]\d{2}:\d{2})$/.test(v) && Number.isFinite(Date.parse(v))
  for (const s of sources) {
    if (!strings(s.authors,1,30) || !str(s.organization,2,300) || !str(s.version,1,100) ||
        !timestamp(s.checkedAt) || Date.parse(String(s.checkedAt)) > dateEnd || Date.parse(String(s.checkedAt)) < Date.parse(String(s.publishedAt)) ||
        (s.verification !== 'verified' && s.verification !== 'pending_review') ||
        ['researchQuestion','method','experimentalData','limitations'].some(k => !str(s[k],5,1500))) errors.push('source ' + s.id + ': v2 provenance')
    let pinned = false
    try { pinned = s.kind === 'arxiv' ? /^v[1-9]\d*$/.test(String(s.version)) && /^https:\/\/arxiv\.org\/abs\/(?:\d{4}\.\d{4,5}|[a-z-]+\/\d{7})v[1-9]\d*$/.test(String(s.url)) && String(s.url).endsWith(String(s.version))
      : decodeURIComponent(String(s.url).split('/').pop() ?? '') === s.version } catch { /* Invalid URL escapes are rejected, never thrown. */ }
    if (!pinned) errors.push('source ' + s.id + ': version must be pinned in URL')
  }
  function refs(value: unknown, ids: unknown, verified: boolean) {
    return Array.isArray(value) && value.length >= 1 && value.length <= 5 && value.every(r => obj(r) &&
      str(r.evidenceLocation,2,250) && Array.isArray(ids) && ids.includes(r.sourceId) &&
      sources.some(s => s.id === r.sourceId && (!verified || s.verification === 'verified')))
  }
  function evidence(value: Obj, ids: unknown, name: string) {
    const type = value.evidenceType
    if (!['paper_report','release_report','teaching_example','site_reproduction'].includes(String(type)) ||
        !refs(value.claimSourceRefs,ids,type !== 'teaching_example')) errors.push(name + ': evidence declaration / location')
    if ((type === 'paper_report' || type === 'release_report') && Array.isArray(value.claimSourceRefs) && value.claimSourceRefs.some(r => obj(r) &&
      sources.find(s => s.id === r.sourceId)?.kind !== (type === 'paper_report' ? 'arxiv' : 'github_release'))) errors.push(name + ': evidence kind mismatch')
    if (type === 'site_reproduction') {
      const r = value.reproduction
      if (!obj(r) || !str(r.commit,40,40) || !/^[a-f0-9]{40}$/.test(r.commit) || !str(r.artifactUrl,25,1200) ||
          !/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/blob\/[a-f0-9]{40}\/[\w./-]+$/.test(r.artifactUrl) ||
          !r.artifactUrl.includes('/blob/'+r.commit+'/') || !timestamp(r.runAt) || Date.parse(String(r.runAt)) > dateEnd ||
          !str(r.protocol,20,1500)) errors.push(name + ': reproduction artifact required')
    } else if (value.reproduction !== undefined) errors.push(name + ': contradictory reproduction declaration')
  }
  if (obj(e.evidence)) evidence(e.evidence,sources.map(s=>s.id),'edition')
  else errors.push('edition: missing evidence declaration')
  for(const update of Array.isArray(e.otherUpdates)?e.otherUpdates:[]) {
    if(obj(update))evidence(update,[update.sourceId],'other update')
  }
  for (const [i,b] of Array.from((Array.isArray(e.blocks) ? e.blocks : []).entries())) {
    if (!obj(b) || b.type === 'heading' || b.type === 'code') continue
    evidence(b,b.sourceIds,'block '+i)
    if (b.type !== 'chart') continue
    const origin = b.dataOrigin
    if (!['illustrative','paper','reproduced'].includes(String(origin)) ||
        b.evidenceType !== ({illustrative:'teaching_example',paper:'paper_report',reproduced:'site_reproduction'} as Obj)[String(origin)] ||
        b.illustrative !== undefined || !str(b.xAxis,2,100) || !str(b.yAxis,2,100)) errors.push('block '+i+': chart origin / axes')
    const experiment = b.experiment
    if (!obj(experiment) || !str(experiment.sampleSize,2,300) || !str(experiment.baseline,2,300) || !str(experiment.conditions,20,1500) ||
        !['higher','lower'].includes(String(experiment.metricDirection)) ||
        !(experiment.randomSeed === null || str(experiment.randomSeed,1,200))) errors.push('block '+i+': experimental conditions')
    const labels = new Set<string>()
    for (const p of (Array.isArray(b.points) ? b.points : [])) {
      if (!obj(p)) continue
      const interval = p.confidenceInterval
      if (labels.has(String(p.label)) || !refs(p.claimSourceRefs,b.sourceIds,origin !== 'illustrative') ||
          origin==='paper' && Array.isArray(p.claimSourceRefs) && p.claimSourceRefs.some(r=>obj(r)&&sources.find(s=>s.id===r.sourceId)?.kind!=='arxiv') ||
          !(interval === null || obj(interval) && typeof interval.low === 'number' && Number.isFinite(interval.low) &&
            typeof interval.high === 'number' && Number.isFinite(interval.high) && Number(interval.low) <= Number(p.value) && Number(interval.high) >= Number(p.value))) errors.push('block '+i+': point provenance / interval')
      labels.add(String(p.label))
    }
  }
  if (!Array.isArray(e.revisions) || e.revisions.length > 20) errors.push('invalid revision history')
  else e.revisions.forEach((r,i) => {
    if (!obj(r) || r.number !== i+1 || !timestamp(r.correctedAt) || Date.parse(String(r.correctedAt)) > dateEnd || !str(r.summary,10,1000) ||
        !str(r.previousFingerprint,64,64) || !/^[a-f0-9]{64}$/.test(r.previousFingerprint) ||
        i > 0 && Date.parse(String(r.correctedAt)) < Date.parse(String(e.revisions && (e.revisions as Obj[])[i-1]?.correctedAt))) errors.push('invalid revision '+i)
  })
}
