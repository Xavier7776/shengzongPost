import { revalidatePath, revalidateTag } from 'next/cache'
/** Commit has already succeeded; cache failure must not encourage a duplicate write. */
export function invalidatePublishedContent(slugs:string[]):'invalidated'|'failed' {
  let failed=false
  try {revalidateTag('published-content', { expire: 0 })} catch {failed=true}
  for(const path of ['/','/blog','/learn','/work','/feed.xml','/sitemap.xml',...Array.from(new Set(slugs.map(slug=>'/blog/'+encodeURIComponent(slug))))]) {
    try {revalidatePath(path)} catch {failed=true}
  }
  // Publication changes also affect previous/next links on other article pages.
  try {revalidatePath('/blog/[slug]','page')} catch {failed=true}
  // Project pages also contain public article recommendations.
  try {revalidatePath('/work/[slug]','page')} catch {failed=true}
  if(failed)console.error('[content] cache invalidation incomplete')
  return failed?'failed':'invalidated'
}
