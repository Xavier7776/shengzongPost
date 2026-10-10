import type { EditionV2, Evidence } from '@/lib/learn/document'
import { makeEdition } from './learn-edition'

/** Synthetic provenance contract fixture; not a scientific fact-check. */
export function makeEditionV2(): EditionV2 {
  const e = makeEdition()
  const evidence: Evidence = { evidenceType:'paper_report', claimSourceRefs:[{sourceId:'s1',evidenceLocation:'Table 2; synthetic condition'}] }
  return { ...e, version:2, evidence, revisions:[],
    otherUpdates:e.otherUpdates.map(o=>({...o,evidenceType:'paper_report',claimSourceRefs:[{sourceId:o.sourceId,evidenceLocation:'Abstract; synthetic metadata'}]})),
    sources:e.sources.map(s=>({...s,url:s.url+'v1',authors:['Synthetic author'],organization:'Synthetic lab',version:'v1',
      checkedAt:'2026-10-08T01:00:00Z',verification:'verified',researchQuestion:'Synthetic retrieval question',
      method:'Synthetic controlled comparison',experimentalData:'Synthetic fixture only',limitations:'No scientific evidence in this fixture'})),
    blocks:e.blocks.map(b=>{
      if(b.type==='heading'||b.type==='code')return b
      if(b.type!=='chart')return {...b,...evidence}
      const {illustrative:_,...chart}=b
      return {...chart,...evidence,dataOrigin:'paper',xAxis:'Synthetic configuration',yAxis:'Synthetic score',
        points:b.points.map(p=>({...p,claimSourceRefs:evidence.claimSourceRefs,confidenceInterval:null})),
        experiment:{sampleSize:'2 synthetic points',metricDirection:'higher',baseline:'甲配置',conditions:'Synthetic fixture; no actual experimental measurement',randomSeed:null}}
    }),
  }
}
