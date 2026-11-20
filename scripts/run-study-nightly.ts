import { readFile } from 'node:fs/promises'
import { analyzeNight, nightlyDate } from '@/lib/ai/study-nightly'
import { getNightlyOwner, hasNightlyReview, loadNightlyRecords, saveNightlyReview } from '@/lib/db/study-nightly'
import { loadStudyPlan } from '@/lib/db/study-plans'
import { planDay } from '@/features/study-plan/planner'

async function run() {
  const date = nightlyDate()
  const userId = await getNightlyOwner()
  if (await hasNightlyReview(userId, date)) {
    console.log(JSON.stringify({ date, status: 'already_generated' }))
    return
  }
  const { records, recordCount, minutes } = await loadNightlyRecords(userId, date)
  let analysis = null
  if (records.length > 0) {
    const keyPath = process.argv[2]
    const key = process.env.OPENCODE_GO_API_KEY?.trim() || (keyPath && (await readFile(keyPath, 'utf8')).trim())
    if (!key) throw new Error('找不到 OpenCode Go 密钥。')
    const plan = await loadStudyPlan(userId)
    const budget = plan ? planDay(plan.snapshot, date, []).budget : null
    analysis = await analyzeNight(key, userId, date, records, recordCount, minutes, budget)
  }
  const inserted = await saveNightlyReview(userId, { date, recordCount, minutes, analysis })
  if (!inserted && !await hasNightlyReview(userId, date)) throw new Error('无法将复盘保存到管理员账号。')
  console.log(JSON.stringify({ date, status: inserted ? (analysis ? 'generated' : 'no_records') : 'already_generated' }))
}

void run().catch(error => {
  const message = error instanceof Error && !('sourceError' in error) ? error.message : ''
  // Provider/validation messages are constructed locally; database and filesystem diagnostics can contain private data.
  console.error(/^(OpenCode Go 请求失败（HTTP \d{3}）。|晚间复盘需要唯一的管理员账号。|找不到 OpenCode Go 密钥。|没有收到可用的 DeepSeek 复盘。|DeepSeek 返回的复盘(无法读取|格式无效)。|无法将复盘保存到管理员账号。)$/.test(message)
    ? message : '晚间复盘运行失败，请检查本机数据库连接与 OpenCode Go 配置。')
  process.exitCode = 1
})
