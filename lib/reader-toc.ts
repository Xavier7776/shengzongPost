export type ReaderHeading = { id: string; text: string; level: 2 | 3; parentId: string | null }
export type ReaderGroup = { id: string; title: string; items: ReaderHeading[] }

export function chapterLabel(text: string): string {
  return text.replace(/^[一二三四五六七八九十百\d]+[、.．]\s*/, '').trim()
}

export function groupReaderHeadings(items: ReaderHeading[], study: boolean): ReaderGroup[] {
  if (!study) return items.filter(item => item.level === 2).map(item => ({
    id: item.id, title: chapterLabel(item.text), items: items.filter(child => child.parentId === item.id),
  }))
  const definitions = [
    ['concepts', '问题与概念'], ['evidence', '研究证据'], ['engineering', '工程应用'],
    ['practice', '代码与实践'], ['review', '自测与来源'],
  ]
  const groups = definitions.map(([id, title]) => ({ id, title, items: [] as ReaderHeading[] }))
  let current = 'concepts'
  for (const item of items) {
    if (item.level === 2) {
      const label = chapterLabel(item.text)
      current = /自测|关键收获|职业方向|其他进展|原始出处|参考文献|更正说明/.test(label) ? 'review'
        : /Python|代码|实战|动手|分钟：/i.test(label) ? 'practice'
        : /应用|落地|流程图|yikesai|Mnemo|企业|工程/i.test(label) ? 'engineering'
        : /研究|实验|评测|协议|实测|数据|行为|局限|近期动态|证据|对比/.test(label) ? 'evidence' : 'concepts'
    }
    groups.find(group => group.id === current)!.items.push(item)
  }
  return groups.filter(group => group.items.length)
}
