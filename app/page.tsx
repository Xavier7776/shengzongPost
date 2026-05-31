import Link from 'next/link'
import { ChevronRight, Github, ExternalLink } from 'lucide-react'
import Hero from '@/components/sections/Hero'
import BlogCard from '@/components/sections/BlogCard'
import SkillCard from '@/components/sections/SkillCard'
import SectionHeading from '@/components/ui/SectionHeading'
import { getAllPosts } from '@/lib/db'
import { getSkills } from '@/lib/db-skills'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function HomePage() {
  const [posts, { skills }] = await Promise.all([
    getAllPosts(),
    getSkills({ page: 1, pageSize: 4, sort: 'stars', order: 'desc' }),
  ])

  return (
    <div className="animate-in">
      <Hero />

      {/* Recent Blog Posts */}
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

      {/* Skills */}
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
    </div>
  )
}
