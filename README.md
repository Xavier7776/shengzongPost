# MindStack

一个基于 Next.js 16 (App Router) 构建的全栈站点，已从一个个人作品集/博客扩展为三条产品线：

1. **内容站** — 博客、作品、画廊、Skills 与 GitHub Trending、Now、Projects
2. **用户社区与积分商店** — 注册登录、关注、通知、编辑申请审核、积分与虚拟商品
3. **Research Agent** — 多 Agent 协作的深度研究工作区

技术细节、开发约定与重构计划见 [AGENTS.md](./AGENTS.md)。

---

## 技术栈

| 层级 | 技术 |
| --- | --- |
| 框架 | Next.js 16 (App Router) |
| 语言 | TypeScript |
| 样式 | Tailwind CSS 3 |
| 主数据库 | Neon (PostgreSQL Serverless)，服务端直连；博客授权不依赖历史 RLS |
| 认证 | NextAuth.js v4（Credentials + GitHub OAuth，JWT） |
| 编辑器 | Tiptap + lowlight（代码高亮）；另用 `marked` 渲染 Markdown |
| 图片与附件 | GitHub 独立资源分支，固定 Commit SHA 的 Raw URL；图片使用 Next 内置优化 |
| 邮件服务 | Resend |
| 每日精读生产 | GitHub Actions 外部 OpenAI API；网站本身不含 AI 模型推理 |
| 测试 | Vitest + Testing Library |
| 部署 | Vercel |

其他运行时依赖：`three`（3D）、`recharts`（图表）、`lucide-react`（图标）、`qrcode.react`、`bcryptjs`。

---

## 功能概览

### 内容站

- **首页 `/`** — 数据库驱动的全宽轮播 Hero（数据库不可用时降级到 `lib/data.ts` 的静态兜底），最近博文卡片，精选项目
- **博客 `/blog`** — 文章列表（按标签筛选）、Markdown 正文、阅读计数、点赞/踩/收藏、楼中楼评论
- **作品 `/work`** — 作品详情（`/work/[slug]`）、PDF 版本（`/work/[slug]/pdf`）、动态 OG 图
- **画廊 `/gallery`** — 分类图片瀑布流，点赞
- **Projects `/projects`** — 项目卡片、技术栈标签、GitHub / Demo 链接
- **Skills `/skills`** — AI Agent Skills 列表（`/skills/[slug]` 详情页）+ GitHub Trending；按 5 类分类（coding / research / creative / automation / productivity），关键词自动分类，按 `source_url` 去重，ISR 60 秒
- **Now `/now`** — nownownow.com 惯例的「最近在做什么」
- **Newsletter** — 邮件订阅
- **SEO** — `/sitemap.xml`、`/robots.txt`、`/feed.xml`

### 用户社区与积分商店

- 邮箱注册 + 邮件验证激活；GitHub OAuth 登录（仅限管理员账号）
- 头像上传（GitHub）
- 文章收藏、点赞/踩、评论（人工审核）
- 关注/粉丝系统，互相关注标识
- **通知 `/notifications`** — 未读计数与批量已读
- **编辑中心 `/dashboard`** — 提交文章编辑申请，查看审核状态与历史
- **积分商店 `/shop`** — 用积分购买并装备光标特效、头像框、宠物；积分通过互动与每日签到获得
- **个人资料 `/profile` 与 `/profile/[userId]`** — 头像、简介、关注列表

### Research Agent `/skills/research`

6 个 AI Agent 协同工作（浏览 → 规划 → 研究 → 撰写 → 审校 → 发布）。
通过 `/api/research/ws-url` 获取 WebSocket 地址，连接外部 GPT-Researcher / MindStack Research 后端（`GPT_RESEARCHER_URL` / `MINDSTACK_RESEARCH_URL`）。
研究报告落库，可在 `/api/research/reports` 与 `/api/research/reports/[id]` 读写。

### 管理员后台 `/admin`

- 文章管理（新建、编辑、发布/草稿切换、删除）
- 封面图与正文插图上传
- 评论审核（待审核红点提醒）
- **编辑审核 `/admin/reviews`** — 对比用户提交的修改请求，一键批准或拒绝，批准后自动更新文章
- Gallery 图片管理、首页轮播管理 `/admin/slides`、博文插图管理、Projects 管理
- **商店管理 `/admin/shop`** — 光标特效、头像框、宠物的上下架与导入
- 用户管理 `/admin/users`、流量分析 `/admin/analytics`

---

## 本地开发

### 1. 安装

```bash
git clone https://github.com/Xavier7776/shengzongPost.git
cd shengzongPost
npm install
```

### 2. 配置环境变量

