import { getAdminAccountId } from '@/lib/auth'
import { deleteStudyRecord, insertStudyRecords, listStudyRecords, updateStudyRecord } from '@/lib/db/study-records'
import { logFailure } from '@/lib/security/log'
import { withWriteGuard } from '@/lib/security/write-guard'
import { importBatchSize, isId, isObject, parseEntry, parseIdentifiedEntry } from '@/features/study-records/model'

export const dynamic = 'force-dynamic'

const headers = { 'Cache-Control': 'private, no-store' }
const reply = (data: object, status = 200) => Response.json(data, { status, headers })
const unauthorized = () => reply({ error: '请重新登录管理员账号。' }, 401)
const invalid = () => reply({ error: '学习记录格式无效。' }, 400)
const conflict = () => reply({ error: '这条记录已变更，请刷新页面后重试。' }, 409)

export async function GET() {
  try {
    const userId = await getAdminAccountId()
    return userId ? reply({ records: await listStudyRecords(userId) }) : unauthorized()
  } catch (error) {
    logFailure('admin/study-records/read', error)
    return reply({ error: '暂时无法读取学习记录，请重试。' }, 500)
  }
}

export const POST = withWriteGuard(async request => {
  const userId = await getAdminAccountId()
  if (!userId) return unauthorized()
  const body: unknown = await request.json()
  if (!isObject(body)) return invalid()

  if (body.type === 'import') {
    if (!Array.isArray(body.records) || body.records.length === 0 || body.records.length > importBatchSize) return invalid()
    const entries = body.records.map(parseIdentifiedEntry)
    if (!entries.every(entry => entry !== null)) return invalid()
    const inserted = await insertStudyRecords(userId, entries)
    return reply({ inserted: inserted.length })
  }

  if (body.type === 'create') {
    const entry = parseIdentifiedEntry(body.entry)
    if (!entry?.id.startsWith('web:')) return invalid()
    await insertStudyRecords(userId, [entry])
    return reply({ saved: true })
  }

  const { id, revision } = body
  if (!isId(id) || typeof revision !== 'number' || !Number.isSafeInteger(revision) || revision < 1 || revision >= 2147483647) return invalid()
  if (body.type === 'update') {
    const entry = parseEntry(body.entry)
    if (!entry) return invalid()
    const updated = await updateStudyRecord(userId, id, revision, entry)
    return updated ? reply({ saved: true }) : conflict()
  }
  if (body.type === 'delete') {
    return await deleteStudyRecord(userId, id, revision) ? reply({ saved: true }) : conflict()
  }
  return invalid()
}, { maxBytes: 4 * 1024 * 1024 })
