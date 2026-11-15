import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getResearchWorkbook, saveResearchWorkbook } from '@/lib/db/research-workbooks'
import { isWorkbookSnapshot } from '@/features/research/lib/workbook'
import { logFailure } from '@/lib/security/log'
import { withWriteGuard } from '@/lib/security/write-guard'

export const dynamic = 'force-dynamic'
const headers = { 'Cache-Control': 'private, no-store' }
const reply = (data: object, status = 200) => NextResponse.json(data, { status, headers })

async function accountId() {
  const session = await getServerSession(authOptions)
  const id = Number((session?.user as { id?: string } | undefined)?.id)
  return Number.isSafeInteger(id) && id > 0 ? id : null
}

export async function GET() {
  try {
    const userId = await accountId()
    if (!userId) return reply({ error: '请先登录后使用研究表格' }, 401)
    return reply({ workbook: await getResearchWorkbook(userId) })
  } catch (error) {
    logFailure('research/workbook/load', error)
    return reply({ error: '读取表格失败，请重试' }, 500)
  }
}

export const PUT = withWriteGuard(async (request: NextRequest) => {
  const userId = await accountId()
  if (!userId) return reply({ error: '登录已失效，请重新登录后保存' }, 401)
  const { snapshot, revision } = await request.json()
  if (!isWorkbookSnapshot(snapshot) || !Number.isSafeInteger(revision) || revision < 0 || revision >= 2147483647) {
    return reply({ error: '表格数据或版本无效' }, 400)
  }
  try {
    const workbook = await saveResearchWorkbook(userId, snapshot, revision)
    if (!workbook) return reply({ error: '其他标签页已保存新版本。请先下载当前副本，再刷新页面恢复云端版本。' }, 409)
    return reply({ workbook })
  } catch (error) {
    logFailure('research/workbook/save', error)
    return reply({ error: '保存失败，编辑内容仍保留在当前页面，请重试' }, 500)
  }
}, { maxBytes: 4 * 1024 * 1024 })
