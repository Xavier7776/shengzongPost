import type { SavedEntry } from './model'

const endpoint = '/api/admin/study-records'

async function readResponse(response: Response) {
  if (!response.headers.get('content-type')?.includes('application/json')) {
    throw new Error(response.status === 413 ? '上传内容过大。' : '服务器暂时未响应，请重试。')
  }
  const data = await response.json()
  if (!response.ok) throw new Error(data.error ?? '请求失败，请重试。')
  return data
}

export async function writeStudyRecord(payload: object) {
  return readResponse(await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }))
}

export async function fetchStudyRecords(signal?: AbortSignal): Promise<SavedEntry[]> {
  const { records } = await readResponse(await fetch(endpoint, { cache: 'no-store', signal }))
  return records
}
