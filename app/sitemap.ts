import type { MetadataRoute } from 'next'
import { getAllPosts } from '@/lib/db'
import { getSkills } from '@/lib/db-skills'
import { getEnabledProjects } from '@/lib/db'
import { getSiteUrl } from '@/lib/site-url'
import { unstable_cache } from 'next/cache'

const BASE_URL = getSiteUrl()
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default unstable_cache(async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE_URL}/blog`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/learn`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/skills`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/gallery`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/work`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/projects`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/shop`, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${BASE_URL}/search`, changeFrequency: 'monthly', priority: 0.5 },
  ]

  try {
    const [posts, { skills }, projects] = await Promise.all([
      getAllPosts(),
      getSkills({ page: 1, pageSize: 200, sort: 'stars', order: 'desc' }),
      getEnabledProjects(),
    ])

    const postPages: MetadataRoute.Sitemap = posts.map(post => ({
      url: `${BASE_URL}/blog/${post.slug}`,
      lastModified: new Date(post.updated_at || post.created_at),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    }))

    const skillPages: MetadataRoute.Sitemap = skills.map(skill => ({
      url: `${BASE_URL}/skills/${skill.slug}`,
      lastModified: new Date(skill.updated_at),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))

    const projectPages: MetadataRoute.Sitemap = projects.map(p => ({
      url: `${BASE_URL}/work/${p.slug}`,
      lastModified: new Date(p.updated_at || p.created_at),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }))

    return [...staticPages, ...postPages, ...skillPages, ...projectPages]
  } catch {
    return staticPages
  }
}, ['published-sitemap-v2'], {revalidate:300,tags:['published-content']})
