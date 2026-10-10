const punctuation = new RegExp('[^\\p{L}\\p{N}_-]+', 'gu')
export function headingId(text: string, used: Set<string>) {
  let base = text.normalize('NFKC').trim().toLowerCase().replace(punctuation, '-').replace(/^-|-$/g, '') || 'section'
  if (/^(?:blog-toc-heading|learn-section)-\d+$/.test(base)) base = 'section-'+base
  let id = base, suffix = 2
  while (used.has(id)) id = base+'-'+suffix++
  used.add(id)
  return id
}
