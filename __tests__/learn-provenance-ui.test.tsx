import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import LearnInteractive from '@/components/learn/LearnInteractive'
import { makeEdition } from './fixtures/learn-edition'
import { makeEditionV2 } from './fixtures/learn-edition-v2'
afterEach(cleanup)
describe('evidence shown to readers',()=>{
  it('preserves v1 narrative, examples, quizzes, code, sources and practice',()=>{
    const e=makeEdition(),{container}=render(<LearnInteractive edition={e}/>)
    expect(container.textContent).toContain(e.lead)
    expect(screen.getByText('教学示例数据，非论文实验结果')).toBeVisible()
    expect(container.querySelector('pre')?.textContent).toContain('example data')
    expect(container.querySelectorAll('button')).toHaveLength(4)
    fireEvent.click(screen.getAllByRole('button')[0]);expect(screen.getByRole('status')).toHaveTextContent('回答正确')
    for(const s of e.sources)expect(container.querySelector(`a[href="${s.url}"]`)).not.toBeNull()
    expect(container.textContent).toContain(e.practice.acceptance)
  })
  it('never infers schema v2 from extra fields on a v1 document',()=>{
    const e=makeEdition(),chart=e.blocks.find(b=>b.type==='chart')!
    Object.assign(chart,{dataOrigin:'paper'})
    Object.assign(e.sources[0],{verification:'verified'})
    render(<LearnInteractive edition={e}/>)
    expect(screen.getByText('教学示例数据，非论文实验结果')).toBeVisible()
    expect(screen.queryByText('论文作者报告数据，本站未声称复现')).toBeNull()
  })
  it('distinguishes author-reported and example charts and exposes raw provenance',()=>{
    const e=makeEditionV2(),chart=e.blocks.find(b=>b.type==='chart')!
    if(chart.type!=='chart')throw Error('fixture')
    e.blocks.push({...structuredClone(chart),title:'第二张教学示意图',dataOrigin:'illustrative',evidenceType:'teaching_example'})
    e.revisions=[{number:1,correctedAt:'2026-10-08T03:00:00Z',summary:'Corrected provenance labels without claiming reproduction',previousFingerprint:'a'.repeat(64)}]
    const {container}=render(<LearnInteractive edition={e}/>)
    expect(screen.getByText('论文作者报告数据，本站未声称复现')).toBeVisible()
    expect(screen.getByText('教学示例数据，非论文实验结果')).toBeVisible()
    expect(container.textContent).toContain('Table 2; synthetic condition')
    expect(container.textContent).toContain('Synthetic lab')
    expect(container.textContent).toContain('随机种子：未报告')
    expect(container.textContent).toContain('上一版本指纹：'+'a'.repeat(64))
    fireEvent.click(screen.getByText('查看原始数据表与条件'))
    expect(screen.getAllByRole('columnheader').map(el=>el.textContent)).toContain('置信区间')
  })
})
