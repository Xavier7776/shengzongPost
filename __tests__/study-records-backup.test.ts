import { describe, expect, it } from 'vitest'
import { decodeBackup, encodeBackup } from '@/features/study-records/backup'

const androidRecord = {
  id: '81dd550d-c5d0-4fbd-9573-fe1ca4c1b16b', taskId: 'task-1', unitId: 'java-23-recall',
  date: '2026-11-19', timestamp: 1795065600000, outcome: 'HINTED', minutes: 43,
  note: '核对检索结果\n再补写评估用例。', review: true,
}

function mobileBackup(records: object[], version = 1) {
  return JSON.stringify({ format: 'studypilot-backup', version, records, progress: [], settings: {}, tasks: [] })
}

describe('private learning record backups', () => {
  it('preserves the Android identity, session title, study details and line breaks', () => {
    const [record] = decodeBackup(mobileBackup([androidRecord]))
    expect(record).toEqual({
      id: 'android:' + androidRecord.id, recordedAt: androidRecord.timestamp, title: 'AI 调用链与效果评估 · 复述',
      track: 'ai', date: androidRecord.date, outcome: 'hinted', minutes: 43,
      note: androidRecord.note, review: true,
    })
    expect(decodeBackup(encodeBackup([record]))).toEqual([record])
  })

  it('keeps a newer mobile unit ID readable and rejects an impossible study date', () => {
    expect(decodeBackup(mobileBackup([{ ...androidRecord, unitId: 'hw-250' }]))[0]).toMatchObject({
      title: 'hw-250', track: 'hardware',
    })
    expect(() => decodeBackup(mobileBackup([androidRecord, { ...androidRecord, date: '2026-02-29' }])))
      .toThrow('第 2 条')
  })

  it('rejects unknown formats, unsupported versions and invalid outcomes', () => {
    expect(() => decodeBackup('{"records":[]}')).toThrow('请选择')
    expect(() => decodeBackup(mobileBackup([], 2))).toThrow('版本')
    expect(() => decodeBackup(mobileBackup([{ ...androidRecord, outcome: 'constructor' }]))).toThrow('第 1 条')
  })
})
