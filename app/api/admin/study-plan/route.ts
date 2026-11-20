import { getAdminAccountId } from '@/lib/auth'
import { loadStudyPlan, saveStudyPlan } from '@/lib/db/study-plans'
import { parseStudyPlan } from '@/features/study-plan/model'
import { withWriteGuard } from '@/lib/security/write-guard'
import { logFailure } from '@/lib/security/log'

const reply = (data: object, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'private, no-store' } })
const unauthorized = () => reply({ error: '请重新登录管理员账号。' }, 401)

export async function GET() {
  try {
    const userId = await getAdminAccountId()
    return userId ? reply({ plan: await loadStudyPlan(userId) }) : unauthorized()
  } catch (error) {
    logFailure('admin/study-plan/read', error)
    return reply({ error: '暂时无法读取计划。' }, 500)
  }
}

export const PUT = withWriteGuard(async request => {
  const userId = await getAdminAccountId()
  if (!userId) return unauthorized()
  const { snapshot, revision } = await request.json()
  const parsed = parseStudyPlan(snapshot)
  if (!parsed || !Number.isSafeInteger(revision) || revision < 0 || revision >= 2147483647) {
    return reply({ error: '计划设置格式有误。' }, 400)
  }
  const plan = await saveStudyPlan(userId, parsed, revision)
  return plan ? reply({ plan }) : reply({ error: '另一个页面已保存新版本。请重新读取已保存的计划后再调整。' }, 409)
}, { maxBytes: 512 * 1024 })
