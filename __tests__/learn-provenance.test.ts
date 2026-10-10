import { describe, expect, it } from 'vitest'
import { validateEdition } from '@/lib/learn/document'
import { canonicalEdition, editionFingerprint, textVersion } from '@/lib/learn/publication-contract'
import { makeEdition } from './fixtures/learn-edition'
import { makeEditionV2 } from './fixtures/learn-edition-v2'

describe('versioned evidence contracts',()=>{
  it('retains the complete v1 content and permits explicit v2 paper charts',()=>{
    const v1=makeEdition(),copy=structuredClone(v1),v2=makeEditionV2()
    expect(validateEdition(v1).ok).toBe(true)
    expect(validateEdition(v2)).toMatchObject({ok:true,errors:[]})
    expect(canonicalEdition(v1)).toBe(canonicalEdition(copy))
    expect(textVersion(v1)).toBe(textVersion(copy))
    expect(editionFingerprint(v2)).not.toBe(editionFingerprint(v1))
  })
  it.each(['missing-location','unknown-source','unverified','unpinned','kind-mismatch','nonfinite','false-only','missing-conditions','duplicate-label','bad-interval','fake-reproduction'])(
    'rejects %s instead of promoting it to measured evidence',failure=>{
      const e=makeEditionV2(),chart=e.blocks.find(b=>b.type==='chart')!
      if(chart.type!=='chart')throw Error('fixture')
      const raw=chart as unknown as Record<string,unknown>
      if(failure==='missing-location')chart.claimSourceRefs[0].evidenceLocation=''
      if(failure==='unknown-source')chart.points[0].claimSourceRefs=[{sourceId:'s9',evidenceLocation:'Table 2'}]
      if(failure==='unverified')e.sources[0].verification='pending_review'
      if(failure==='unpinned')e.sources[0].url=e.sources[0].url.slice(0,-2)
      if(failure==='kind-mismatch')e.evidence.evidenceType='release_report'
      if(failure==='nonfinite')chart.points[0].value=Infinity
      if(failure==='false-only'){delete raw.dataOrigin;raw.illustrative=false}
      if(failure==='missing-conditions')chart.experiment.conditions=''
      if(failure==='duplicate-label')chart.points[1].label=chart.points[0].label
      if(failure==='bad-interval')chart.points[0].confidenceInterval={low:5,high:2}
      if(failure==='fake-reproduction'){chart.dataOrigin='reproduced';chart.evidenceType='site_reproduction'}
      expect(validateEdition(e).ok).toBe(false)
    })
  it('never throws on malformed release URL escapes',()=>{
    const e=makeEditionV2();e.sources[0].kind='github_release';e.sources[0].url='https://github.com/o/r/releases/tag/%ZZ'
    expect(()=>validateEdition(e)).not.toThrow();expect(validateEdition(e).ok).toBe(false)
  })
  it('requires traceable revisions and distinguishes examples from author reports',()=>{
    const e=makeEditionV2(),b=e.blocks.find(b=>b.type==='chart')!
    if(b.type!=='chart')throw Error('fixture')
    b.dataOrigin='illustrative';b.evidenceType='teaching_example'
    expect(validateEdition(e).ok).toBe(true)
    e.revisions=[{number:1,summary:'Corrected teaching-only point values',correctedAt:'2026-10-08T02:00:00Z',previousFingerprint:'a'.repeat(64)}]
    expect(validateEdition(e).ok).toBe(true)
    e.revisions[0].previousFingerprint='missing'
    expect(validateEdition(e).ok).toBe(false)
  })
})
