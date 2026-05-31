# 文章页面流式加载改造计划

## 目标
将 `app/blog/[slug]/page.tsx` 从一次性加载改为流式加载，提升用户感知性能。

## 当前问题
- `getPostBySlug` + `getAdjacentPosts` 都要 await 完才渲染
- 评论区 (`CommentSection`) 在同一个 Server Component 中，必须等所有数据加载完
- 用户看到的是骨架屏 → 完整页面，没有中间状态

## 改造方案

### 1. 拆分 Server Component
将 `page.tsx` 拆分成独立的 Server Component：

```
app/blog/[slug]/
├── page.tsx              # 主页面，使用 Suspense 包裹各部分
├── loading.tsx           # 全局骨架屏（已有）
├── PostHeader.tsx        # 标题、作者、标签（Server Component）
├── PostContent.tsx       # 正文内容（Server Component）
├── PostSidebar.tsx       # 目录、操作按钮（Server Component）
└── PostComments.tsx      # 评论区（Server Component）
```

### 2. Suspense 边界设计
```tsx
// page.tsx
<Suspense fallback={<HeaderSkeleton />}>
  <PostHeader slug={slug} />
</Suspense>

<Suspense fallback={<ContentSkeleton />}>
  <PostContent slug={slug} />
</Suspense>

<Suspense fallback={<CommentSkeleton />}>
  <PostComments slug={slug} />
</Suspense>
```

### 3. 加载顺序
1. **立即显示**：返回按钮、页面框架
2. **第一批**：标题、作者、标签（PostHeader）
3. **第二批**：正文内容（PostContent）
4. **第三批**：评论区、推荐文章（PostComments）

### 4. 实现细节

#### PostHeader.tsx
```tsx
import { getPostBySlug } from '@/lib/db'
import AuthorCard from '@/components/sections/AuthorCard'

export default async function PostHeader({ slug }: { slug: string }) {
  const post = await getPostBySlug(slug)
  if (!post) return null
  
  return (
    <header className="mb-12">
      <time className="text-blue-600 font-mono text-sm mb-4 block">
        {post.created_at.slice(0, 10)}
      </time>
      <h1 className="text-3xl md:text-4xl lg:text-[2.75rem] font-black tracking-tight leading-[1.15] text-gray-900 mb-8">
        {post.title}
      </h1>
      {post.author_name && (
        <AuthorCard
          name={post.author_name}
          avatar={post.author_avatar ?? null}
          bio={post.author_bio ?? null}
          authorId={post.author_id ?? null}
        />
      )}
      <p className="text-gray-500 text-lg leading-relaxed mb-8">
        {post.excerpt}
      </p>
      <div className="flex gap-3 flex-wrap">
        {post.tags.map(t => (
          <span key={t} className="px-3 py-1 bg-gray-100 text-gray-500 text-[10px] font-black uppercase tracking-widest rounded-md">
            {t}
          </span>
        ))}
      </div>
    </header>
  )
}
```

#### PostContent.tsx
```tsx
import { getPostBySlug } from '@/lib/db'
import TableOfContents from '@/components/sections/TableOfContents'
import AttachmentList from '@/components/sections/AttachmentList'

export default async function PostContent({ slug }: { slug: string }) {
  const post = await getPostBySlug(slug)
  if (!post) return null
  
  const isHtml = post.content.trimStart().startsWith('<')
  
  return (
    <>
      <TableOfContents contentSelector=".post-content, .space-y-5" />
      
      {isHtml ? (
        <div
          className="post-content"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      ) : (
        <div className="space-y-5">{renderMarkdown(post.content)}</div>
      )}
      
      <AttachmentList attachments={(post as any).attachments ?? []} />
    </>
  )
}
```

