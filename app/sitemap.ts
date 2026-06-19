import type { MetadataRoute } from 'next'
import { getAllPosts } from '@/lib/db'
import { getSkills } from '@/lib/db-skills'

const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE_URL}/blog`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/skills`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/skills?view=trending`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE_URL}/gallery`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/projects`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/shop`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.6 },
    { url: `${BASE_URL}/search`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  ]

  try {
    const [posts, { skills }] = await Promise.all([
      getAllPosts(),
      getSkills({ page: 1, pageSize: 200, sort: 'stars', order: 'desc' }),
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

    return [...staticPages, ...postPages, ...skillPages]
  } catch {
    return staticPages
  }
}
