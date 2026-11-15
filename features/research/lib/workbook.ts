// Shared wire format; keep Univer's browser runtime out of server bundles.
import type { IWorkbookData } from '@univerjs/presets'

export interface SavedWorkbook {
  snapshot: IWorkbookData
  revision: number
  updated_at: string
}

export function isWorkbookSnapshot(value: unknown): value is IWorkbookData {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const data = value as Record<string, unknown>
  if (typeof data.id !== 'string' || !data.id || typeof data.name !== 'string') return false
  if (!data.sheets || typeof data.sheets !== 'object' || Array.isArray(data.sheets)) return false
  if (!Array.isArray(data.sheetOrder) || data.sheetOrder.length === 0 || data.sheetOrder.length > 100) return false
  const sheets = data.sheets as Record<string, unknown>
  return new Set(data.sheetOrder).size === data.sheetOrder.length && data.sheetOrder.every(id => {
    if (typeof id !== 'string' || !Object.hasOwn(sheets, id)) return false
    const sheet = sheets[id] as Record<string, unknown> | null
    return sheet !== null && typeof sheet === 'object' && !Array.isArray(sheet) && sheet.id === id &&
      Number.isInteger(sheet.rowCount) && Number(sheet.rowCount) > 0 && Number(sheet.rowCount) <= 1000000 &&
      Number.isInteger(sheet.columnCount) && Number(sheet.columnCount) > 0 && Number(sheet.columnCount) <= 16384
  })
}
