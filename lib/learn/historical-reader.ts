import type { Edition } from './document'
import { editionFingerprint } from './publication-contract'

/** Read-only exception for one captured, published v1 document. Never use at publication gates.
 * The full canonical hash pins every field (including sources, options and chart data).
 * The exact error list keeps all other current structural/provenance/safety checks active.
 */
export function isHistoricalReaderEdition(document: unknown, errors: string[]): boolean {
  if (errors.length !== 2 || errors[0] !== 'block 32: quiz' || errors[1] !== 'block 34: quiz') return false
  const edition = document as Edition | null
  return edition?.version === 1 && edition.date === '2026-10-10' &&
    editionFingerprint(edition) === '7c56c69cdcb610768bca28e873f4e3b2478c66854151c02af71d8d5469a9b4d2'
}
