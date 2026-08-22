import Link from 'next/link'
import { Suspense } from 'react'
import { ChevronRight } from 'lucide-react'
import Hero from '@/components/sections/Hero'
import BlogCard from '@/components/sections/BlogCard'
import SkillCard from '@/components/sections/SkillCard'
import FeaturedGallery from '@/components/sections/FeaturedGallery'
import SectionHeading from '@/components/ui/SectionHeading'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { getAllPosts } from '@/lib/db'
import { getSkills } from '@/lib/db-skills'

export const revalidate = 60 // 启用 ISR：60s 失效，命中缓存时零数据库往返；写文章时 revalidateTag('posts') 立即刷新

// 博客区域骨架屏：样式与 loading.tsx 一致
function BlogSkeleton() {
  return (
    <section className="max-w-6xl mx-auto px-6 py-32">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-4">
        <SectionHeading>最近洞察</SectionHeading>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </section>
  )
}

// Skills 区域骨架屏
function SkillsSkeleton() {
  return (
    <section className="bg-gray-50 py-32 relative overflow-hidden border-t border-gray-100">
      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-4">
          <SectionHeading>SKILL</SectionHeading>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    </section>
  )
}

// 博客区域：独立 async 组件，配合 Suspense 实现流式渲染（不阻塞 Hero 与 Skills）
async function BlogSection() {
  const posts = await getAllPosts()

  return (
    <section className="max-w-6xl mx-auto px-6 py-32">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-4">
        <SectionHeading>最近洞察</SectionHeading>
        <Link
          href="/blog"
          className="text-blue-600 font-bold hover:text-blue-700 flex items-center transition-colors group mb-16 md:mb-0"
        >
          查看全部
          <ChevronRight className="w-5 h-5 ml-1 transform group-hover:translate-x-2 transition-transform duration-300" />
        </Link>
      </div>
      {posts.length === 0 ? (
        <p className="text-gray-300 text-lg">暂无文章</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {posts.slice(0, 4).map((post, i) => (
            <BlogCard
              key={post.slug}
              post={{
                ...post,
                id: post.id,
                date: post.created_at.slice(0, 10),
                cover_image: post.cover_image ?? null,
                author_avatar: post.author_avatar ?? null,
              }}
              index={i}
            />
          ))}
        </div>
      )}
    </section>
  )
}

// Skills 区域：独立 async 组件，配合 Suspense 实现流式渲染
async function SkillsSection() {
  const { skills } = await getSkills({ page: 1, pageSize: 4, sort: 'stars', order: 'desc' })

  return (
    <section className="bg-gray-50 py-32 relative overflow-hidden border-t border-gray-100">
      <div className="absolute top-0 left-0 w-full h-full bg-blue-600/3 blur-[160px] pointer-events-none" />
      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-4">
          <SectionHeading>SKILL</SectionHeading>
          <Link
            href="/skills"
            className="text-blue-600 font-bold hover:text-blue-700 flex items-center transition-colors group mb-16 md:mb-0"
          >
            查看全部
            <ChevronRight className="w-5 h-5 ml-1 transform group-hover:translate-x-2 transition-transform duration-300" />
          </Link>
        </div>
        {skills.length === 0 ? (
          <p className="text-gray-300 text-lg">暂无 Skills</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {skills.map((skill, i) => (
              <SkillCard
                key={skill.slug}
                skill={skill}
                index={i}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export default async function HomePage() {
  return (
    <div className="animate-in">
      {/* Hero 直接渲染，不进入 Suspense，保证首屏最快 paint */}
      <Hero />

      {/* 博客区域流式渲染：数据就绪前先展示骨架屏 */}
      <Suspense fallback={<BlogSkeleton />}>
        <BlogSection />
      </Suspense>

      {/* Skills 区域流式渲染：与博客区域互不阻塞 */}
      <Suspense fallback={<SkillsSkeleton />}>
        <SkillsSection />
      </Suspense>

      {/* 精选摄影条带：图库 is_featured 闭环，无精选时回退最新图片，空则不渲染 */}
      <Suspense fallback={null}>
        <FeaturedGallery />
      </Suspense>
    </div>
  )
}
