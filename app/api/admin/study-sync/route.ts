import { getAdminAccountId } from '@/lib/auth'
import { createStudyPairing, revokeStudyDevice, studyDevice } from '@/lib/db/study-sync'
import { withWriteGuard } from '@/lib/security/write-guard'
import { logFailure } from '@/lib/security/log'

export const dynamic = 'force-dynamic'
const reply = (data: object, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'private, no-store' } })
const unauthorized = () => reply({ error: '请使用管理员账号登录。' }, 401)

export async function GET() {
  try {
    const userId = await getAdminAccountId()
    return userId ? reply({ device: await studyDevice(userId) }) : unauthorized()
  } catch (error) {
    logFailure('admin/study-sync/status', error)
    return reply({ error: '暂时无法读取设备状态。' }, 500)
  }
}

export const POST = withWriteGuard(async request => {
  const userId = await getAdminAccountId()
  if (!userId) return unauthorized()
  const { action } = await request.json()
  if (action === 'pair') return reply({ code: await createStudyPairing(userId), expiresInMinutes: 10 })
  if (action !== 'revoke') return reply({ error: '无效操作。' }, 400)
  await revokeStudyDevice(userId)
  return reply({ disconnected: true })
}, { maxBytes: 1024 })
