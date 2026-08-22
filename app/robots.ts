import type { MetadataRoute } from 'next'
import { getSiteUrl } from '@/lib/site-url'

const BASE_URL = getSiteUrl()

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/blog', '/skills', '/gallery', '/projects', '/shop', '/search', '/feed.xml'],
        disallow: [
          '/admin/*',
          '/dashboard/*',
          '/onlyus/*',
          '/api/*',
          '/profile/*',
          '/login',
          '/register',
          '/verify',
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}
