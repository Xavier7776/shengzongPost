// __tests__/components/WorkCard.test.tsx
// 测试 components/sections/WorkCard.tsx 组件渲染逻辑
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

// mock next/link 为普通 <a>
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={typeof href === 'string' ? href : ''} {...props}>{children}</a>
  ),
}))

// mock next/image 为普通 <img>，过滤 next 专属属性
vi.mock('next/image', () => ({
  default: ({ src, alt, fill, sizes, ...props }: any) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} {...props} />
  ),
}))

// mock 滚动揭示 hook，让组件直接处于可见状态
vi.mock('@/lib/hooks', () => ({
  useScrollReveal: () => [{ current: null }, true],
  useIsMobile: () => false,
}))

import WorkCard from '@/components/sections/WorkCard'
import type { WorkProject } from '@/components/sections/WorkCard'

function makeProject(overrides: Partial<WorkProject> = {}): WorkProject {
  return {
    slug: 'test-project',
    name: '测试项目',
    tagline: '一个测试项目',
    description: '这是项目的描述内容',
    content: null,
    cover: '/cover.png',
    techStack: ['React', 'Next.js', 'Tailwind', 'Supabase', 'Vitest'],
    highlights: ['高性能', '现代化'],
    demoUrl: 'https://demo.example.com',
    githubUrl: 'https://github.com/foo/bar',
    year: '2024',
    attachments: [],
    ...overrides,
  }
}

describe('WorkCard 组件渲染', () => {
  it('渲染项目名称、tagline 和描述', () => {
    render(<WorkCard project={makeProject()} index={0} />)
    expect(screen.getByText('测试项目')).toBeInTheDocument()
    expect(screen.getByText('一个测试项目')).toBeInTheDocument()
    expect(screen.getByText('这是项目的描述内容')).toBeInTheDocument()
  })

  it('渲染年份角标', () => {
    render(<WorkCard project={makeProject({ year: '2023' })} index={0} />)
    expect(screen.getByText('2023')).toBeInTheDocument()
  })

  it('最多展示 3 个技术栈，超出折叠为 +N', () => {
    render(<WorkCard project={makeProject()} index={0} />)
    expect(screen.getByText('React')).toBeInTheDocument()
    expect(screen.getByText('Next.js')).toBeInTheDocument()
    expect(screen.getByText('Tailwind')).toBeInTheDocument()
    // 第 4、5 个不直接展示
    expect(screen.queryByText('Supabase')).not.toBeInTheDocument()
    expect(screen.queryByText('Vitest')).not.toBeInTheDocument()
    // 折叠数量 +2
    expect(screen.getByText('+2')).toBeInTheDocument()
  })

  it('技术栈 <= 3 时不展示 +N 折叠', () => {
    render(
      <WorkCard
        project={makeProject({ techStack: ['React', 'Next.js'] })}
        index={0}
      />
    )
    expect(screen.queryByText(/^\+\d+$/)).not.toBeInTheDocument()
  })

  it('techStack 为空时不渲染技术栈区域', () => {
    render(<WorkCard project={makeProject({ techStack: [] })} index={0} />)
    expect(screen.queryByText('React')).not.toBeInTheDocument()
    expect(screen.queryByText(/^\+\d+$/)).not.toBeInTheDocument()
  })

  it('存在 demoUrl 时渲染"在线预览"链接', () => {
    render(<WorkCard project={makeProject()} index={0} />)
    const link = screen.getByText('在线预览').closest('a')
    expect(link).toHaveAttribute('href', 'https://demo.example.com')
  })

  it('不存在 demoUrl 时不渲染"在线预览"', () => {
    render(<WorkCard project={makeProject({ demoUrl: null })} index={0} />)
    expect(screen.queryByText('在线预览')).not.toBeInTheDocument()
  })

  it('存在 githubUrl 时渲染"源码"链接', () => {
    render(<WorkCard project={makeProject()} index={0} />)
    const link = screen.getByText('源码').closest('a')
    expect(link).toHaveAttribute('href', 'https://github.com/foo/bar')
  })

  it('不存在 githubUrl 时不渲染"源码"', () => {
    render(<WorkCard project={makeProject({ githubUrl: null })} index={0} />)
    expect(screen.queryByText('源码')).not.toBeInTheDocument()
  })

  it('详情链接指向 /work/[slug]', () => {
    render(<WorkCard project={makeProject({ slug: 'my-slug' })} index={0} />)
    const detailLinks = screen
      .getAllByRole('link')
      .filter(a => a.getAttribute('href') === '/work/my-slug')
    expect(detailLinks.length).toBeGreaterThan(0)
  })
})
