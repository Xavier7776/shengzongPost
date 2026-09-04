# MindStack

一个基于 Next.js 14 (App Router) 构建的全栈站点，已从一个个人作品集/博客扩展为四条产品线：

1. **内容站** — 博客、作品、画廊、Skills 与 GitHub Trending、Now、Projects
2. **用户社区与积分商店** — 注册登录、关注、通知、编辑申请审核、积分与虚拟商品
3. **OnlyUs** — 带独立门禁的私密情侣应用（含 Web Push）
4. **Research Agent** — 多 Agent 协作的深度研究工作区

技术细节、开发约定与重构计划见 [AGENTS.md](./AGENTS.md)。

---

## 技术栈

| 层级 | 技术 |
| --- | --- |
| 框架 | Next.js 14 (App Router) |
| 语言 | TypeScript |
| 样式 | Tailwind CSS 3 |
| 主数据库 | Neon (PostgreSQL Serverless)，服务端直连，无 RLS |
| 认证数据库 | Supabase（`@supabase/ssr`），仅用于 OnlyUs 会话刷新 |
| 认证 | NextAuth.js v4（Credentials + GitHub OAuth，JWT） |
| 编辑器 | Tiptap + lowlight（代码高亮）；另用 `marked` 渲染 Markdown |
| 图片存储 | Cloudinary（通过自定义 `next/image` loader 自动 AVIF/WebP + 响应式） |
| 邮件服务 | Resend |
| AI 服务 | DeepSeek / Xiaomi MiMo / Gemini |
| 客户端状态 | zustand（目前仅 OnlyUs 使用） |
| 测试 | Vitest + Testing Library |
| 部署 | Vercel |

其他运行时依赖：`three`（3D）、`recharts`（图表）、`lucide-react`（图标）、`dayjs`、`qrcode.react`、`bcryptjs`。

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
- 头像上传（Cloudinary）
- 文章收藏、点赞/踩、评论（含 AI 自动评论）
- 关注/粉丝系统，互相关注标识
- **通知 `/notifications`** — 未读计数与批量已读
- **编辑中心 `/dashboard`** — 提交文章编辑申请，查看审核状态与历史
- **积分商店 `/shop`** — 用积分购买并装备光标特效、头像框、宠物；积分通过互动与每日签到获得
- **个人资料 `/profile` 与 `/profile/[userId]`** — 头像、简介、关注列表

### OnlyUs `/onlyus`

私密情侣应用。`middleware.ts` 对 `/onlyus/:path*` 做独立门禁：未通过校验一律重定向到 `/onlyus/gate`，通过后跳回原路径。

- 首页、心情、时间线、信件、愿望清单
- 小工具：日历、纪念日计数器、你画我猜、记账、五子棋、电影记录、宠物、问答、轮盘
- **Web Push** — 在 `/onlyus/settings` 订阅，由 `public/sw.js` 接收推送。
  该 Service Worker 只在订阅时注册，并显式排除 `/api`、`/admin`、`/dashboard`、`/profile`、`/onlyus` 等私有/动态路径，绝不会把用户私有数据写入 Cache Storage。
- 状态全部由 `stores/onlyus/*` 的 zustand store 管理

### Research Agent `/skills/research`

6 个 AI Agent 协同工作（浏览 → 规划 → 研究 → 撰写 → 审校 → 发布）。
通过 `/api/research/ws-url` 获取 WebSocket 地址，连接外部 GPT-Researcher / MindStack Research 后端（`GPT_RESEARCHER_URL` / `MINDSTACK_RESEARCH_URL`）。
研究报告落库，可在 `/api/research/reports` 与 `/api/research/reports/[id]` 读写。

### 管理员后台 `/admin`

- 文章管理（新建、编辑、发布/草稿切换、删除）
- AI 写作助手（生成草稿 / 续写 / 生成摘要，流式输出）
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
git clone https://github.com/your-username/arc-portfolio.git
cd arc-portfolio
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
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
RESEND_API_KEY=re_xxxxxxxxxxxx
EMAIL_FROM=MindStack <no-reply@your-domain.com>

# ── AI（按需，用哪个配哪个）───────────────────────────
XIAOMI_API_KEY=your-api-key
XIAOMI_BASE_URL=https://api.xiaomimimo.com/v1
MIMO_MODEL=mimo-v2.5-pro
GEMINI_API_KEY=your-api-key
GEMINI_BASE_URL=https://generativelanguage.googleapis.com/v1beta
GEMINI_MODEL=gemini-2.0-flash
# 触发 AI 自动评论的接口的共享密钥
AI_COMMENT_SECRET=any-random-string

