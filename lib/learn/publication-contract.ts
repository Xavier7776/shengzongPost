import { createHash } from 'node:crypto'
import type { Edition } from './document'

export const slugFor = (e: Edition) => 'daily-learn-' + e.date
export function canonicalEdition(e: Edition): string {
  return JSON.stringify(e, (_, value) => value && typeof value === 'object' && !Array.isArray(value)
    ? Object.fromEntries(Object.keys(value).sort().map(key => [key, value[key]])) : value)
}
export const editionFingerprint = (e: Edition) => createHash('sha256').update(canonicalEdition(e), 'utf8').digest('hex')
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
export class PublicationError extends Error {
  constructor(public category: 'conflict' | 'source_unverified' | 'readback_failed', public slug: string, public created = false, public reasons: string[] = []) {
    super('publication ' + category)
    this.name = 'PublicationError'
  }
}
