// 路径：app/blog/[slug]/page.tsx
import { notFound } from 'next/navigation'
import { cache, Suspense } from 'react'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { getPostBySlug as readPublishedPost, getAdjacentPosts } from '@/lib/db'
import ReadingProgressBar from '@/components/sections/ReadingProgressBar'
import KeyboardShortcuts from '@/components/sections/KeyboardShortcuts'
import ReadingHistory from '@/components/sections/ReadingHistory'
import { Skeleton, SkeletonText } from '@/components/ui/Skeleton'
import PostHeader from './PostHeader'
import PostContent from './PostContent'
import PostComments from './PostComments'
import ReaderSources from './ReaderSources'
import LearnToc from './LearnToc'
import type { Metadata } from 'next'
import { getSiteUrl } from '@/lib/site-url'
import { breadcrumbs, jsonLdText } from '@/lib/seo'

export const revalidate = 60 // ISR plus explicit publication-path invalidation.
export const fetchCache = 'default-cache'

interface PageProps { params: Promise<{ slug: string }> }

// Metadata and the page share one published lookup within each render request.
const getPostBySlug = cache(readPublishedPost)

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const post = await getPostBySlug(slug)
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

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params
  const [post, { prev, next }] = await Promise.all([
    getPostBySlug(slug),
    getAdjacentPosts(slug),
  ])
  if (!post) notFound()
  const isLearnPost = /^daily-learn-\d{4}-\d{2}-\d{2}$/.test(slug)

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
      '@id': getSiteUrl()+'/blog/'+encodeURIComponent(slug),
    },
    keywords: post.tags?.join(', '),
  }

  return (
    <>
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: jsonLdText([jsonLd,breadcrumbs([{name:'首页',path:'/'},{name:'博客',path:'/blog'},{name:post.title,path:'/blog/'+encodeURIComponent(slug)}])]) }}
    />
    <ReadingProgressBar />
    <KeyboardShortcuts prevSlug={prev?.slug} nextSlug={next?.slug} />
    <ReadingHistory slug={slug} title={post.title} />

    <div className="technical-reader-page">
      <LearnToc study={isLearnPost} />
      <div className="technical-reader-layout">
        <div className="reader-article-column" id="blog-reader-root">
          <nav className="reader-breadcrumb" aria-label="文章位置"><Link href="/blog">博客</Link><ChevronRight size={13} aria-hidden="true" /><span>{isLearnPost ? '技术精读' : post.tags[0] || '技术随笔'}</span></nav>
          <article className="technical-reader-article">
            <PostHeader post={post} variant={isLearnPost ? 'learn' : 'standard'} />
            <Suspense fallback={<PostContentSkeleton />}>
              <PostContent post={post} />
            </Suspense>
          </article>
          <PostComments post={post} prev={prev} next={next} />
          <p className="reader-correction"><a href={'mailto:1808571411@qq.com?subject='+encodeURIComponent('文章勘误：'+slug)+'&body='+encodeURIComponent('文章：/blog/'+slug+'\n具体段落或数值：\n问题与原始来源：\n建议更正：')}>发现错误 / 提交勘误</a><span>请注明段落、问题和原始依据。</span></p>
        </div>
        <ReaderSources />
      </div>
    </div>
    </>
  )
}