在项目根目录新建 `.env.local`（该文件已被 `.gitignore` 忽略，切勿提交）：

```env
# ── 必需 ──────────────────────────────────────────────
# Neon 数据库（主库，所有业务表）
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require

# 站点根 URL（不配则回退 localhost，会导致 SEO 与邮件链接异常）
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# ── NextAuth ──────────────────────────────────────────
NEXTAUTH_SECRET=your-random-secret-string
NEXTAUTH_URL=http://localhost:3000

# GitHub OAuth（在 GitHub Developer Settings 创建 OAuth App）
GITHUB_ID=your-github-client-id
GITHUB_SECRET=your-github-client-secret
# 只有该 GitHub 用户名可通过 OAuth 登录
ADMIN_GITHUB_USERNAME=your-github-username

# ── 图片与邮件 ────────────────────────────────────────
# Fine-grained Token：仅选此仓库，Contents: Read and write，保存在服务端
GITHUB_ASSET_TOKEN=your-fine-grained-github-token
GITHUB_ASSET_REPOSITORY=Xavier7776/shengzongPost
GITHUB_ASSET_BRANCH=assets/daily-learn-covers-20261111
# 历史图片只读兼容，无需原上传服务的 API Key 或 Secret
LEGACY_CLOUDINARY_CLOUD_NAMES=dazxe954m
RESEND_API_KEY=re_xxxxxxxxxxxx
EMAIL_FROM=MindStack <no-reply@your-domain.com>

# ── 文章发布（不调用模型）─────────────────────────────
# Vercel 与 GitHub Actions 共享的发布签名密钥
LEARN_PUBLISH_SECRET=at-least-32-characters-of-random-secret

# ── 爬虫（Skills / Trending 抓取脚本用）────────────────
# 提升 GitHub API 限额
GITHUB_TOKEN=ghp_xxxxxxxxxxxx

# ── Research Agent（外部研究后端）──────────────────────
GPT_RESEARCHER_URL=http://localhost:8000
NEXT_PUBLIC_GPT_RESEARCHER_URL=http://localhost:8000
MINDSTACK_RESEARCH_URL=http://localhost:8001

# ── 可选 ─────────────────────────────────────────────
# 访客统计里 IP 哈希的盐
ANALYTICS_IP_SALT=any-random-string
# 管理员接口的备用密钥
ADMIN_API_KEY=any-random-string
```

上传到 GitHub 后，数据库保存固定 Commit SHA 的 Raw URL，资源更新不会覆盖历史文章的图片。
删除素材会移除数据库记录和资源分支条目，Git 历史中的固定链接仍可能可访问。
历史图片保留只读兼容，无需配置旧上传服务的密钥。GitHub Token 过期后需更新
`.env.local` 的 `GITHUB_ASSET_TOKEN`；部署时同步配置到服务器环境。

开发和启动脚本启用 Node 的系统环境代理支持，沿用已有的 `HTTP_PROXY`、`HTTPS_PROXY`、
`NO_PROXY`，便于本机访问 GitHub 和邮件接口。

### 3. 初始化数据库

博客增量迁移保留在 `supabase/migrations/`。现有历史迁移不完整，不要混排后用于从零建库。
全新空白隔离库使用 `docs/data/neon-public-baseline.sql`，恢复流程见
[`docs/data/backup-restore-runbook.md`](docs/data/backup-restore-runbook.md)。已有数据库无需为本地启动重新迁移。

### 4. 启动

```bash
npm run dev
```

访问 <http://localhost:3000>

### 脚本

```bash
npm run dev            # 开发服务器
npm run build          # 生产构建
npm run start          # 启动构建产物
npm run lint           # ESLint CLI
npm run typecheck      # tsc --noEmit（含 scripts/）
npm test               # vitest run
npm run test:watch

# 数据抓取（需配置 GITHUB_TOKEN 与 DATABASE_URL）
npm run crawl:skills
npm run crawl:trending

# 数据库迁移 / 素材抓取
npm run db:apply <migration-file>
npm run cursor:fetch
```

> **Windows 构建**：若 `npm run build` 报 `EPERM: ... scandir '...\AppData\Local\Temp\LISF_*.tmp'`
> 或 `glob error [EACCES: ... scandir '...\AppData\Local\Temp\socket_*']`，
> 都是 `TMP` 指向系统临时目录导致的环境问题（webpack 扫到了其他进程的临时文件），非代码问题。绕法：
> `mkdir -p .tmpbuild && TMP="$PWD/.tmpbuild" TEMP="$PWD/.tmpbuild" npx next build`

---

## 部署到 Vercel