#### PostComments.tsx
```tsx
import { getPostBySlug, getAdjacentPosts } from '@/lib/db'
import CommentSection from '@/components/sections/CommentSection'
import PostActions from '@/components/sections/PostActions'
import ShareButtons from '@/components/sections/ShareButtons'
import PostNavigation from '@/components/sections/PostNavigation'

export default async function PostComments({ slug }: { slug: string }) {
  const [post, { prev, next }] = await Promise.all([
    getPostBySlug(slug),
    getAdjacentPosts(slug),
  ])
  
  if (!post) return null
  
  return (
    <>
      <div className="mt-16 pt-8 border-t border-gray-100">
        <PostActions slug={slug} />
        <ShareButtons title={post.title} slug={slug} />
      </div>
      
      <PostNavigation prev={prev} next={next} />
      
      <div className="mt-16">
        <CommentSection slug={slug} />
      </div>
    </>
  )
}
```

### 5. 骨架屏组件

#### HeaderSkeleton.tsx
```tsx
export function HeaderSkeleton() {
  return (
    <header className="mb-12 animate-pulse">
      <div className="h-4 w-28 bg-gray-200 rounded mb-4" />
      <div className="h-12 w-full bg-gray-200 rounded mb-2" />
      <div className="h-12 w-2/3 bg-gray-200 rounded mb-8" />
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-gray-200 rounded-full" />
        <div className="space-y-2">
          <div className="h-4 w-20 bg-gray-200 rounded" />
          <div className="h-3 w-32 bg-gray-200 rounded" />
        </div>
      </div>
      <div className="h-5 w-full bg-gray-200 rounded mb-2" />
      <div className="h-5 w-3/4 bg-gray-200 rounded mb-8" />
      <div className="flex gap-2">
        <div className="h-6 w-16 bg-gray-200 rounded-md" />
        <div className="h-6 w-20 bg-gray-200 rounded-md" />
      </div>
    </header>
  )
}
```

#### ContentSkeleton.tsx
```tsx
export function ContentSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-4 w-1/2 bg-gray-200 rounded mb-8" />
      <div className="space-y-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-4 w-full bg-gray-200 rounded" />
        ))}
      </div>
      <div className="h-40 w-full bg-gray-200 rounded my-8" />
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-4 w-full bg-gray-200 rounded" />
        ))}
      </div>
    </div>
  )
}
```

#### CommentSkeleton.tsx
```tsx
export function CommentSkeleton() {
  return (
    <div className="mt-16 animate-pulse">
      <div className="h-6 w-32 bg-gray-200 rounded mb-8" />
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex gap-3">
            <div className="w-9 h-9 bg-gray-200 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-24 bg-gray-200 rounded" />
              <div className="h-4 w-full bg-gray-200 rounded" />
              <div className="h-4 w-2/3 bg-gray-200 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

### 6. 优化点

#### 数据获取优化
- `getPostBySlug` 被调用多次（PostHeader、PostContent、PostComments）
- 可以使用 React 的 `cache` 函数或 Next.js 的 `unstable_cache` 来缓存结果
- 或者使用 DataLoader 模式批量获取

```tsx
// lib/db/cache.ts
import { cache } from 'react'
import { getPostBySlug } from './db'

export const getCachedPostBySlug = cache(getPostBySlug)
```

#### ViewTracker 和其他客户端组件
- `ViewTracker`、`CodeCopyButton`、`ImageLazyLoad` 等是客户端组件
- 可以放在 PostContent 或 PostComments 中，不需要单独 Suspense

### 7. 实施步骤

1. 创建新的 Server Component 文件
2. 修改 `page.tsx` 使用 Suspense
3. 测试加载顺序和骨架屏效果
4. 优化数据获取（可选）
5. 部署测试

### 8. 预期效果

- **第一次内容绘制**：骨架屏立即显示
- **标题出现**：~100ms（PostHeader 加载完成）
- **正文出现**：~200ms（PostContent 加载完成）
- **评论区出现**：~500ms（PostComments 加载完成）

用户不再需要等待所有数据加载完才能看到内容。

---

## 执行计划

使用 Claude Code 执行此改造：
```bash
cd /e/chromeDownload/arc-portfolio
claude -p "按照 STREAMING_PLAN.md 中的方案，将文章页面改造为流式加载。创建 PostHeader.tsx、PostContent.tsx、PostComments.tsx 等 Server Component，修改 page.tsx 使用 Suspense 包裹各部分。保持现有的样式和功能不变。" --allowedTools "Read,Write,Edit,Bash" --max-turns 35 --dangerously-skip-permissions
```
