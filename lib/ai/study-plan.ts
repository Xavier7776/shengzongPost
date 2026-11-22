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
      stage: current.stage?.title ?? null, minutes: current.budget, sundayRest: current.sundayRest,
      spent: current.spent, dueReviews: current.dueCount,
      timeLeftBeforeTasks: Math.max(0, current.budget - current.spent),
      completedJavaMinutes: current.completed.filter(entry => entry.track === 'backend').reduce((total, entry) => total + entry.minutes, 0),
      tasks: current.tasks.slice(0, 8).map(task => ({
        title: task.title, track: task.track, minutes: task.minutes, kind: task.review ? 'review' : task.practice ? 'practice' : 'new',
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
          '你是 StudyPilot 学习计划助手。你可以解释现有安排，或按用户明确要求提出日期偏好修改。排课和到期复习由系统计算。',
          '理解用户的中文要求。只更改用户请求涉及的日期，沿用未提及的字段。优先保留到期复习。今天和明天以 today 为参照；当天、这天和所选日指 selectedDate；周日是 weekday 0，周六是 weekday 6。',
          '只输出 JSON，没有 Markdown。结构是 {"explanation":"简短说明","changes":[{"date":"YYYY-MM-DD","day":{"minutes":null,"mode":"normal","focus":"balanced","extra":null}}]}。',
          '只问原因、规则或任务时必须返回 changes:[]。优先回答用户问的日期和方向，通常用两三句。若该方向实际有任务，给出名称和分钟数。只有用户要求看一周才逐日列举，不推测以往的计划。track=backend 表示 Java 后端（含八股）。',
          '调整预览的 explanation 不超过 400 字，排课说明不超过 1200 字。',
          '规则：已记录时间从预算中扣除。到期复习优先，再安排自定义任务和明确指定的优先方向。标准周末尽量凑足 30 分钟 Java（含已记录或已安排的 Java），余额至少 10 分钟时可安排短练习，然后安排硬件、算法和项目。休息日不排任务。',
          'sundayRest 为 true 的日期是固定周日休息，不可以写入 changes。若用户要求修改这些日期，说明可在「路线与时间设置」关闭每周日休息。',
          'minutes 为 null（使用当天默认预算）或 0 到 1440 的整数，mode 为 normal、busy（最多30分钟）或 rest。focus 为 balanced、algorithm、backend、ai、hardware 或 project。',
          '只有用户要求添加自定义任务时才设置 extra {"title":"任务名","minutes":20}，否则保留现值。明确要求调整时返回 1 至 7 个有改动的日期，只能选输入 schedule 里的日期。',
          '例如“今天只学 45 分钟”使用 minutes=45 和 mode=normal；“休息一天”使用 mode=rest；“周末优先 STM32”使用 focus=hardware。',
          '不要索取凭据、直接承诺改动已生效或指定外部操作。',
        ].join('\n') },
        { role: 'user', content: JSON.stringify({ today, selectedDate: date, schedule, request: instruction }) },
      ],
    }),
  })
  if (response.status === 429) throw new StudyAiError('OpenCode Go 暂时达到用量限制。可以稍后重试或手动调整。', 429)
  if (!response.ok) throw new StudyAiError('OpenCode Go 暂时无法回复。', 502)
  const data = await response.json()
  const result = data.choices?.[0]?.message?.content
  if (typeof result !== 'string') throw new StudyAiError('没有收到可用的回复。', 502)
  const clean = result.trim().replace(/^```(?:json)?\s*|\s*```$/gi, '')
  let parsed: unknown
  try { parsed = JSON.parse(clean) } catch { throw new StudyAiError('AI 返回的回复无法读取，请重试。', 502) }
  const proposal = parseProposal(parsed, date)
  if (!proposal) throw new StudyAiError('AI 返回的回复格式有误，请重试。调整请求可指定未来一周的日期。', 502)
  if (proposal.changes.some(change => days.get(change.date)?.sundayRest)) {
    throw new StudyAiError('周日已设为固定休息日，请选择其他日期。', 422)
  }
  return proposal
}
