// 路径：app/blog/[slug]/page.tsx
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getPostBySlug, getAdjacentPosts } from '@/lib/db'
import ReadingProgressBar from '@/components/sections/ReadingProgressBar'
import KeyboardShortcuts from '@/components/sections/KeyboardShortcuts'
import BackToTop from '@/components/ui/BackToTop'
import ReadingHistory from '@/components/sections/ReadingHistory'
import { Skeleton, SkeletonText, SkeletonAvatar } from '@/components/ui/Skeleton'
import PostHeader from './PostHeader'
import PostContent from './PostContent'
import PostComments from './PostComments'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface PageProps { params: { slug: string } }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const post = await getPostBySlug(params.slug)
  if (!post) return { title: '文章不存在 — ARC.' }
  return { title: `${post.title} — ARC.`, description: post.excerpt }
}

// ── 骨架屏组件 ────────────────────────────────────────────────
function PostHeaderSkeleton() {
  return (
    <header className="mb-12">
      <Skeleton className="h-4 w-28 mb-4" />
      <Skeleton className="h-12 w-full mb-2" />
      <Skeleton className="h-12 w-2/3 mb-8" />
      <div className="flex items-center gap-3 mb-8">
        <SkeletonAvatar size={40} />
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
      <Skeleton className="h-5 w-full mb-2" />
      <Skeleton className="h-5 w-3/4 mb-8" />
      <div className="flex gap-2">
        <Skeleton className="h-6 w-16 rounded-md" />
        <Skeleton className="h-6 w-20 rounded-md" />
      </div>
    </header>
  )
}

function PostContentSkeleton() {
  return (
    <div>
      <SkeletonText lines={4} className="mb-6" />
      <Skeleton className="h-4 w-1/2 mb-8" />
      <SkeletonText lines={5} className="mb-6" />
      <Skeleton className="h-40 w-full mb-8" />
      <SkeletonText lines={3} />
    </div>
  )
}

function PostCommentsSkeleton() {
  return (
    <>
      <div className="mt-16 pt-8 border-t border-gray-100">
        <div className="flex gap-3 mb-6">
          <Skeleton className="h-9 w-24 rounded-lg" />
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
      </div>
      <div className="mt-8 grid grid-cols-2 gap-4">
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
      </div>
      <div className="mt-16">
        <Skeleton className="h-6 w-32 mb-6" />
        <div className="space-y-4">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
      </div>
    </>
  )
}

export default async function BlogPostPage({ params }: PageProps) {
  const [post, { prev, next }] = await Promise.all([
    getPostBySlug(params.slug),
    getAdjacentPosts(params.slug),
  ])
  if (!post) notFound()

  // JSON-LD 结构化数据（Article schema）
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    image: post.cover_image ?? undefined,
    datePublished: post.created_at,
    dateModified: post.updated_at,
    author: {
      '@type': 'Person',
      name: post.author_name ?? 'ARC',
    },
    publisher: {
      '@type': 'Organization',
      name: 'MindStack',
      logo: { '@type': 'ImageObject', url: '/logo.png' },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `/blog/${params.slug}`,
    },
    keywords: post.tags?.join(', '),
  }

  return (
    <>
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
    <ReadingProgressBar />
    <KeyboardShortcuts prevSlug={prev?.slug} nextSlug={next?.slug} />
    <BackToTop />
    <ReadingHistory slug={params.slug} title={post.title} />

    {/* 全宽布局：内容居中，最大宽度 900px */}
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-[900px] mx-auto px-6 lg:px-8">
        <Link href="/blog" className="inline-flex items-center text-gray-400 hover:text-blue-600 transition-colors mb-12 group font-bold uppercase tracking-widest text-xs">
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-2 transition-transform duration-300" />
          返回博客列表
        </Link>

        <article>
          <Suspense fallback={<PostHeaderSkeleton />}>
            <PostHeader slug={params.slug} />
          </Suspense>

          <Suspense fallback={<PostContentSkeleton />}>
            <PostContent slug={params.slug} />
          </Suspense>
        </article>

        <Suspense fallback={<PostCommentsSkeleton />}>
          <PostComments slug={params.slug} />
        </Suspense>
      </div>
    </div>
    </>
  )
}
