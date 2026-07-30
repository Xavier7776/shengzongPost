// __tests__/lib/db-works.test.ts
// 测试 lib/db-works.ts 中 mapProject 的字段映射逻辑
// mapProject 未导出，通过 getAllProjects / getProjectBySlug 间接测试，mock getEnabledProjects
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/db', () => ({
  getEnabledProjects: vi.fn(),
}))

import { getAllProjects, getProjectBySlug } from '@/lib/db-works'
import { getEnabledProjects } from '@/lib/db'
import type { Project } from '@/lib/db'

const mockedGetEnabledProjects = vi.mocked(getEnabledProjects)

function makeDbProject(overrides: Partial<Project> = {}): Project {
  return {
    id: 1,
    slug: 'test-project',
    name: 'Test Project',
    tagline: 'A tagline',
    description: 'A description',
    content: '# Hello',
    cover_image: '/cover.png',
    cover_public_id: null,
    tech_stack: ['React', 'Next.js', 'Tailwind', 'Supabase', 'Vitest'],
    highlights: ['Fast', 'Modern'],
    demo_url: 'https://demo.example.com',
    github_url: 'https://github.com/foo/bar',
    year: '2024',
    sort_order: 0,
    enabled: true,
    attachments: [{ url: '/a.md', filename: 'a.md', size: 100 }],
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-02T00:00:00.000Z',
    ...overrides,
  }
}

describe('项目数据映射 lib/db-works', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getAllProjects (mapProject 字段映射)', () => {
    it('将 DB Project 字段正确映射为 WorkProject', async () => {
      mockedGetEnabledProjects.mockResolvedValue([makeDbProject()])

      const result = await getAllProjects()

      expect(result).toHaveLength(1)
      const wp = result[0]
      expect(wp.slug).toBe('test-project')
      expect(wp.name).toBe('Test Project')
      expect(wp.tagline).toBe('A tagline')
      expect(wp.description).toBe('A description')
      expect(wp.content).toBe('# Hello')
      expect(wp.cover).toBe('/cover.png')
      expect(wp.techStack).toEqual(['React', 'Next.js', 'Tailwind', 'Supabase', 'Vitest'])
      expect(wp.highlights).toEqual(['Fast', 'Modern'])
      expect(wp.demoUrl).toBe('https://demo.example.com')
      expect(wp.githubUrl).toBe('https://github.com/foo/bar')
      expect(wp.year).toBe('2024')
      expect(wp.attachments).toEqual([{ url: '/a.md', filename: 'a.md', size: 100 }])
    })

    it('tagline 为 null 时映射为空字符串', async () => {
      mockedGetEnabledProjects.mockResolvedValue([makeDbProject({ tagline: null })])
      const result = await getAllProjects()
      expect(result[0].tagline).toBe('')
    })

    it('description 为 null 时映射为空字符串', async () => {
      mockedGetEnabledProjects.mockResolvedValue([makeDbProject({ description: null })])
      const result = await getAllProjects()
      expect(result[0].description).toBe('')
    })

    it('cover_image 为 null 时映射为空字符串', async () => {
      mockedGetEnabledProjects.mockResolvedValue([makeDbProject({ cover_image: null })])
      const result = await getAllProjects()
      expect(result[0].cover).toBe('')
    })

    it('tech_stack 为 null 时映射为空数组', async () => {
      mockedGetEnabledProjects.mockResolvedValue([
        makeDbProject({ tech_stack: null as unknown as string[] }),
      ])
      const result = await getAllProjects()
      expect(result[0].techStack).toEqual([])
    })

    it('highlights 为 null 时映射为空数组', async () => {
      mockedGetEnabledProjects.mockResolvedValue([
        makeDbProject({ highlights: null as unknown as string[] }),
      ])
      const result = await getAllProjects()
      expect(result[0].highlights).toEqual([])
    })

    it('demo_url / github_url 为 null 时保留为 null', async () => {
      mockedGetEnabledProjects.mockResolvedValue([
        makeDbProject({ demo_url: null, github_url: null }),
      ])
      const result = await getAllProjects()
      expect(result[0].demoUrl).toBeNull()
      expect(result[0].githubUrl).toBeNull()
    })

    it('year 为 null 时映射为空字符串', async () => {
      mockedGetEnabledProjects.mockResolvedValue([makeDbProject({ year: null })])
      const result = await getAllProjects()
      expect(result[0].year).toBe('')
    })

    it('attachments 为 undefined 时映射为空数组', async () => {
      mockedGetEnabledProjects.mockResolvedValue([
        makeDbProject({ attachments: undefined }),
      ])
      const result = await getAllProjects()
      expect(result[0].attachments).toEqual([])
    })

    it('content 为 null 时保留为 null', async () => {
      mockedGetEnabledProjects.mockResolvedValue([makeDbProject({ content: null })])
      const result = await getAllProjects()
      expect(result[0].content).toBeNull()
    })

    it('支持多条项目一起映射', async () => {
      mockedGetEnabledProjects.mockResolvedValue([
        makeDbProject({ id: 1, slug: 'a', name: 'A' }),
        makeDbProject({ id: 2, slug: 'b', name: 'B' }),
        makeDbProject({ id: 3, slug: 'c', name: 'C' }),
      ])
      const result = await getAllProjects()
      expect(result).toHaveLength(3)
      expect(result.map(p => p.slug)).toEqual(['a', 'b', 'c'])
    })

    it('getEnabledProjects 抛错时返回空数组且不抛出', async () => {
      mockedGetEnabledProjects.mockRejectedValue(new Error('DB down'))
      const result = await getAllProjects()
      expect(result).toEqual([])
    })
  })

  describe('getProjectBySlug', () => {
    it('根据 slug 返回匹配的项目', async () => {
      mockedGetEnabledProjects.mockResolvedValue([
        makeDbProject({ id: 1, slug: 'a', name: 'A' }),
        makeDbProject({ id: 2, slug: 'b', name: 'B' }),
      ])
      const result = await getProjectBySlug('b')
      expect(result).not.toBeNull()
      expect(result?.slug).toBe('b')
      expect(result?.name).toBe('B')
    })

    it('未匹配到 slug 时返回 null', async () => {
      mockedGetEnabledProjects.mockResolvedValue([makeDbProject({ slug: 'a' })])
      const result = await getProjectBySlug('missing')
      expect(result).toBeNull()
    })
  })
})
