// app/blog/loading.tsx
import { SkeletonCard } from '@/components/ui/Skeleton'

export default function BlogLoading() {
  return (
    <div className="max-w-[960px] mx-auto px-6 py-24 animate-in">
      {/* 标题骨架 */}
      <div className="mb-10">
        <div className="animate-pulse bg-gray-200 rounded-lg h-4 w-16 mb-4" />
        <div className="animate-pulse bg-gray-200 rounded-lg h-10 w-48" />
      </div>

      {/* 搜索框骨架 */}
      <div className="animate-pulse bg-gray-200 rounded-2xl h-12 mb-6" />

      {/* 标签骨架 */}
      <div className="flex gap-2 mb-8">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="animate-pulse bg-gray-200 rounded-full h-7 w-16" />
        ))}
      </div>

      {/* 卡片网格骨架 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  )
}
