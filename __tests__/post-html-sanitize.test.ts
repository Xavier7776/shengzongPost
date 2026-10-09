import { describe, expect, it } from 'vitest'
import { sanitizeRichHtml, sanitizePostContent, safePostImageUrl } from '@/lib/html/sanitize-post'

describe('server + editor safe HTML policy', () => {
  it('strips active elements and any event, style or arbitrary data attributes', () => {
    const input = '<h2 onclick="alert(1)">Title</h2><script>alert(1)</script>' +
      '<style>body{display:none}</style><p style="position:fixed" onmouseover="alert(2)">Hello</p>' +
      '<svg onload="alert(3)"><circle/></svg><form><button>Fake login</button></form>'
    const html = sanitizeRichHtml(input)
    expect(html).toContain('<h2>Title</h2>')
    expect(html).toContain('<p>Hello</p>')
    expect(html).not.toMatch(/<script|<svg|<style|<form|<button|onclick|onmouseover|position:fixed/i)
  })
  it('does not trust encoded or mixed-case script URLs on links', () => {
    const output = sanitizeRichHtml('<a href="&#106;avaScript:alert(1)" onclick="evil()">click</a>')
    expect(output).toContain('<a>click</a>')
    expect(output).not.toMatch(/href=|javascript:|onclick=/i)
  })
  it('preserves safe old Tiptap headings, table structures, images and links', () => {
    const source = '<h2>Intro</h2><table><tbody><tr><td colspan="2">Value &amp; more</td></tr></tbody></table>' +
      '<img src="https://res.cloudinary.com/demo/image/upload/cat.png" onerror="evil()" alt="cat">' +
      '<a href="https://arxiv.org/abs/2610.10170" target="_blank" rel="opener">Paper</a>'
    const html = sanitizeRichHtml(source)
    expect(html).toContain('<h2>Intro</h2>')
    expect(html).toContain('colspan="2"')
    expect(html).toContain('Value &amp; more')
    expect(html).toContain('res.cloudinary.com')
    expect(html).not.toContain('onerror')
    expect(html).toContain('rel="noopener noreferrer nofollow"')
    expect(sanitizeRichHtml(html)).toBe(html)
  })
  it('rejects untrusted image hosts, dangerous media and protocol-relative embeds', () => {
    expect(safePostImageUrl('https://evil.example/pixel.png')).toBeNull()
    expect(safePostImageUrl('data:image/svg+xml;base64,AAAA')).toBeNull()
    expect(safePostImageUrl('//attacker.example/track.png')).toBeNull()
    const html = sanitizeRichHtml('<iframe src="https://evil.example/fake"></iframe>' +
      '<img src="https://evil.example/pixel.png"><object data="evil">blocked</object>')
    expect(html).not.toMatch(/<iframe|<img|<object|evil.example/)
  })
  it('allows known YouTube and Bilibili embed URLs with fixed sandbox only', () => {
    const html = sanitizeRichHtml('<iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" ' +
      'onload="evil()" allow="camera" sandbox="allow-top-navigation"></iframe>' +
      '<iframe src="https://player.bilibili.com/player.html?bvid=BV1xx411c7mD&autoplay=0"></iframe>')
    expect(html).toContain('www.youtube-nocookie.com/embed/dQw4w9WgXcQ')
    expect(html).toContain('player.bilibili.com/player.html?bvid=BV1xx411c7mD')
    expect(html).toContain('sandbox="allow-scripts allow-same-origin allow-presentation"')
    expect(html).not.toContain('allow-top-navigation')
    expect(html).not.toContain('camera')
    expect(html).not.toContain('onload')
  })
  it('passes legacy plain Markdown through unchanged; sanitizes HTML articles', () => {
    expect(sanitizePostContent('## Title\n\nThis is **Markdown**.')).toBe('## Title\n\nThis is **Markdown**.')
    expect(sanitizePostContent('<p onclick="a()">Hello</p>')).toBe('<p>Hello</p>')
  })
})
