// app/admin/edit/[slug]/page.tsx
import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/auth'
import { getPostBySlugAdmin } from '@/lib/db'
import PostEditor from '@/components/admin/PostEditor'

interface Props { params: { slug: string } }

export default async function EditPostPage({ params }: Props) {
  await requireAdmin()
  const post = await getPostBySlugAdmin(params.slug)
  if (!post) notFound()

  return (
    <PostEditor
      mode="edit"
      initialData={{
        slug: post.slug,
        title: post.title,
        excerpt: post.excerpt,
        content: post.content,
        tags: post.tags,
        published: post.published,
      }}
    />
  )
}
