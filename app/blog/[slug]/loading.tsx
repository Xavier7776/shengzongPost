// app/blog/[slug]/loading.tsx
import { Skeleton, SkeletonText, SkeletonAvatar } from '@/components/ui/Skeleton'

export default function PostLoading() {
  return (
    <div className="max-w-[780px] mx-auto px-6 py-24 animate-in">
      {/* 返回按钮骨架 */}
      <div className="animate-pulse bg-gray-200 rounded-lg h-4 w-24 mb-16" />

      <article>
        <header className="mb-14">
          {/* 日期 */}
          <Skeleton className="h-4 w-28 mb-4" />
          {/* 标题 */}
          <Skeleton className="h-12 w-full mb-2" />
          <Skeleton className="h-12 w-2/3 mb-6" />
          {/* 作者 */}
          <div className="flex items-center gap-3 mb-8">
            <SkeletonAvatar size={40} />
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
          {/* 摘要 */}
          <Skeleton className="h-5 w-full mb-2" />
          <Skeleton className="h-5 w-3/4 mb-8" />
          {/* 标签 */}
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16 rounded-md" />
            <Skeleton className="h-6 w-20 rounded-md" />
          </div>
        </header>

        {/* 正文骨架 */}
        <SkeletonText lines={4} className="mb-6" />
        <Skeleton className="h-4 w-1/2 mb-8" />
        <SkeletonText lines={5} className="mb-6" />
        <Skeleton className="h-40 w-full mb-8" />
        <SkeletonText lines={3} />
      </article>
    </div>
  )
}
