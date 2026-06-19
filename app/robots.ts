import type { MetadataRoute } from 'next'

const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000'

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
