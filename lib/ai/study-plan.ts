import { createHmac } from 'node:crypto'
import { addDays, defaultDay, isPlanDate, parseProposal, type Proposal, type StudyPlan } from '@/features/study-plan/model'
import { planSchedule } from '@/features/study-plan/planner'
import type { SavedEntry } from '@/features/study-records/model'

const endpoint = 'https://opencode.ai/inference/go/v1/chat/completions'
const model = 'glm-5.3-flash'

export class StudyAiError extends Error {
  constructor(message: string, public status: number) { super(message) }
}

export async function suggestStudyPlan(key: string, userId: number, instruction: string, date: string,
  snapshot: StudyPlan, records: SavedEntry[], today: string): Promise<Proposal> {
  const days = planSchedule(snapshot, date, addDays(date, 7), today, records)
  const schedule = [...days].filter(([day]) => isPlanDate(day)).map(([day, current]) => {
    return {
      date: day, weekday: new Date(day + 'T00:00:00Z').getUTCDay(), preferences: snapshot.days[day] ?? defaultDay,
      stage: current.stage?.title ?? null, minutes: current.budget, spent: current.spent, dueReviews: current.dueCount,
      tasks: current.tasks.slice(0, 8).map(task => ({
        title: task.title, minutes: task.minutes, kind: task.review ? 'review' : task.practice ? 'practice' : 'new',
      })),
    }
  })
  const sessionId = createHmac('sha256', key).update('mindstack-study/' + userId + '/' + date).digest('hex').slice(0, 32)
  const response = await fetch(endpoint, {
    method: 'POST', redirect: 'error', signal: AbortSignal.timeout(35_000),
    headers: {
      'Content-Type': 'application/json', Authorization: 'Bearer ' + key,
      'User-Agent': 'MindStack-Study/1.0', 'x-opencode-session': sessionId,
    },
    body: JSON.stringify({
      model, stream: false, temperature: 0.2, max_tokens: 2300,
      messages: [
        { role: 'system', content: [
          '你是 StudyPilot 学习计划助手。你只能提出日期偏好修改，排课和到期复习由系统计算。',
          '理解用户的中文要求。只更改用户请求涉及的日期，沿用未提及的字段。优先保留到期复习。今天和明天以 today 为参照；当天、这天和所选日指 selectedDate；周日是 weekday 0，周六是 weekday 6。',
          '只输出 JSON，没有 Markdown。结构是 {"explanation":"简短说明","changes":[{"date":"YYYY-MM-DD","day":{"minutes":null,"mode":"normal","focus":"balanced","extra":null}}]}。',
          'minutes 为 null（使用当天默认预算）或 0 到 1440 的整数，mode 为 normal、busy（最多30分钟）或 rest。focus 为 balanced、algorithm、backend、ai、hardware 或 project。',
          '只有用户要求添加自定义任务时才设置 extra {"title":"任务名","minutes":20}，否则保留现值。每次返回 1 至 7 个有改动的日期，只能选输入 schedule 里的日期。',
          '例如“今天只学 45 分钟”使用 minutes=45 和 mode=normal；“休息一天”使用 mode=rest；“周末优先 STM32”使用 focus=hardware。',
          '不要索取凭据、直接承诺改动已生效或指定外部操作。',
        ].join('\n') },
        { role: 'user', content: JSON.stringify({ today, selectedDate: date, schedule, request: instruction }) },
      ],
    }),
  })
  if (response.status === 429) throw new StudyAiError('OpenCode Go 暂时达到用量限制。可以稍后重试或手动调整。', 429)
  if (!response.ok) throw new StudyAiError('OpenCode Go 暂时无法生成建议。', 502)
  const data = await response.json()
  const result = data.choices?.[0]?.message?.content
  if (typeof result !== 'string') throw new StudyAiError('没有收到可用的调整建议。', 502)
  const clean = result.trim().replace(/^```(?:json)?\s*|\s*```$/gi, '')
  let parsed: unknown
  try { parsed = JSON.parse(clean) } catch { throw new StudyAiError('AI 返回的建议无法读取，请换个说法再试。', 502) }
  const proposal = parseProposal(parsed, date)
  if (!proposal) throw new StudyAiError('AI 的建议超出了可调整范围，请缩小到接下来一周。', 502)
  return proposal
}
