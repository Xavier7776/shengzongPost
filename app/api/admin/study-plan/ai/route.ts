import { getAdminAccountId } from '@/lib/auth'
import { listStudyRecords } from '@/lib/db/study-records'
import { allowAuthAttempt } from '@/lib/auth-rate-limit'
import { isPlanDate, parseStudyPlan } from '@/features/study-plan/model'
import { suggestStudyPlan, StudyAiError } from '@/lib/ai/study-plan'
import { logFailure } from '@/lib/security/log'
import { chinaDate } from '@/lib/learn/document'
import { withWriteGuard } from '@/lib/security/write-guard'

export const maxDuration = 45
const reply = (data: object, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'private, no-store' } })

export const POST = withWriteGuard(async request => {
  const userId = await getAdminAccountId()
  if (!userId) return reply({ error: '请重新登录管理员账号。' }, 401)
  const key = process.env.OPENCODE_GO_API_KEY?.trim()
  if (!key) return reply({ error: 'OpenCode Go 尚未连接。你仍可手动调整。' }, 503)

  const { instruction, date, snapshot } = await request.json()
  const plan = parseStudyPlan(snapshot)
  if (typeof instruction !== 'string' || !instruction.trim() || instruction.length > 800 || !isPlanDate(date) || !plan) {
    return reply({ error: '请填写简短的调整要求并选择日期。' }, 400)
  }
  if (!await allowAuthAttempt(request, 'study-plan-ai', String(userId))) {
    return reply({ error: '请求太频繁，请稍后再试。' }, 429)
  }

  try {
    const records = await listStudyRecords(userId)
    return reply({ proposal: await suggestStudyPlan(key, userId, instruction.trim(), date, plan, records, chinaDate()) })
  } catch (error) {
    if (error instanceof StudyAiError) return reply({ error: error.message }, error.status)
    logFailure('admin/study-plan/ai', error)
    return reply({ error: '暂时无法连接 OpenCode Go，请稍后再试。' }, 502)
  }
}, { maxBytes: 512 * 1024 })
