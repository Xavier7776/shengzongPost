// app/admin/new/page.tsx
import { requireAdmin } from '@/lib/auth'
import PostEditor from '@/components/admin/PostEditor'

export default async function NewPostPage() {
  await requireAdmin()
  return <PostEditor mode="new" />
}
