import { createHash } from 'node:crypto'
import type { Edition, Evidence } from './document'

export const slugFor = (e: Edition) => 'daily-learn-' + e.date
export function canonicalEdition(e: Edition): string {
  return JSON.stringify(e, (_, value) => value && typeof value === 'object' && !Array.isArray(value)
    ? Object.fromEntries(Object.keys(value).sort().map(key => [key, value[key]])) : value)
}
export const editionFingerprint = (e: Edition) => createHash('sha256').update(canonicalEdition(e), 'utf8').digest('hex')
export function textVersion(e: Edition) {
  const body = [e.lead, ...e.blocks.map(b => {
    if ('text' in b) return b.text
    if (b.type === 'diagram') return b.steps.map(s => s.title + ': ' + s.description).join(' ')
    if (b.type === 'quiz') return b.question + ': ' + b.explanation
    if (b.type === 'code') return b.caption + '\n' + b.code
    return b.title + ': ' + b.caption
  }), e.practice.title, ...e.practice.steps, ...e.takeaways, e.careerTip,
  ...e.sources.map(s => s.title + ' — ' + s.url)].join('\n\n')
  if(e.version===1)return body
  const declaration = (value: Evidence) =>
    value.evidenceType + ' — ' + value.claimSourceRefs.map(r=>r.sourceId+': '+r.evidenceLocation).join('; ') +
    (value.reproduction ? '\n'+[value.reproduction.artifactUrl,value.reproduction.commit,value.reproduction.runAt,value.reproduction.protocol].join(' — ') : '')
  return [body,declaration(e.evidence),...e.blocks.flatMap(b=>{
    if(b.type==='heading'||b.type==='code'||!('evidenceType' in b))return []
    const text=[declaration(b)]
    if(b.type==='chart')text.push(b.dataOrigin+'; '+b.xAxis+' / '+b.yAxis+'; '+b.unit,
      [b.experiment.sampleSize,b.experiment.metricDirection,b.experiment.baseline,b.experiment.conditions,b.experiment.randomSeed??'未报告'].join(' — '),
      ...b.points.map(p=>p.label+': '+p.value+' '+b.unit+'; '+(p.confidenceInterval?`${p.confidenceInterval.low}–${p.confidenceInterval.high}`:'置信区间未报告')+'; '+p.claimSourceRefs.map(r=>r.sourceId+': '+r.evidenceLocation).join('; ')))
    return text
  }),...e.otherUpdates.map(o=>o.summary+'\n'+declaration(o)),...e.sources.map(s=>[s.authors.join(', '),s.organization,s.version,s.verification,s.checkedAt,s.researchQuestion,s.method,s.experimentalData,s.limitations].join(' — ')),
    ...e.revisions.map(r=>'更正 '+r.number+' / '+r.correctedAt+' / '+r.summary+' / '+r.previousFingerprint)].join('\n\n')
}
export class PublicationError extends Error {
  constructor(public category: 'conflict' | 'source_unverified' | 'readback_failed', public slug: string, public created = false, public reasons: string[] = [], public committed: boolean | null = created) {
    super('publication ' + category)
    this.name = 'PublicationError'
  }
}