1. 将项目推送到 GitHub
2. 在 [Vercel](https://vercel.com/) 中 Import 该仓库
3. 在 Vercel 项目设置的 **Environment Variables** 中填入所有 `.env.local` 中的变量
   （`NEXT_PUBLIC_SITE_URL` 改为生产域名；`NEXTAUTH_URL` 若未设，会由 `lib/site-url.ts` 回退到 Vercel 生产域名）
4. 在 GitHub OAuth App 的 **Authorization callback URL** 中添加：`https://your-domain.com/api/auth/callback/github`

---

## 项目结构

```
shengzongPost/
├── app/                      路由（App Router，无路由组）
│   ├── page.tsx              首页
│   ├── blog/                 博客列表 & 文章详情
│   ├── work/                 作品详情 & PDF
│   ├── gallery/              图片画廊
│   ├── projects/             项目展示
│   ├── skills/               Skills + Trending，以及 research/ 研究工作区
│   ├── shop/                 积分商店
│   ├── now/                  Now 页面
│   ├── search/               搜索
│   ├── notifications/        通知
│   ├── login/ register/ verify/   登录注册与邮箱验证
│   ├── profile/              用户资料 & 关注列表
│   ├── dashboard/            用户编辑中心
│   ├── admin/                管理员后台（含 analytics、shop、reviews、slides）
│   ├── api/                  接口路由
│   ├── feed.xml/             RSS
│   └── sitemap.ts / robots.ts
├── components/               博客侧共享 UI（ui / layout / sections / admin / shop …）
├── features/                 业务模块（模块内自带 components / stores / lib）
│   ├── editor/               编辑器内核（与业务无关，可复用）
│   ├── admin-posts/          管理端发文（AdminPostEditor / AttachmentsPanel）
│   ├── submissions/          用户投稿发文（UserPostEditor）
│   ├── profile/              用户资料与设置
│   └── research/             研究工作台
├── lib/                      博客侧数据访问与工具
│   ├── db/                   数据访问层，按域拆分（posts, comments, points, …）
│   ├── db.ts                 仅作为 lib/db/* 的 barrel 重新导出
│   ├── db-search.ts / db-skills.ts / db-trending.ts / db-works.ts
│   │                         尚未迁入 db/，计划合入
│   ├── auth.ts / authOptions.ts   认证
│   ├── data.ts               静态兜底数据（Hero 降级用，勿整体删除）
│   ├── github-assets.ts      GitHub 图片/附件存储（固定 Commit SHA URL）
│   └── email.ts / uploadLarge.ts / rate-limit.ts / site-url.ts
├── shared/                   跨模块通用能力（hooks.ts / ui/SpriteCanvas.tsx）
├── scripts/                  迁移应用与爬虫脚本
├── supabase/migrations/      博客历史增量迁移（沿用目录名）
└── __tests__/                Vitest 用例
```

> `features/` 已建立（`editor` / `admin-posts` / `submissions` / `profile` / `research`），`shared/` 已启用。
> 当前重构的目标是把 `app/` 收敛为薄路由，业务收敛到
> `features/{blog,work,gallery,editor,profile,community,shop,research}`，
> 通用能力到 `shared/{ui,markdown,auth,upload,validation}`，详见 AGENTS.md。
>
---

## 角色权限

| 功能 | 游客 | 登录用户 | 管理员 |
| --- | --- | --- | --- |
| 浏览文章 / Gallery / Skills | ✅ | ✅ | ✅ |
| 评论、点赞、收藏 | ❌ | ✅ | ✅ |
| 关注其他用户 | ❌ | ✅ | ✅ |
| 提交文章编辑申请 | ❌ | ✅ | ✅ |
| 积分商店购买与装备 | ❌ | ✅ | ✅ |
| 新建 / 删除文章 | ❌ | ❌ | ✅ |
| 审核评论 & 编辑申请 | ❌ | ❌ | ✅ |
| Gallery / 轮播 / 商店管理 | ❌ | ❌ | ✅ |

---

## License

MIT

## 每日精读生产与发布

博客 Web 进程只承担文章展示、手动编辑、人工评论审核与带签名的精读发布接口。外部 `GitHub Actions` 使用 OpenAI API 生成结构化文章，数据通过 `POST /api/internal/learn/publish` 提交；Web 端不需要、也不应部署任何模型 API Key。`GitHub Actions Secrets` 需配置 `OPENAI_API_KEY` 与 `LEARN_PUBLISH_SECRET`，变量需配置 `LEARN_SITE_URL`，可选 `OPENAI_MODEL`。详见 [`docs/daily-learn-autopublish.md`](docs/daily-learn-autopublish.md)。
