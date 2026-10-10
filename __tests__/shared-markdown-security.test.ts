import { describe, expect, it } from 'vitest'
import { renderMarkdown, renderInlineMarkdown } from '@/shared/markdown/render'
import { safeLink, safePostImageUrl } from '@/shared/markdown/sanitize'

describe('all public Markdown outputs', () => {
  it('renders real GFM while removing active HTML, malicious links and unsafe images', () => {
    const html = renderMarkdown('## Heading\n\n**Bold**\n\n| A | B |\n|---|---|\n|1|2|\n\n```js\nalert(1)\n```\n\n<script>bad()</script><img src="x" onerror="bad()"><a href="javascript:bad()">click</a>')
    expect(html).toContain('<h2>Heading</h2>'); expect(html).toContain('<table>'); expect(html).toContain('<strong>Bold</strong>'); expect(html).toContain('language-js')
    expect(html).not.toMatch(/<script|onerror=|javascript:|<img/)
    expect(renderInlineMarkdown('[source](https://example.com) <svg onload="bad()"></svg>')).toContain('rel="noopener noreferrer nofollow"')
    expect(renderInlineMarkdown('<script>bad()</script>')).not.toContain('bad')
  })
  it('rejects control-character and backslash relative URLs that a browser can normalize to another origin', () => {
    for (const url of ['/\n/evil.test', '/\\evil.test', '//evil.test', 'javascript:alert(1)']) {
      expect(safeLink(url)).toBeNull(); expect(safePostImageUrl(url)).toBeNull()
    }
    expect(safeLink('/blog/safe')).toBe('/blog/safe')
  })
})
