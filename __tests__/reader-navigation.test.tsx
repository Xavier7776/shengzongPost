import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import LearnToc from '@/app/blog/[slug]/LearnToc'
import ReaderCodeBlock from '@/components/learn/ReaderCodeBlock'
import { groupReaderHeadings, type ReaderHeading } from '@/lib/reader-toc'

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals() })

describe('reader chapter navigation', () => {
  it('keeps every anchor and nests subheadings with the actual parent', () => {
    const headings: ReaderHeading[] = [
      { id: 'intro', text: '一、问题与概念', level: 2, parentId: null },
      { id: 'experiment', text: '二、关键实验', level: 2, parentId: null },
      { id: 'result', text: '实验结果', level: 3, parentId: 'experiment' },
      { id: 'python', text: '三、Python 实战', level: 2, parentId: null },
      { id: 'sources', text: '原始出处', level: 2, parentId: null },
    ]
    const grouped = groupReaderHeadings(headings, true)
    expect(grouped.flatMap(group => group.items.map(item => item.id)).sort()).toEqual(headings.map(item => item.id).sort())
    expect(grouped.find(group => group.id === 'evidence')?.items.map(item => item.id)).toEqual(['experiment', 'result'])
    expect(groupReaderHeadings(headings, false).find(group => group.id === 'experiment')?.items.map(item => item.id)).toEqual(['result'])
  })

  it('keeps the modal above the site shell and restores keyboard focus on Escape', async () => {
    render(<main><div id="blog-reader-root"><div className="reader-content"><h2 id="intro">基础认知</h2><h2 id="python">Python 实战</h2></div></div><LearnToc /></main>)
    const trigger = await screen.findByRole('button', { name: /^章节/ })
    fireEvent.click(trigger)
    const drawer = screen.getByRole('dialog', { name: '专刊章节' })
    expect(drawer.closest('.reader-toc-overlay')?.parentElement).toBe(document.body)
    expect(document.body.style.overflow).toBe('hidden')
    const close = within(drawer).getByRole('button', { name: '关闭目录' })
    expect(close).toHaveFocus()
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
    expect(document.body.style.overflow).toBe('')
  })

  it('shows inactive groups on demand without losing their original heading links', async () => {
    render(<><div id="blog-reader-root"><div className="reader-content"><h2 id="intro">基础认知</h2><h2 id="python">Python 实战</h2></div></div><LearnToc /></>)
    const group = await screen.findByRole('button', { name: /代码与实践/ })
    expect(screen.queryByRole('button', { name: 'Python 实战' })).not.toBeInTheDocument()
    fireEvent.click(group)
    expect(screen.getByRole('button', { name: 'Python 实战' })).toBeInTheDocument()
    fireEvent.click(group)
    expect(screen.queryByRole('button', { name: 'Python 实战' })).not.toBeInTheDocument()
  })
})

describe('reader code copying', () => {
  it.each([true, false])('preserves the exact code and reports clipboard success=%s', async success => {
    const code = 'print("<safe>")\n    # 原始缩进'
    const writeText = success ? vi.fn().mockResolvedValue(undefined) : vi.fn().mockRejectedValue(new Error('Clipboard blocked'))
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    const { container } = render(<ReaderCodeBlock language="python" code={code} caption="教学示例" />)
    fireEvent.click(screen.getByRole('button', { name: '复制代码' }))
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(success ? '已复制' : '复制失败'))
    expect(writeText).toHaveBeenCalledWith(code)
    expect(container.querySelector('code')?.textContent).toBe(code)
    expect(container.querySelector('safe')).toBeNull()
  })
})
