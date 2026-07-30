// __tests__/components/SkillCard.test.tsx
// 测试 components/sections/SkillCard.tsx 组件渲染逻辑
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={typeof href === 'string' ? href : ''} {...props}>{children}</a>
  ),
}))

vi.mock('@/lib/hooks', () => ({
  useScrollReveal: () => [{ current: null }, true],
  useIsMobile: () => false,
}))

// mock Card3D 为简单 div 透传，避免 3D 交互干扰渲染断言
vi.mock('@/components/ui/Card3D', () => ({
  default: ({ children, className }: any) => (
    <div className={className}>{children}</div>
  ),
}))

import SkillCard from '@/components/sections/SkillCard'

// SkillCard 内部定义了同名 SkillMeta 接口（未从 db-skills 导入），此处复刻其结构
interface SkillMeta {
  slug: string
  name: string
  description: string | null
  chinese_summary: string | null
  source_type: string
  stars: number
  tags: string[]
  category: string
  created_at: string
  updated_at: string
}

function makeSkill(overrides: Partial<SkillMeta> = {}): SkillMeta {
  return {
    slug: 'test-skill',
    name: '测试技能',
    description: 'An English description of the skill',
    chinese_summary: '这是技能的中文简介',
    source_type: 'github',
    stars: 1234,
    tags: ['agent', 'coding', 'react', 'typescript', 'extra'],
    category: 'coding',
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-06-15T00:00:00.000Z',
    ...overrides,
  }
}

describe('SkillCard 组件渲染', () => {
  it('渲染技能名称和中文简介', () => {
    render(<SkillCard skill={makeSkill()} index={0} />)
    expect(screen.getByText('测试技能')).toBeInTheDocument()
    expect(screen.getByText('这是技能的中文简介')).toBeInTheDocument()
  })

  it('chinese_summary 为空时回退到 description', () => {
    render(
      <SkillCard skill={makeSkill({ chinese_summary: null })} index={0} />
    )
    expect(
      screen.getByText('An English description of the skill')
    ).toBeInTheDocument()
  })

  it('chinese_summary 和 description 均为空时显示"暂无简介"', () => {
    render(
      <SkillCard
        skill={makeSkill({ chinese_summary: null, description: null })}
        index={0}
      />
    )
    expect(screen.getByText('暂无简介')).toBeInTheDocument()
  })

  it('渲染分类标签（中文）', () => {
    render(<SkillCard skill={makeSkill({ category: 'coding' })} index={0} />)
    expect(screen.getByText('编程开发')).toBeInTheDocument()
  })

  it('research 分类渲染为"学术研究"', () => {
    render(<SkillCard skill={makeSkill({ category: 'research' })} index={0} />)
    expect(screen.getByText('学术研究')).toBeInTheDocument()
  })

  it('未知分类回退到"AI 工具"', () => {
    render(
      <SkillCard skill={makeSkill({ category: 'unknown-cat' })} index={0} />
    )
    expect(screen.getByText('AI 工具')).toBeInTheDocument()
  })

  it('渲染 stars 数值（带千分位）', () => {
    render(<SkillCard skill={makeSkill({ stars: 12345 })} index={0} />)
    // toLocaleString 在 en-US 下为 "12,345"，兼容不同 locale 的分隔符
    expect(screen.getByText(/12[,.]?345/)).toBeInTheDocument()
  })

  it('最多展示 4 个标签，超出折叠为 +N', () => {
    render(<SkillCard skill={makeSkill()} index={0} />)
    expect(screen.getByText('agent')).toBeInTheDocument()
    expect(screen.getByText('coding')).toBeInTheDocument()
    expect(screen.getByText('react')).toBeInTheDocument()
    expect(screen.getByText('typescript')).toBeInTheDocument()
    // 第 5 个不展示
    expect(screen.queryByText('extra')).not.toBeInTheDocument()
    expect(screen.getByText('+1')).toBeInTheDocument()
  })

  it('标签数量 <= 4 时不展示 +N', () => {
    render(<SkillCard skill={makeSkill({ tags: ['a', 'b'] })} index={0} />)
    expect(screen.queryByText(/^\+\d+$/)).not.toBeInTheDocument()
  })

  it('详情链接指向 /skills/[slug]', () => {
    render(<SkillCard skill={makeSkill({ slug: 'my-slug' })} index={0} />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/skills/my-slug')
  })

  it('渲染 source_type 文本', () => {
    render(
      <SkillCard skill={makeSkill({ source_type: 'github' })} index={0} />
    )
    expect(screen.getByText('github')).toBeInTheDocument()
  })

  it('渲染更新日期（YYYY-MM-DD）', () => {
    render(
      <SkillCard
        skill={makeSkill({ updated_at: '2024-06-15T12:00:00.000Z' })}
        index={0}
      />
    )
    expect(screen.getByText('2024-06-15')).toBeInTheDocument()
  })

  it('3 天内创建的技能展示 NEW 标记', () => {
    const recent = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    render(<SkillCard skill={makeSkill({ created_at: recent })} index={0} />)
    expect(screen.getByText('NEW')).toBeInTheDocument()
  })

  it('3 天前创建的技能不展示 NEW 标记', () => {
    const old = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
    render(<SkillCard skill={makeSkill({ created_at: old })} index={0} />)
    expect(screen.queryByText('NEW')).not.toBeInTheDocument()
  })
})
