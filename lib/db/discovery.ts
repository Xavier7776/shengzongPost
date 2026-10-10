import { unstable_cache } from 'next/cache'
import { getAllPosts } from './posts'
import { sql } from './_core'

// shortcut: Read all public metadata at this small corpus size; use a bounded SQL shortlist if growth makes it measurable.
export const getDiscoveryContent = unstable_cache(async () => {
  const [posts, projects] = await Promise.all([
    getAllPosts(),
    sql`SELECT slug,name FROM projects WHERE enabled=TRUE ORDER BY slug`,
  ])
  return { posts, projects: projects as { slug: string; name: string }[] }
}, ['public-content-discovery-v1'], { revalidate: 60, tags: ['published-content'] })
