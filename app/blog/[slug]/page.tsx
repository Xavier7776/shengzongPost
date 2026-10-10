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
import BlogReaderToolbar from './BlogReaderToolbar'
import BlogToc from './BlogToc'
import LearnToc from './LearnToc'
import type { Metadata } from 'next'
import { getSiteUrl } from '@/lib/site-url'
import { breadcrumbs, jsonLdText } from '@/lib/seo'

export const revalidate = 60 // ISR plus explicit publication-path invalidation.

interface PageProps { params: { slug: string } }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const post = await getPostBySlug(params.slug)
  if (!post) notFound()
  // opengraph-image.tsx 会被 Next.js 自动识别为 OG 图片，无需在此设置 openGraph.images
  // 这里仅补充 openGraph.type / twitter card，让社交分享元数据更完整
  return {
    title: `${post.title} — ARC.`,
    description: post.excerpt,
    alternates: { canonical: '/blog/'+encodeURIComponent(post.slug) },
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.excerpt ?? '',
      publishedTime: post.created_at,
      modifiedTime: post.updated_at,
      authors: post.author_name ? [post.author_name] : [],
      tags: post.tags ?? [],
      url: '/blog/'+encodeURIComponent(post.slug),
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt ?? '',
    },
  }
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
  const isLearnPost = /^daily-learn-\d{4}-\d{2}-\d{2}$/.test(params.slug)

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
      logo: { '@type': 'ImageObject', url: getSiteUrl()+'/logo.png' },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': getSiteUrl()+'/blog/'+encodeURIComponent(params.slug),
    },
    keywords: post.tags?.join(', '),
  }

  return (
    <>
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: jsonLdText([jsonLd,breadcrumbs([{name:'首页',path:'/'},{name:'博客',path:'/blog'},{name:post.title,path:'/blog/'+encodeURIComponent(params.slug)}])]) }}
    />
    <ReadingProgressBar />
    <KeyboardShortcuts prevSlug={prev?.slug} nextSlug={next?.slug} />
    <BackToTop />
    <ReadingHistory slug={params.slug} title={post.title} />

    <div className={isLearnPost ? 'learn-post-page min-h-screen pb-20 pt-24' : 'min-h-screen pt-24 pb-16'}>
      {isLearnPost ? (
        <div className="learn-page-container">
          <Link href="/blog" className="mb-8 inline-flex items-center text-xs font-bold text-gray-600 transition-colors hover:text-blue-600">
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回博客列表
          </Link>
          <div className="learn-post-grid">
            <div className="learn-post-main min-w-0" id="blog-reader-root">
              <article>
                <Suspense fallback={<PostHeaderSkeleton />}>
                  <PostHeader slug={params.slug} variant="learn" />
                </Suspense>
                <BlogReaderToolbar variant="learn" />
                <Suspense fallback={<PostContentSkeleton />}>
                  <PostContent slug={params.slug} />
                </Suspense>
              </article>
              <Suspense fallback={<PostCommentsSkeleton />}>
                <PostComments slug={params.slug} />
              </Suspense>
            </div>
            <LearnToc />
          </div>
        </div>
      ) : (
        <>
          <BlogToc />
          <div className="mx-auto max-w-[900px] px-6 lg:px-8" id="blog-reader-root">
            <Link href="/blog" className="group mb-12 inline-flex items-center text-xs font-bold uppercase tracking-widest text-gray-600 transition-colors hover:text-blue-600">
              <ArrowLeft className="mr-2 h-4 w-4 transition-transform duration-300 group-hover:-translate-x-2" />
              返回博客列表
            </Link>
            <article>
              <Suspense fallback={<PostHeaderSkeleton />}>
                <PostHeader slug={params.slug} />
              </Suspense>
              <BlogReaderToolbar />
              <Suspense fallback={<PostContentSkeleton />}>
                <PostContent slug={params.slug} />
              </Suspense>
            </article>
            <Suspense fallback={<PostCommentsSkeleton />}>
              <PostComments slug={params.slug} />
            </Suspense>
          </div>
        </>
      )}
      <p className="mx-auto mt-10 max-w-[900px] px-6 text-sm text-gray-500"><a className="text-blue-700 underline" href={'mailto:1808571411@qq.com?subject='+encodeURIComponent('文章勘误：'+params.slug)+'&body='+encodeURIComponent('文章：/blog/'+params.slug+'\n具体段落或数值：\n问题与原始来源：\n建议更正：')}>发现错误 / 提交勘误</a> · 请注明段落、问题和原始依据。</p>
    </div>
    </>
  )
}
