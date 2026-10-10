import { parseFragment, serialize } from 'parse5'
import { headingId } from '@/shared/markdown/heading-id'
/** Only annotate already sanitized HTML; preserve old numeric TOC bookmarks as aliases. */
export function withHeadingIds(safeHtml: string) {
  const root = parseFragment(safeHtml), used = new Set<string>()
  let index = 0
  const text = (node: typeof root.childNodes[number]): string => 'value' in node ? node.value : 'childNodes' in node ? node.childNodes.map(text).join('') : ''
  function visit(parent: typeof root) {
    for (const node of parent.childNodes) if ('tagName' in node) {
      if (node.tagName === 'h2' || node.tagName === 'h3') {
        node.attrs = node.attrs.filter(attr => attr.name !== 'id')
        node.attrs.push({ name: 'id', value: headingId(text(node), used) })
        const aliases = parseFragment('<span id="blog-toc-heading-'+index+'"></span><span id="learn-section-'+index+++'"></span>').childNodes
        for (const alias of aliases) if ('parentNode' in alias) alias.parentNode = node
        node.childNodes.unshift(...aliases)
      } else if ('childNodes' in node) visit(node as unknown as typeof root)
    }
  }
  visit(root)
  return serialize(root)
}
