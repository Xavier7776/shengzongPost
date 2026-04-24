# 

一个基于 Next.js 14 构建的全栈个人作品集与博客系统，支持 Markdown 写作、图片管理、用户社区互动、AI 辅助写作及多角色内容审核工作流。

------

## 技术栈

| 层级     | 技术                                         |
| -------- | -------------------------------------------- |
| 框架     | Next.js 14 (App Router)                      |
| 语言     | TypeScript                                   |
| 样式     | Tailwind CSS                                 |
| 数据库   | Neon (PostgreSQL Serverless)                 |
| 认证     | NextAuth.js v4（Credentials + GitHub OAuth） |
| 图片存储 | Cloudinary                                   |
| 邮件服务 | Resend                                       |
| AI 服务  | DeepSeek API                                 |
| 图标库   | Lucide React                                 |
| 部署     | Vercel                                       |

------

## 功能概览

### 前台页面

- **首页** — 数据库驱动的全宽轮播 Hero，最近博文卡片（封面图 + Card3D 效果），精选项目展示
- **博客** — 文章列表（按标签筛选），Markdown 正文渲染，阅读计数，点赞/踩/收藏，评论区
- **Gallery** — 分类图片瀑布流，FilmStrip 动态效果
- **Projects** — 项目介绍卡片，技术栈标签，GitHub / Demo 链接
- **用户资料** — 头像、简介编辑，关注/粉丝系统，互相关注标识
- **联系表单** — 邮件发送（Resend）

### 用户功能

- 邮箱注册 + 邮件验证激活
- GitHub OAuth 登录（仅限管理员账号）
- 头像上传（Cloudinary）
- 文章收藏、点赞/踩
- 评论（支持楼中楼回复，AI 自动评论）
- 关注其他用户
- **编辑中心** — 提交文章编辑申请，查看审核状态和历史记录

### 管理员后台 `/admin`

- 文章管理（新建、编辑、发布/草稿切换、删除）
- AI 写作助手（生成草稿 / 续写 / 生成摘要，DeepSeek 流式输出）
- 封面图上传，正文插图
- 评论审核（待审核红点提醒）
- **编辑审核** — 查看用户提交的修改请求，对比内容后一键批准或拒绝，批准后自动更新文章
- Gallery 图片管理（上传、分类、排序、删除）
- 首页轮播管理（增删改、启用/禁用、排序、图片上传）
- 博文插图管理

------

## 本地开发

### 1. 克隆项目

```bash
git clone https://github.com/your-username/arc-portfolio.git
cd arc-portfolio
npm install
```

### 2. 配置环境变量

在项目根目录新建 `.env.local`：

```env
# Neon 数据库
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require

# NextAuth
NEXTAUTH_SECRET=your-random-secret-string
NEXTAUTH_URL=http://localhost:3000

# GitHub OAuth（在 GitHub Developer Settings 创建 OAuth App）
GITHUB_ID=your-github-client-id
GITHUB_SECRET=your-github-client-secret

# 管理员 GitHub 用户名（只有该账号可通过 GitHub OAuth 登录）
ADMIN_GITHUB_USERNAME=your-github-username

# Resend 邮件服务
RESEND_API_KEY=re_xxxxxxxxxxxx

# Cloudinary 图片存储
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# DeepSeek AI（用于 AI 写作助手和自动评论）
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxx
DEEPSEEK_MODEL=deepseek-chat
AI_COMMENT_SECRET=any-random-string
```

### 3. 初始化数据库

将上方「数据库表结构」中的 SQL 在 Neon 控制台的 SQL Editor 中全部执行一遍。

### 4. 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000/)

------

## 部署到 Vercel

1. 将项目推送到 GitHub
2. 在 [Vercel](https://vercel.com/) 中 Import 该仓库
3. 在 Vercel 项目设置的 **Environment Variables** 中填入所有 `.env.local` 中的变量（`NEXTAUTH_URL` 改为生产域名）
4. 部署完成后，在 GitHub OAuth App 的 **Authorization callback URL** 中添加：`https://your-domain.com/api/auth/callback/github`

------

## 项目结构

```
arc-portfolio/
├── app/
│   ├── (前台页面)
│   │   ├── page.tsx              # 首页
│   │   ├── blog/                 # 博客列表 & 文章详情
│   │   ├── gallery/              # 图片画廊
│   │   ├── projects/             # 项目展示
│   │   ├── profile/              # 用户资料 & 关注列表
│   │   ├── dashboard/            # 用户编辑中心
│   │   ├── login/                # 登录
│   │   └── register/             # 注册
│   ├── admin/                    # 管理员后台
│   │   ├── page.tsx              # 后台首页（文章列表）
│   │   ├── new/                  # 新建文章
│   │   ├── edit/[slug]/          # 编辑文章
│   │   ├── reviews/              # 编辑申请审核
│   │   ├── comments/             # 评论审核
│   │   ├── gallery/              # Gallery 管理
│   │   ├── slides/               # 轮播管理
│   │   └── post-images/          # 博文插图管理
│   └── api/                      # API 路由
│       ├── posts/                # 文章 CRUD
│       ├── comments/             # 评论
│       ├── reactions/            # 点赞/踩
│       ├── bookmarks/            # 收藏
│       ├── follows/              # 关注关系
│       ├── gallery/              # Gallery 图片
│       ├── slides/               # 轮播数据
│       ├── edit-requests/        # 编辑申请
│       ├── ai/                   # AI 写作 & 评论
│       ├── user/                 # 用户资料 & 上传
│       └── auth/                 # NextAuth
├── components/
│   ├── admin/                    # 后台组件（PostEditor、AdminActions）
│   ├── layout/                   # 布局（Navbar、Footer、UserMenu）
│   ├── sections/                 # 页面区块（Hero、BlogCard、GalleryGrid…）
│   └── ui/                       # 基础组件（Card3D、SectionHeading…）
└── lib/
    ├── db.ts                     # 数据库操作函数
    ├── auth.ts                   # 认证中间件
    ├── authOptions.ts            # NextAuth 配置
    ├── data.ts                   # 静态数据（Projects、Hero 兜底）
    ├── hooks.ts                  # 自定义 Hooks
    └── email.ts                  # 邮件发送
```

------

## 角色权限

| 功能                | 游客 | 登录用户 | 管理员 |
| ------------------- | ---- | -------- | ------ |
| 浏览文章 / Gallery  | ✅    | ✅        | ✅      |
| 评论、点赞、收藏    | ❌    | ✅        | ✅      |
| 关注其他用户        | ❌    | ✅        | ✅      |
| 提交文章编辑申请    | ❌    | ✅        | ✅      |
| 新建 / 删除文章     | ❌    | ❌        | ✅      |
| 审核评论 & 编辑申请 | ❌    | ❌        | ✅      |
| Gallery / 轮播管理  | ❌    | ❌        | ✅      |

------

## License

MIT
