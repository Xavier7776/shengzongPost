import { afterEach, describe, expect, it, vi } from 'vitest'
import { analyzeNight, nightlyDate, parseNightlyAnalysis } from '@/lib/ai/study-nightly'

describe('StudyPilot nightly review', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('chooses the most recent 23:00 date in China across midnight', () => {
    expect(nightlyDate(new Date('2026-11-20T14:59:59Z'))).toBe('2026-11-19')
    expect(nightlyDate(new Date('2026-11-20T15:00:00Z'))).toBe('2026-11-20')
    expect(nightlyDate(new Date('2026-11-20T16:01:00Z'))).toBe('2026-11-20')
  })

  it('uses DeepSeek and sends only the learning record fields used for analysis', async () => {
    const analysis = { summary: '复习了链表。', blockers: ['仍需再练反转链表。'], nextSteps: ['明天复习反转链表。'] }
    const reply = vi.fn().mockResolvedValue(Response.json({ choices: [{ message: { content: JSON.stringify(analysis) } }] }))
    vi.stubGlobal('fetch', reply)
    const record = { title: '反转链表', track: 'algorithm', minutes: 30, review: true, outcome: 'again', note: '私有笔记' } as const
    await expect(analyzeNight('synthetic-key', 1, '2026-11-20', [record], 1, 30, 60)).resolves.toEqual(analysis)
    const [url, request] = reply.mock.calls[0]
    expect(url).toBe('https://opencode.ai/inference/go/openai/v1/chat/completions')
    expect(request.headers['x-opencode-session']).toMatch(/^[a-f0-9]{32}$/)
    expect(request.body).not.toContain(record.note)
    expect(JSON.parse(request.body).model).toBe('deepseek-v4.1-flash')
  })

  it('rejects incomplete or unbounded model output', () => {
    expect(parseNightlyAnalysis({ summary: '无', blockers: [], nextSteps: [] })).toBeNull()
    expect(parseNightlyAnalysis({ summary: '长'.repeat(301), blockers: [], nextSteps: ['建议'] })).toBeNull()
  })
})
