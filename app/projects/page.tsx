// app/projects/page.tsx
import { Mail, MapPin, Send, Github, Twitter, Link2, Quote, FileText, Eye, Heart, MessageCircle, Clock, ArrowRight, Camera, ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import SectionHeading from '@/components/ui/SectionHeading'
import ContactForm from '@/components/sections/ContactForm'
import { getUserById, sql, getAllGalleryImages } from '@/lib/db'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '个人主页 - MindStack',
  description: '全栈工程师 / AI Agent开发，专注于构建AGI智能系统。',
}

export default async function ProjectsPage() {
  const user = await getUserById(1)

  const name = user?.name || 'Xavier'
  const avatar = user?.avatar || 'https://test.fukit.cn/autoupload/f/T92c4TLzNe5wsXnw_T86nFaMnouKReN3spbQz7x5YEI/20260419/Es8n/940X940/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_2026-04-19_105422_293.jpg'
  const title = user?.title || '全栈工程师 / AI Agent开发'
  const bio = user?.bio || '专注于构建具有极致性能与美感的 Web 应用。梦想是构建AGI智能系统。'
  const motto = user?.motto || ''
  const location = user?.location || 'China'
  const email = user?.email || 'leonidasholya@gmail.com'
  const githubUrl = user?.github_url || 'https://github.com/Xavier7776'
  const twitterUrl = user?.twitter_url || null
  const website = user?.website || null
  const techStack = user?.tech_stack || []

  // ── 查询统计数据 ──
  const [statsRow] = await sql`
    SELECT
      (SELECT COUNT(*)::int FROM posts WHERE published=true) as total_posts,
      (SELECT COALESCE(SUM(view_count),0)::int FROM posts WHERE published=true) as total_views,
      (SELECT COUNT(*)::int FROM post_reactions WHERE type='like') as total_likes,
      (SELECT COUNT(*)::int FROM comments WHERE status='approved') as total_comments
  `
  const stats = statsRow as { total_posts: number; total_views: number; total_likes: number; total_comments: number }

  // ── 最近 5 篇文章 ──
  const recentRows = await sql`
    SELECT slug, title, excerpt, tags, created_at, view_count, cover_image
    FROM posts WHERE published=true
    ORDER BY created_at DESC LIMIT 2
  `
  const recentPosts = recentRows as { slug: string; title: string; excerpt: string | null; tags: string[] | null; created_at: string; view_count: number | null; cover_image: string | null }[]

  // ── Gallery 图片（取前 4 张作为入口预览） ──
  const galleryImages = await getAllGalleryImages()
  const galleryPreview = galleryImages.slice(0, 4).map(img => ({
    url: img.url,
    title: img.title || '无标题',
    category: img.category || 'Photo',
  }))
  const galleryTotal = galleryImages.length

  const statItems = [
    { label: '文章', value: stats.total_posts, icon: FileText, color: 'blue' },
    { label: '浏览', value: stats.total_views, icon: Eye, color: 'purple' },
    { label: '点赞', value: stats.total_likes, icon: Heart, color: 'rose' },
    { label: '评论', value: stats.total_comments, icon: MessageCircle, color: 'amber' },
  ]

  return (
    <div className="max-w-6xl mx-auto px-6 py-24 animate-in">
      <SectionHeading>关于我</SectionHeading>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-20">
        {/* About sidebar */}
        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-32 space-y-12">
            <div>
              <div className="w-32 h-32 rounded-3xl bg-gray-200 mb-8 overflow-hidden transform transition-all duration-700 hover:rotate-6 hover:scale-110 shadow-xl border-4 border-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={avatar} alt={name} className="w-full h-full object-cover" />
              </div>
              <h3 className="text-2xl font-black mb-2">{name}</h3>
              <p className="text-gray-500 font-medium mb-2">{title}</p>
              {motto && (
                <p className="text-gray-400 text-sm italic flex items-center gap-1 mb-4">
                  <Quote className="w-3 h-3 text-gray-300" />
                  {motto}
                </p>
              )}
              <p className="text-gray-600 leading-relaxed mb-8">{bio}</p>

              {techStack.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {techStack.map(skill => (
                    <span key={skill} className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-semibold">
                      {skill}
                    </span>
                  ))}
                </div>
              )}

              <div className="space-y-4">
                <a href={`mailto:${email}`} className="flex items-center text-gray-500 text-sm font-medium hover:text-blue-600 transition-colors">
                  <Mail className="w-4 h-4 mr-3 text-blue-600" />{email}
                </a>
                {githubUrl && (
                  <a href={githubUrl} target="_blank" rel="noopener noreferrer" className="flex items-center text-gray-500 text-sm font-medium hover:text-blue-600 transition-colors">
                    <Github className="w-4 h-4 mr-3 text-blue-600" />
                    {githubUrl.replace(/^https?:\/\/(www\.)?github\.com\//, '')}
                  </a>
                )}
                {twitterUrl && (
                  <a href={twitterUrl} target="_blank" rel="noopener noreferrer" className="flex items-center text-gray-500 text-sm font-medium hover:text-blue-600 transition-colors">
                    <Twitter className="w-4 h-4 mr-3 text-blue-600" />
                    {twitterUrl.replace(/^https?:\/\/(www\.)?(twitter|x)\.com\//, '@')}
                  </a>
                )}
                {website && (
                  <a href={website.startsWith('http') ? website : `https://${website}`} target="_blank" rel="noopener noreferrer" className="flex items-center text-gray-500 text-sm font-medium hover:text-blue-600 transition-colors">
                    <Link2 className="w-4 h-4 mr-3 text-blue-600" />
                    {website.replace(/^https?:\/\//, '')}
                  </a>
                )}
                <Link href="/onlyus" className="flex items-center text-gray-500 text-sm font-medium hover:text-blue-600 transition-colors">
                  <MapPin className="w-4 h-4 mr-3 text-blue-600" />{location}
                </Link>
              </div>
            </div>

            <a
              href="#contact"
              className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-600/20 group"
            >
              <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              开始合作
            </a>
          </div>
        </div>

        {/* 右侧：数据统计 + 精选博文 */}
        <div className="lg:col-span-2 space-y-10">

          {/* 数据统计卡片 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {statItems.map(({ label, value, icon: Icon, color }) => (
              <div
                key={label}
                className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col items-center gap-2 hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-${color}-50`}>
                  <Icon className={`w-5 h-5 text-${color}-500`} />
                </div>
                <span className="text-2xl font-black text-gray-900">{value.toLocaleString()}</span>
                <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">{label}</span>
              </div>
            ))}
          </div>

          {/* 最近文章 */}
          <div>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-black text-gray-900">最新文章</h3>
              <Link
                href="/blog"
                className="flex items-center gap-1 text-sm text-blue-600 font-semibold hover:gap-2 transition-all"
              >
                查看全部 <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="space-y-4">
              {recentPosts.map(post => {
                const date = new Date(post.created_at).toLocaleDateString('zh-CN', {
                  year: 'numeric', month: '2-digit', day: '2-digit',
                })
                return (
                  <Link
                    key={post.slug}
                    href={`/blog/${post.slug}`}
                    className="block bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-[15px] font-bold text-gray-900 group-hover:text-blue-600 transition-colors leading-snug">
                          {post.title}
                        </h4>
                        {post.excerpt && (
                          <p className="text-sm text-gray-500 mt-1.5 line-clamp-2 leading-relaxed">
                            {post.excerpt}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-3">
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <Clock className="w-3 h-3" />{date}
                          </span>
                          {post.tags && post.tags.length > 0 && (
                            <div className="flex items-center gap-1.5">
                              {post.tags.slice(0, 3).map(tag => (
                                <span key={tag} className="px-2 py-0.5 bg-gray-50 text-gray-500 rounded text-[10px] font-semibold">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                          {(post.view_count ?? 0) > 0 && (
                            <span className="flex items-center gap-1 text-xs text-gray-400">
                              <Eye className="w-3 h-3" />{post.view_count}
                            </span>
                          )}
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 flex-shrink-0 mt-1 transition-colors" />
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>

        </div>
      </div>

      {/* ── Gallery 视觉存档入口（全宽） ── */}
      {galleryPreview.length > 0 && (
        <div className="mt-20">
          <Link
            href="/gallery"
            className="group block relative overflow-hidden rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-500"
          >
            {/* 背景图拼贴 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-1 h-[280px] md:h-[360px]">
              {galleryPreview.map((img, i) => (
                <div key={i} className="relative overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt={img.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  {/* 渐变遮罩 */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                </div>
              ))}
            </div>

            {/* 文字覆盖层 */}
            <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-12">
              <div className="flex items-center gap-2 mb-3">
                <Camera className="w-5 h-5 text-white" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/80">Gallery</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-white mb-2">
                视觉存档
              </h2>
              <p className="text-sm md:text-base text-white/70 mb-4 max-w-lg">
                极简主义摄影与视觉创作存档 · 共 {galleryTotal} 张作品
              </p>
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <span>进入画廊</span>
                <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </div>
            </div>
          </Link>
        </div>
      )}

      {/* 联系表单 */}
      <div id="contact" className="mt-32 pt-16 border-t border-gray-100">
        <div className="max-w-2xl mx-auto">
          <div className="mb-12 text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600 mb-3">
              Get In Touch
            </p>
            <h2 className="text-4xl font-black tracking-tighter text-gray-900 mb-4">
              开始一段对话
            </h2>
            <p className="text-gray-500 leading-relaxed">
              无论是合作咨询、技术交流，还是只是打个招呼——我都很乐意收到你的消息。
            </p>
          </div>
          <ContactForm />
        </div>
      </div>
    </div>
  )
}
