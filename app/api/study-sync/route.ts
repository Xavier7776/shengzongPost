import { insertStudyRecords } from '@/lib/db/study-records'
import { authorizeStudyDevice, claimStudyPairing, markStudyDeviceSynced, pairingPattern, revokeStudyDevice } from '@/lib/db/study-sync'
import { parseAndroidRecord } from '@/features/study-records/backup'
import { importBatchSize } from '@/features/study-records/model'
import { withWriteGuard } from '@/lib/security/write-guard'

const reply = (data: object, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'private, no-store' } })

export const POST = withWriteGuard(async request => {
  const body = await request.json()
  if (body.action === 'pair') {
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    if (typeof body.code !== 'string' || !pairingPattern.test(body.code) || !name || name.length > 80 || name.includes('\0')) {
      return reply({ error: '配对信息不正确。' }, 400)
    }
    const token = await claimStudyPairing(body.code, name)
    return token ? reply({ token }) : reply({ error: '配对码已过期或已使用。' }, 401)
  }

  const device = await authorizeStudyDevice(request.headers.get('authorization'))
  if (!device) return reply({ error: '请重新配对手机。' }, 401)
  if (body.action === 'disconnect') {
    await revokeStudyDevice(device.userId, device.credential)
    return reply({ disconnected: true })
  }
  if (body.action !== 'records' || !Array.isArray(body.records) || body.records.length > importBatchSize) {
    return reply({ error: '学习记录格式无效。' }, 400)
  }
  const entries = (body.records as unknown[]).map(parseAndroidRecord)
  if (!entries.every(entry => entry !== null)) return reply({ error: '学习记录格式无效。' }, 400)
  const inserted = entries.length ? await insertStudyRecords(device.userId, entries) : []
  await markStudyDeviceSynced(device.userId, device.credential)
  return reply({ received: entries.length, inserted: inserted.length })
}, { maxBytes: 4 * 1024 * 1024 })
