import { isObject, parseIdentifiedEntry, webBackupFormat, type EntryWithId, type Outcome, type Track } from './model'
import { studyPilotTitles } from './study-pilot-titles'

const androidOutcomes: Readonly<Partial<Record<string, Outcome>>> = {
  INDEPENDENT: 'independent', HINTED: 'hinted', AGAIN: 'again',
}

const stages: Readonly<Partial<Record<string, string>>> = {
  read: '理解', lab: '验证', recall: '复述',
}

export function parseAndroidRecord(row: unknown): EntryWithId | null {
  if (!isObject(row) || typeof row.id !== 'string' || typeof row.unitId !== 'string'
    || typeof row.outcome !== 'string' || !Object.hasOwn(androidOutcomes, row.outcome)) return null
  const [kind, number, stage] = row.unitId.split('-')
  const baseId = kind === 'java' && stage ? 'java-' + number : row.unitId
  const name = Object.hasOwn(studyPilotTitles, baseId) ? studyPilotTitles[baseId] : undefined
  const suffix = kind === 'java' && stage && Object.hasOwn(stages, stage) ? stages[stage] : undefined
  let track: Track = 'other'
  if (kind === 'lc') track = 'algorithm'
  if (kind === 'hw') track = 'hardware'
  if (kind === 'project') track = 'project'
  if (kind === 'java') track = number === '23' || number === '27' ? 'ai' : 'backend'
  if (kind === 'project' && (number === '8' || number === '9')) track = 'ai'
  return parseIdentifiedEntry({
    id: 'android:' + row.id,
    recordedAt: row.timestamp,
    title: name && suffix ? name + ' · ' + suffix : name ?? row.unitId,
    track,
    date: row.date,
    minutes: row.minutes,
    outcome: androidOutcomes[row.outcome],
    note: row.note,
    review: row.review,
  })
}

export function decodeBackup(text: string): EntryWithId[] {
  let data: unknown
  try { data = JSON.parse(text) } catch { throw new Error('无法读取 JSON 文件，请重新选择学习记录备份。') }
  if (!isObject(data) || (data.format !== 'studypilot-backup' && data.format !== webBackupFormat)) {
    throw new Error('请选择 StudyPilot 或网页版学习记录导出的备份。')
  }
  if (data.version !== 1) throw new Error('这个备份版本暂不支持。')
  if (!Array.isArray(data.records)) throw new Error('备份缺少学习记录。')
  const parse = data.format === 'studypilot-backup' ? parseAndroidRecord : parseIdentifiedEntry
  return data.records.map((value, index) => {
    const entry = parse(value)
    if (!entry) throw new Error('备份中的第 ' + (index + 1) + ' 条学习记录格式有误。')
    return entry
  })
}

export function encodeBackup(records: EntryWithId[]) {
  return JSON.stringify({
    format: webBackupFormat, version: 1, exportedAt: new Date().toISOString(),
    records: records.map(({ id, title, track, date, minutes, outcome, note, review, recordedAt }) =>
      ({ id, title, track, date, minutes, outcome, note, review, recordedAt })),
  }, null, 2)
}
