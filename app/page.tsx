import Link from 'next/link'
import { Suspense } from 'react'
import { ChevronRight } from 'lucide-react'
import Hero from '@/components/sections/Hero'
import BlogCard from '@/components/sections/BlogCard'
import SkillCard from '@/components/sections/SkillCard'
import SectionHeading from '@/components/ui/SectionHeading'
import HomeViews from '@/features/home/HomeViews'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { getRecentPostCards } from '@/lib/db'
import { getSkills } from '@/lib/db-skills'

export const revalidate = 60 // ISR plus explicit publication-path invalidation.
export const metadata = { alternates: { canonical: '/' } }

function HomeSectionHeading({ title, href }: { title: string; href: string }) {
  return <div className="mb-6 flex items-center justify-between gap-4 md:mb-16">
    <SectionHeading spacing="none">{title}</SectionHeading>
    <Link href={href} aria-label={'查看全部' + title}
      className="group inline-flex min-h-11 shrink-0 items-center font-bold text-blue-600 hover:text-blue-700">
      查看全部
      <ChevronRight aria-hidden="true" className="ml-1 size-5 transition-transform group-hover:translate-x-1" />
    </Link>
  </div>
}

// 博客区域骨架屏：样式与 loading.tsx 一致
function BlogSkeleton() {
  return (
    <section className="max-w-6xl mx-auto px-6 py-10 md:py-32">
      <HomeSectionHeading title="最近洞察" href="/blog" />
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
    <section className="bg-gray-50 py-10 md:py-32 relative overflow-hidden border-t border-gray-100">
      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <HomeSectionHeading title="SKILL" href="/skills" />
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
  const posts = await getRecentPostCards(4)

  return (
    <section className="max-w-6xl mx-auto px-6 py-10 md:py-32">
      <HomeSectionHeading title="最近洞察" href="/blog" />
      {posts.length === 0 ? (
        <p className="text-gray-300 text-lg">暂无文章</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {posts.map((post, i) => (
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
    <section className="bg-gray-50 py-10 md:py-32 relative overflow-hidden border-t border-gray-100">
      <div className="absolute top-0 left-0 w-full h-full bg-blue-600/3 blur-[160px] pointer-events-none" />
      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <HomeSectionHeading title="SKILL" href="/skills" />
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
    <HomeViews>
      <div>
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
      </div>
    </HomeViews>
  )
}
