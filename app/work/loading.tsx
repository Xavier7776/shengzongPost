// app/work/loading.tsx
// 个人项目页骨架屏
function WorkCardSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center bg-white rounded-3xl overflow-hidden border border-gray-100/80 shadow-sm p-6 lg:p-8">
      <div className="relative aspect-[16/10] rounded-2xl bg-gray-100 animate-pulse" />
      <div className="space-y-3">
        <div className="h-7 w-2/3 bg-gray-100 rounded animate-pulse" />
        <div className="h-4 w-1/3 bg-blue-50 rounded animate-pulse" />
        <div className="space-y-2 pt-2">
          <div className="h-3 w-full bg-gray-100 rounded animate-pulse" />
          <div className="h-3 w-5/6 bg-gray-100 rounded animate-pulse" />
          <div className="h-3 w-4/6 bg-gray-100 rounded animate-pulse" />
        </div>
        <div className="flex gap-2 pt-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-5 w-16 bg-gray-50 rounded animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  )
}

export default function Loading() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-24">
      {/* Hero 骨架 */}
      <div className="mb-24">
        <div className="h-10 w-48 bg-gray-100 rounded mb-16 animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-4">
            <div className="h-5 w-full bg-gray-100 rounded animate-pulse" />
            <div className="h-5 w-5/6 bg-gray-100 rounded animate-pulse" />
            <div className="h-5 w-4/6 bg-gray-100 rounded animate-pulse" />
            <div className="flex gap-3 pt-4">
              <div className="h-10 w-28 bg-gray-100 rounded-xl animate-pulse" />
              <div className="h-10 w-28 bg-gray-100 rounded-xl animate-pulse" />
            </div>
          </div>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 bg-white rounded-2xl border border-gray-100 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
      {/* 项目卡片骨架 */}
      <div className="space-y-12">
        {Array.from({ length: 2 }).map((_, i) => (
          <WorkCardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}
