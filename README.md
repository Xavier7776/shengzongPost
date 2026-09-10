# MindStack — 个人作品集与博客系统

一个基于 Next.js 14 构建的全栈个人作品集与博客系统：Markdown 写作、图片管理、用户社区互动、AI 辅助写作与多角色内容审核工作流；此外内含一个独立的情侣空间子应用 `onlyus`。

------

## 技术栈

| 层级 | 技术 |
| --- | --- |
| 框架 | Next.js 14（App Router） |
| 语言 | TypeScript 5（strict） |
| 样式 | Tailwind CSS 3 |
| 数据库（主站） | **Neon**（PostgreSQL Serverless），经 `@neondatabase/serverless` |
| 数据库（onlyus） | **Supabase**（客户端直连 + RLS） |
| 认证 | NextAuth v4（Credentials + GitHub OAuth） |
| 编辑器 | Tiptap 3 |
| 图片存储 | Cloudinary（自定义 loader，自动 AVIF/WebP） |
| 邮件服务 | Resend |
| AI 服务 | 小米 **MiMo**（`mimo-v2.5-pro`）为主；另有 **Gemini**（`gemini-3.5-flash`）作为编辑器可选写作品道 |
| 状态管理 | Zustand 5（仅 `onlyus`） |
| 图表 / 3D | Recharts / three.js |
| 测试 | Vitest + Testing Library |
| 部署 | Vercel |

> **双数据库架构**：主站（博客/作品集）用 Neon；`onlyus` 情侣空间用 Supabase。两者数据完全隔离，不共享表，不能跨库 JOIN。

------

## 功能概览

### 前台页面

- **首页** — 数据库驱动的全宽轮播 Hero，最近博文卡片（封面图 + Card3D 效果），精选 Skills 与项目
- **博客** — 文章列表（按标签筛选），Markdown 正文渲染，阅读计数，点赞/踩/收藏，评论区，目录（TOC），阅读进度条
- **作品** — `/work` 列表与 `/work/[slug]` 详情，支持导出 PDF（`/work/[slug]/pdf`）
- **项目** — 项目介绍卡片，技术栈标签，GitHub / Demo 链接
- **Gallery** — 分类图片瀑布流，Lightbox 与 FilmStrip 效果
- **热门 Skills** — 从 GitHub 爬取的 AI Agent Skills（筛选、排序、详情页）与 GitHub Trending 排行
- **深度研究** — `/skills/research` 多 Agent 协作研究面板
- **商店** — `/shop` 光标特效与头像框，积分兑换
- **搜索** — `/search` 全站搜索
- **用户资料** — 头像、简介编辑，关注/粉丝系统
- **联系表单** — 邮件发送（Resend）

### 用户功能

- 邮箱注册 + 邮件验证激活
- GitHub OAuth 登录（仅限管理员账号）
- 头像上传（Cloudinary）
- 文章收藏、点赞/踩、评论（含楼中楼与 AI 自动评论）
- 关注其他用户、通知中心
- **编辑中心** `/dashboard` — 提交文章编辑申请，查看审核状态与历史

### 管理员后台 `/admin`

> ⚠️ 后台目前无全局导航入口，需手动访问 `/admin/login` 通过 GitHub OAuth 进入。

- 文章管理（新建、编辑、发布/草稿切换、删除）
- AI 写作助手（生成草稿 / 续写 / 生成摘要，流式输出）
- 封面图上传、正文插图、博文插图管理
- 评论审核、编辑申请审核（对比内容后一键批准/拒绝）
- 项目 / Gallery / 首页轮播 / 商店（光标与头像框）管理
- 访问统计看板（`/admin/analytics`）

### 情侣空间 `onlyus`

独立子应用，拥有自己的布局、认证与数据库：首页、时光轴、心情、信件、清单、纪念日、以及一组小工具（日历、记账、五子棋、抽签、电影、宠物、答题、你画我猜）。

------

## 本地开发

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

在项目根目录新建 `.env.local`：