# ── 爬虫（Skills / Trending 抓取脚本用）────────────────
# 提升 GitHub API 限额
GITHUB_TOKEN=ghp_xxxxxxxxxxxx

# ── Research Agent（外部研究后端）──────────────────────
GPT_RESEARCHER_URL=http://localhost:8000
NEXT_PUBLIC_GPT_RESEARCHER_URL=http://localhost:8000
MINDSTACK_RESEARCH_URL=http://localhost:8001

# ── OnlyUs ───────────────────────────────────────────
# 门禁口令的 bcrypt 哈希，用于签发 gate token
ONLYUS_PASSCODE_HASH=$2b$10$...
ONLYUS_GATE_SECRET=any-random-string
# Web Push 公钥（配合服务端 VAPID 私钥）
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-vapid-public-key
# 电影工具用 TMDB
NEXT_PUBLIC_TMDB_API_KEY=your-tmdb-key

# ── Supabase（OnlyUs 会话刷新）────────────────────────
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# ── 可选 ─────────────────────────────────────────────
# 访客统计里 IP 哈希的盐
ANALYTICS_IP_SALT=any-random-string
# 管理员接口的备用密钥
ADMIN_API_KEY=any-random-string
```

### 3. 初始化数据库

迁移文件统一放在 `supabase/migrations/`（32 个）。按顺序用脚本应用到 Neon：

```bash
node scripts/apply-migration.mjs supabase/migrations/schema.sql
node scripts/apply-migration.mjs supabase/migrations/migration.sql
# …依次应用其余迁移
```

脚本会读取 `.env.local` 并按 `;` 拆分执行，单条失败会继续并汇总。

### 4. 启动

```bash
npm run dev
```

访问 <http://localhost:3000>

### 脚本

```bash
npm run dev         # 开发服务器
npm run build       # 生产构建
npm run start       # 启动构建产物
npm run lint        # next lint
npm test            # vitest run
npm run test:watch

# 数据抓取（需配置 GITHUB_TOKEN 与 DATABASE_URL）
npx tsx scripts/crawl-skills.ts
npx tsx scripts/crawl-trending.ts
```

> **Windows 构建**：若 `npm run build` 报 `EPERM: operation not permitted, scandir '...\AppData\Local\Temp\LISF_*.tmp'`，
> 是 `TMP` 指向系统临时目录导致的环境问题，非代码问题。绕法：
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
arc-portfolio/
├── app/
│   ├── (main)/               前台主布局下的页面
│   │   ├── page.tsx          首页
│   │   ├── blog/             博客列表 & 文章详情
│   │   ├── work/             作品详情 & PDF
│   │   ├── gallery/          图片画廊
│   │   ├── projects/         项目展示
│   │   ├── skills/           Skills + Trending，以及 research/ 研究工作区
│   │   ├── shop/             积分商店
│   │   ├── now/              Now 页面
│   │   ├── search/           搜索
│   │   └── notifications/    通知
│   ├── profile/              用户资料 & 关注列表
│   ├── dashboard/            用户编辑中心
│   ├── admin/                管理员后台（含 analytics、shop）
│   ├── onlyus/               私密情侣应用（middleware 独立门禁）
│   ├── api/                  接口路由
│   ├── feed.xml/             RSS
│   └── sitemap.ts / robots.txt
├── components/               共享 UI（ui / layout / sections / admin / shop …）
├── lib/
│   ├── db/                   数据访问层，按域拆分（posts, comments, points, …）
│   ├── db.ts                 仅作为 lib/db/* 的 barrel 重新导出
│   ├── db-search.ts / db-skills.ts / db-trending.ts / db-works.ts
│   │                         尚未迁入 db/，计划合入
│   ├── auth.ts / authOptions.ts / onlyus-gate.ts   认证与门禁
│   ├── data.ts               静态兜底数据（Hero 降级用，勿整体删除）
│   ├── cloudinary*.ts        图片上传与 next/image loader
│   ├── email.ts / uploadLarge.ts / rate-limit.ts / site-url.ts
│   └── push.ts               Web Push 订阅
├── stores/onlyus/            zustand store
├── scripts/                  迁移应用与爬虫脚本
├── supabase/migrations/      32 个 SQL 迁移
└── __tests__/                Vitest 用例
```

> `features/` 目录尚不存在。当前重构的目标是把 `app/` 收敛为薄路由，
> 业务收敛到 `features/{blog,work,gallery,editor,profile,community,shop,research,onlyus}`，
> 通用能力到 `shared/{ui,markdown,auth,upload,validation}`，详见 AGENTS.md。

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
| OnlyUs | 需通过门禁口令 | 需通过门禁口令 | 需通过门禁口令 |

---

## License

MIT
