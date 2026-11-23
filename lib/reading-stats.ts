export function isLearnSlug(slug: string) {
  return /^daily-learn-\d{4}-\d{2}-\d{2}$/.test(slug)
}

export function readingStats(content: string, slug: string) {
  // 去除 HTML 标签和实体
  const text = content
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]+`/g, ' ')
  // 中文字符数
  const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length
  // 英文词数（去除中文后按空格分词）
  const englishText = text.replace(/[\u4e00-\u9fa5]/g, ' ')
  const englishWords = englishText
    .split(/\s+/)
    .filter(w => /[a-zA-Z]/.test(w)).length
  // 总字数 = 中文字符 + 英文单词
  const totalWords = chineseChars + englishWords
  // 阅读时间（分钟）= 中文/400 + 英文/200，至少 1 分钟
  const minutes = Math.max(1, Math.ceil((chineseChars / 400) + (englishWords / 200)))
  const lead = isLearnSlug(slug) ? content.slice(0, 380) : ''
  const reading = lead.match(/(?:阅读时间约|阅读约|预计阅读)\s*(\d{1,3})\s*分钟/)
  const practice = lead.match(/(?:动手实验|动手实践|动手练习)\s*约?\s*(\d{1,3})\s*分钟/)
  return { totalWords, minutes: Number(reading?.[1]) || minutes, practiceMinutes: Number(practice?.[1]) || null }
}
