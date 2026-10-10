import type { EditionV1 } from '@/lib/learn/document'

export function makeEdition(date = '2026-10-08'): EditionV1 {
  const paragraph = '这是一段用于验证结构的中文技术说明，讨论证据、方法、局限和工程取舍。'.repeat(10)
  return {
    version: 1, date, topic: 'agent', title: '面向智能体系统的工程实践与方法解析',
    excerpt: paragraph.slice(0, 100), lead: paragraph.slice(0, 150), primarySourceId: 's1',
    sources: [1, 2].map(id => ({
      id: `s${id}`, topic: 'agent', kind: 'arxiv', title: `Primary research paper ${id}`,
      url: `https://arxiv.org/abs/2610.0000${id}`, publishedAt: date + 'T00:00:00Z', excerpt: paragraph,
    })),
    blocks: [
      ...Array.from({ length: 5 }, (_, i) => ({ type: 'heading' as const, level: 2 as const, text: `工程研究章节 ${i}` })),
      ...Array.from({ length: 8 }, () => ({ type: 'paragraph' as const, text: paragraph, sourceIds: ['s1'] })),
      { type: 'callout', tone: 'warning', title: '研究与工程局限', text: paragraph.slice(0, 80), sourceIds: ['s1'] },
      { type: 'diagram', title: '工程实践步骤示意', caption: '下面是用于教学的工程实践步骤示意。', sourceIds: ['s1'],
        steps: [1, 2, 3].map(i => ({ title: `步骤 ${i}`, description: paragraph.slice(0, 40) })) },
      { type: 'chart', title: '虚构教学数据图表', caption: '以下数值仅用于演示，不能代表任何实验结论。', unit: '次', illustrative: true,
        points: [{ label: '甲', value: 1 }, { label: '乙', value: 2 }], sourceIds: ['s1'] },
      { type: 'code', language: 'text', code: 'example data\n'.repeat(6), caption: '示例代码仅用于教学演示，未在本测试中执行。', illustrative: true },
      ...[1, 2].map(i => ({ type: 'quiz' as const, question: `练习 ${i}：如何根据来源和工程约束判断研究结论的适用范围？`,
        options: ['结合来源和边界判断', '忽略来源直接推广'], answerIndex: 0, explanation: paragraph.slice(0, 80), sourceIds: ['s1'] })),
    ],
    practice: { title: '完成证据与工程边界核对', minutes: 30, steps: ['核对原始资料', '记录工程适用边界'], acceptance: paragraph.slice(0, 60) },
    takeaways: ['保留来源', '记录局限', '验证实现'], careerTip: paragraph.slice(0, 80),
    otherUpdates: [{ sourceId: 's2', summary: paragraph.slice(0, 80) }],
  }
}