```env
# ── 主站数据库：Neon ──
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require

# ── NextAuth ──
NEXTAUTH_SECRET=your-random-secret-string
NEXTAUTH_URL=http://localhost:3000

# ── GitHub OAuth（在 GitHub Developer Settings 创建 OAuth App）──
GITHUB_ID=your-github-client-id
GITHUB_SECRET=your-github-client-secret
ADMIN_GITHUB_USERNAME=your-github-username   # 仅该账号可通过 GitHub OAuth 登录后台

# ── 邮件服务 Resend ──
RESEND_API_KEY=re_xxxxxxxxxxxx

# ── Cloudinary 图片存储 ──
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# ── AI 服务：小米 MiMo ──
XIAOMI_API_KEY=your-api-key
XIAOMI_BASE_URL=https://api.xiaomimimo.com/v1
MIMO_MODEL=mimo-v2.5-pro
AI_COMMENT_SECRET=any-random-string

# ── AI 写作备用通道：Gemini（可选）──
GEMINI_API_KEY=your-gemini-key

# ── 爬虫脚本（crawl:skills / crawl:trending）──
GITHUB_TOKEN=ghp_xxxxxxxxxxxx

# ── onlyus 情侣空间 ──
ONLYUS_GATE_SECRET=any-random-string
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. 初始化数据库

- **主站（Neon）**：在 Neon 控制台 SQL Editor 中执行建表 SQL。
- **onlyus（Supabase）**：见 `supabase/migrations/`。

> ⚠️ **注意**：迁移文件编号存在断层（`010`–`031` 缺失，现有 `migration.sql`+`_002~_009` 与 `032~053` 两套并行系列），**全新环境目前无法从零完整重建数据库**。详见 `docs/项目整理计划-2026-09-10.md`。

### 4. 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000/)

------

## 常用命令

| 命令 | 作用 |
| --- | --- |
| `npm run dev` | 开发服务器 |
| `npm run build` | 生产构建 |
| `npm run start` | 启动生产服务 |
| `npm run typecheck` | 类型检查（`tsc --noEmit`） |
| `npm run lint` | ESLint |
| `npm test` | Vitest 单元测试 |
| `npm run crawl:skills` | 爬取 GitHub AI Agent Skills → Neon |
| `npm run crawl:trending` | 爬取 GitHub Trending → Neon |
| `npm run db:apply` | 应用数据库迁移 |
| `npm run cursor:fetch` | 下载光标精灵图 / 海报资源 |

> 爬虫按 `AGENTS.md` 的历史约定应在**每天 10:00** 运行，但当前**未挂载任何调度器**，需手动执行或自行配置定时任务。

------

## 部署到 Vercel

1. 将项目推送到 GitHub
2. 在 [Vercel](https://vercel.com/) 中 Import 该仓库
3. 在 Vercel 项目设置的 **Environment Variables** 中填入所有 `.env.local` 变量（`NEXTAUTH_URL` 改为生产域名）
4. 在 GitHub OAuth App 的 **Authorization callback URL** 中添加：`https://your-domain.com/api/auth/callback/github`

------

## 项目结构

```
app/
├── page.tsx                    # 首页
├── blog/                       # 博客列表 & 文章详情（含 TOC、评论、OG 图）
├── work/                       # 作品列表 & 详情（含 PDF 打印页）
├── projects/                   # 项目展示
├── gallery/                    # 图片画廊
├── skills/                     # AI Skills / Trending / research 深度研究
├── shop/                       # 光标 & 头像框商店
├── search/                     # 搜索
├── profile/                    # 用户资料 & 关注列表
├── dashboard/                  # 用户编辑中心
├── notifications/              # 通知中心
├── login/ register/ verify/    # 认证流程
├── admin/                      # 管理后台（无全局入口）
├── onlyus/                     # 情侣空间子应用（独立布局与认证）
└── api/                        # REST 路由
    ├── posts/ comments/ reactions/ bookmarks/ follows/    # 主站内容与社交
    ├── skills/ trending/ research/                        # 爬取内容与深度研究
    ├── gallery/ slides/ projects/ shop/                   # 媒体与商店
    ├── ai/                                                # AI 写作与评论
    ├── analytics/ notifications/ newsletter/ points/      # 运营
    ├── user/ auth/                                        # 用户与认证
    ├── og/ download/ upload-md/ feed.xml/                 # 元数据与导出
    └── admin/                                             # 后台专用接口
components/
├── admin/          # 后台组件（PostEditor、shop 管理）
├── dashboard/      # 用户编辑器（UserPostEditor）
├── layout/         # Navbar、SiteShell、UserMenu、NotificationBell
├── sections/       # 页面区块（BlogCard、HeroClient、SkillCard、TrendingCard…）
├── ui/             # 基础组件（Card3D、BackToTop、Skeleton、AvatarFrame…）
├── shop/           # 商店前台组件
└── onlyus/         # 情侣空间专用组件
lib/
├── db.ts           # Neon 数据访问 barrel → lib/db/*
├── db/             # 分领域数据访问（posts、users、comments、shop…）
├── db-skills.ts    # ⚠️ 以下 4 个尚未归入 db/，命名体系待统一
├── db-trending.ts
├── db-works.ts
├── db-search.ts
├── auth.ts / authOptions.ts
├── supabase-client.ts   # Supabase 客户端（onlyus 专用）
├── hooks.ts        # 自定义 Hooks
└── email.ts        # 邮件发送
stores/onlyus/      # Zustand stores（仅 onlyus）
scripts/            # 爬虫与运维脚本
supabase/           # 迁移 + Edge Functions（仅 onlyus）
```

项目整理计划与历史审计结论见 `docs/项目整理计划-2026-09-10.md`。

------

## 角色权限

| 功能 | 游客 | 登录用户 | 管理员 |
| --- | --- | --- | --- |
| 浏览文章 / Gallery / Skills | ✅ | ✅ | ✅ |
| 评论、点赞、收藏 | ❌ | ✅ | ✅ |
| 关注其他用户 | ❌ | ✅ | ✅ |
| 提交文章编辑申请 | ❌ | ✅ | ✅ |
| 新建 / 删除文章 | ❌ | ❌ | ✅ |
| 审核评论 & 编辑申请 | ❌ | ❌ | ✅ |
| Gallery / 轮播 / 商店管理 | ❌ | ❌ | ✅ |

> `onlyus` 情侣空间独立于上表，由 `ONLYUS_GATE_SECRET` 签发的 Cookie 保护（见 `lib/onlyus-gate.ts` 与 `middleware.ts`）。

------

## License

MIT
