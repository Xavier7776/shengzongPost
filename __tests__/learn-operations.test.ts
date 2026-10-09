import { describe, expect, it } from 'vitest'
import { makeEdition } from './fixtures/learn-edition'
import { textVersion } from '@/lib/learn/publication-contract'
import { auditPublication, publicationCalendar, publicationSummary } from '@/lib/learn/operations'

const document = makeEdition('2026-10-09')
const row = {slug:'daily-learn-2026-10-09',title:document.title,published:true,content:textVersion(document),edition_date:document.date,topic:document.topic,document,status:'published',post_id:1,id:1,created_at:'2026-10-09T01:46:03Z'}
describe('publication observation without invented task history', () => {
  it('keeps historical expectation unknown until the confirmed start date', () => {
    const days=publicationCalendar([],new Date('2026-10-09T02:00:00Z'))
    expect(days).toHaveLength(30)
    expect(days[0]).toMatchObject({date:'2026-10-09',code:'missing',taskStatus:'unknown'})
    expect(days[1]).toMatchObject({date:'2026-10-08',code:'unknown',taskStatus:'unknown'})
  })
  it.each([['00:29:59','not_due'],['00:30:00','waiting'],['01:29:59','waiting'],['01:30:00','missing']])('uses the Shanghai schedule and grace period at %s', (time,code) => {
    expect(publicationCalendar([],new Date('2026-10-09T'+time+'Z'))[0].code).toBe(code)
  })
  it('handles midnight and month boundaries without UTC date drift', () => {
    const days=publicationCalendar([],new Date('2026-10-31T16:00:00Z'))
    expect(days[0]).toMatchObject({date:'2026-11-01',code:'not_due'})
    expect(days[1]).toMatchObject({date:'2026-10-31',code:'missing'})
  })
  it('keeps database compliance and task/public evidence separate', () => {
    const checked={...row,audit:auditPublication(row)}
    const day=publicationCalendar([checked],new Date('2026-10-09T02:00:00Z'))[0]
    expect(day).toMatchObject({code:'ok',taskStatus:'unknown',publicStatus:'unknown'})
    expect(publicationCalendar([checked],new Date('2026-10-09T02:00:00Z'),{slug:row.slug,status:'public_pending'})[0].code).toBe('public_pending')
  })
  it('rejects relation, date and topic drift and preserves body drift classification', () => {
    expect(auditPublication({...row,post_id:null}).code).toBe('invalid')
    expect(auditPublication({...row,edition_date:'2026-10-08'}).code).toBe('invalid')
    expect(auditPublication({...row,topic:'rag'}).code).toBe('invalid')
    expect(auditPublication({...row,content:'changed'}).code).toBe('drift')
    expect(auditPublication({...row,published:false}).code).toBe('draft')
  })
  it('counts actual consecutive compliant dates, not a gap or a draft', () => {
    const checked={...row,audit:auditPublication(row)}
    const previous={...checked,edition_date:'2026-10-08'}
    expect(publicationSummary([checked,previous])).toMatchObject({latestDate:'2026-10-09',consecutiveDays:2})
    expect(publicationSummary([checked,{...previous,edition_date:'2026-10-07'}]).consecutiveDays).toBe(1)
    expect(publicationSummary([{...checked,audit:{code:'draft',text:'未公开',detail:''}}]).latestDate).toBeNull()
  })
  it('treats multiple records for one date as invalid rather than successful', () => {
    const checked={...row,audit:auditPublication(row)}
    expect(publicationCalendar([checked,checked],new Date('2026-10-09T02:00:00Z'))[0].code).toBe('invalid')
  })
})
