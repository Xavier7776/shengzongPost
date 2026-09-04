// app/admin/new/page.tsx
import { requireAdmin } from '@/lib/auth'
import PostEditor from '@/features/admin-posts/AdminPostEditor'

export default async function NewPostPage() {
  await requireAdmin()
  return <PostEditor mode="new" />
}
