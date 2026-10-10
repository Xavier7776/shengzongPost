import { renderToStaticMarkup } from 'react-dom/server'
import { expect, it, vi } from 'vitest'
vi.mock('@/lib/db-works', () => ({ getProjectBySlug: async () => ({ slug: 'fixture', name: 'Fixture', description: 'Synthetic', content: '## R&D "安全"\n\n<table><tr><td>Safe</td></tr></table>', attachments: [], techStack: [], highlights: [], cover: '', tagline: '', year: '' }), getAllProjects: async () => [] }))
vi.mock('@/components/sections/RelatedContent', () => ({ default: () => null }))
import Page from '@/app/work/[slug]/page'
it('keeps the existing ampersand heading target equal to its TOC link after attribute encoding', async () => {
  const html = renderToStaticMarkup(await Page({ params: Promise.resolve({ slug: 'fixture' }) }))
  const container = document.createElement('div')
  container.innerHTML = html
  const heading = container.querySelector('h2[id]')!
  expect(heading.id).toBe('r&d-安全')
  const links = Array.from(container.querySelectorAll('a[href]')).map(link => link.getAttribute('href'))
  expect(links).toContain('#r&d-安全')
  expect(html).not.toContain('onmouseover=')
})
