// app/page.tsx （替换现有文件）
import Link from 'next/link'
import { ChevronRight, Github, ExternalLink } from 'lucide-react'
import Hero from '@/components/sections/Hero'
import BlogCard from '@/components/sections/BlogCard'
import SectionHeading from '@/components/ui/SectionHeading'
import { PROJECTS } from '@/lib/data'
import { getAllPosts } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const posts = await getAllPosts()

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
            {posts.slice(0, 4).map((post, i) => (
              <BlogCard
                key={post.slug}
                post={{ ...post, id: post.id, date: post.created_at.slice(0, 10) }}
                index={i}
              />
            ))}
          </div>
        )}
      </section>

      {/* Featured Projects */}
      <section className="bg-gray-50 py-32 relative overflow-hidden border-t border-gray-100">
        <div className="absolute top-0 left-0 w-full h-full bg-blue-600/3 blur-[160px] pointer-events-none" />
        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <SectionHeading>精选作品</SectionHeading>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {PROJECTS.slice(0, 2).map(project => (
              <div
                key={project.id}
                className="group p-8 md:p-12 rounded-3xl border border-gray-200 bg-white hover:border-blue-200 hover:shadow-xl hover:shadow-blue-600/5 transition-all duration-500 hover:-translate-y-2"
              >
                <h3 className="text-2xl font-black tracking-tight mb-4 text-gray-900 group-hover:text-blue-600 transition-colors">
                  {project.title}
                </h3>
                <p className="text-gray-500 mb-8 leading-relaxed">{project.desc}</p>
                <div className="flex flex-wrap gap-2 mb-10">
                  {project.tech.map(t => (
                    <span
                      key={t}
                      className="text-[10px] font-black uppercase tracking-widest bg-gray-50 text-gray-400 px-3 py-1.5 rounded-lg border border-gray-100"
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <div className="flex space-x-8">
                  <a href={project.github} className="flex items-center text-sm font-semibold text-gray-400 hover:text-gray-900 transition-colors group/link">
                    <Github className="w-5 h-5 mr-2 transform group-hover/link:rotate-12 transition-transform" />
                    源码
                  </a>
                  <a href={project.demo} className="flex items-center text-sm font-semibold text-gray-400 hover:text-gray-900 transition-colors group/link">
                    <ExternalLink className="w-5 h-5 mr-2 transform group-hover/link:rotate-12 transition-transform" />
                    预览
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
