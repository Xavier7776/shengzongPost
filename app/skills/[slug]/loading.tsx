// app/skills/[slug]/loading.tsx
import { Skeleton, SkeletonText } from '@/components/ui/Skeleton'

export default function SkillDetailLoading() {
  return (
    <div className="max-w-[780px] mx-auto px-6 py-24 animate-in">
      {/* 返回按钮骨架 */}
      <div className="animate-pulse bg-gray-200 rounded-lg h-4 w-24 mb-16" />

      <article>
        <header className="mb-10">
          {/* 分类 */}
          <Skeleton className="h-6 w-20 mb-4 rounded-lg" />
          {/* 名称 */}
          <Skeleton className="h-12 w-full mb-2" />
          <Skeleton className="h-12 w-2/3 mb-6" />
          {/* 简介 */}
          <Skeleton className="h-5 w-full mb-2" />
          <Skeleton className="h-5 w-3/4 mb-6" />
          {/* 元信息 */}
          <div className="flex gap-4 mb-6">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-28" />
          </div>
          {/* 标签 */}
          <div className="flex gap-2">
            <Skeleton className="h-7 w-16 rounded-lg" />
            <Skeleton className="h-7 w-20 rounded-lg" />
            <Skeleton className="h-7 w-14 rounded-lg" />
          </div>
        </header>

        {/* 分割线 */}
        <div className="border-t border-gray-100 mb-10" />

        {/* 内容骨架 */}
        <SkeletonText lines={5} className="mb-6" />
        <Skeleton className="h-4 w-1/2 mb-8" />
        <SkeletonText lines={4} className="mb-6" />
        <Skeleton className="h-40 w-full mb-8" />
        <SkeletonText lines={3} />
      </article>
    </div>
  )
}
