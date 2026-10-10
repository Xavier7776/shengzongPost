// app/blog/[slug]/PostComments.tsx
import { getPostBySlug, getAdjacentPosts } from '@/lib/db'
import CommentSection from '@/components/sections/CommentSection'
import PostActions from '@/components/sections/PostActions'
import ViewTracker from '@/components/sections/ViewTracker'
import ShareButtons from '@/components/sections/ShareButtons'
import PostNavigation from '@/components/sections/PostNavigation'
import RelatedContent from '@/components/sections/RelatedContent'
import { Suspense } from 'react'

interface PostCommentsProps {
  slug: string
}

export default async function PostComments({ slug }: PostCommentsProps) {
  const [post, { prev, next }] = await Promise.all([
    getPostBySlug(slug),
    getAdjacentPosts(slug),
  ])

  return (
    <>
      <ViewTracker slug={slug} />

      <div className="mt-16 pt-8 border-t border-gray-100">
        <PostActions slug={slug} />
        {post && <ShareButtons title={post.title} slug={slug} />}
      </div>

      <PostNavigation prev={prev} next={next} />
      <Suspense fallback={null}><RelatedContent slug={slug}/></Suspense>

      <div className="mt-16">
        <CommentSection slug={slug} />
      </div>
    </>
  )
}
