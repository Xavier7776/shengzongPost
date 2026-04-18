export const BLOG_POSTS = [
  {
    id: 1,
    title: '构建极简主义前端架构的实践与思考',
    date: '2026-04-12',
    excerpt:
      '在日益复杂的前端生态中，如何通过做减法来提升系统的可维护性与视觉的纯粹感。探讨 Next.js、Tailwind 在极简架构下的最佳实践。',
    tags: ['Architecture', 'Next.js'],
    content: `## 为什么我们需要极简架构？

现代前端工程往往陷入过度设计的陷阱。我们引入了太多的状态管理库、复杂的动画引擎和层层嵌套的组件抽象。

在这篇文章中，我将探讨如何回归本质：

1. 使用 SSG 提前渲染静态内容。
2. 限制 CSS 变量，建立严谨的设计系统。
3. 剔除多余的 JavaScript 运行时。

## 视觉与代码的统一

正如 Apple 的设计哲学，好的代码架构也应该是"不言自明"的。采用单向数据流和纯函数组件，让我们的 UI 成为数据的稳定映射。

当每一个组件都只做一件事，系统便自然获得了可预测性——这也是极简架构最深远的价值所在。`,
  },
  {
    id: 2,
    title: '深入解析 React Server Components (RSC)',
    date: '2026-03-28',
    excerpt:
      'RSC 是如何改变我们编写 React 应用的方式的？它与传统的 SSR 有何本质区别？',
    tags: ['React', 'Performance'],
    content: `## RSC 带来了什么？

传统 SSR 只是首屏的 HTML 直出，而 RSC 允许我们在服务端运行组件，这不仅减少了客户端的 JS 体积，还允许组件直接访问数据库。

## 与 SSR 的本质区别

SSR 每次请求都重新生成 HTML；RSC 则让组件树本身在服务端驻留，只把需要交互的"岛屿"传给客户端。

这种架构的结果是：更少的 JavaScript、更快的 TTI、更自然的数据获取模式。`,
  },
  {
    id: 3,
    title: 'UI 工程学：8px 间距系统的数学美感',
    date: '2026-03-15',
    excerpt:
      '为什么顶级设计师都偏爱 8px 间距系统？它不仅关乎视觉，更关乎开发效率与多端适配。',
    tags: ['Design', 'UI/UX'],
    content: `## 规则的力量

当我们将所有的 margin 和 padding 限制在 8 的倍数（8, 16, 24, 32, 48, 64）时，页面会自动呈现出一种内在的节奏感。

## 为什么是 8？

大多数主流屏幕的 DPI 倍率（1x, 1.5x, 2x, 3x）都能整除 8，这意味着 8px 单位在各种屏幕上都不会产生亚像素渲染，边缘永远清晰。

## 与设计工具协作

Figma 的默认网格步长正是 8px。设计师与工程师使用同一套数字语言，协作摩擦趋近于零。`,
  },
]

export const GALLERY_IMAGES = [
  {
    id: 1,
    url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800',
    category: 'Architecture',
    title: '极简住宅',
  },
  {
    id: 2,
    url: 'https://images.unsplash.com/photo-1517816743773-6e0fd5ce998c?auto=format&fit=crop&q=80&w=800',
    category: 'Workspace',
    title: '纯净桌面',
  },
  {
    id: 3,
    url: 'https://images.unsplash.com/photo-1449844908441-8829872d2607?auto=format&fit=crop&q=80&w=800',
    category: 'Landscape',
    title: '山间迷雾',
  },
  {
    id: 4,
    url: 'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&q=80&w=800',
    category: 'Object',
    title: '工业设计',
  },
  {
    id: 5,
    url: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80&w=800',
    category: 'Interior',
    title: '留白空间',
  },
  {
    id: 6,
    url: 'https://images.unsplash.com/photo-1507149833265-60c372daea22?auto=format&fit=crop&q=80&w=800',
    category: 'Nature',
    title: '海洋细节',
  },
]

export const PROJECTS = [
  {
    id: 1,
    title: 'Nexus UI Component Library',
    desc: '一套基于 Tailwind 和 Radix 打造的极简企业级无头 UI 组件库，注重无障碍访问与键盘交互。',
    tech: ['React', 'TypeScript', 'Tailwind', 'Radix UI'],
    github: '#',
    demo: '#',
  },
  {
    id: 2,
    title: 'Aura Data Analytics',
    desc: '轻量级前端性能监控大盘，支持实时 Web Vitals 分析，采用 WebSocket 数据推送。',
    tech: ['Next.js', 'ECharts', 'WebSockets'],
    github: '#',
    demo: '#',
  },
  {
    id: 3,
    title: 'Markdown SSG Engine',
    desc: '用 Rust 编写的高性能静态站点生成器，专为技术文档设计，编译速度达毫秒级。',
    tech: ['Rust', 'Markdown', 'CLI'],
    github: '#',
    demo: '#',
  },
]

export const HERO_SLIDES = [
  {
    img: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=2000',
    title: '代码遇见设计',
    subtitle: '以严谨的美学标准构建数字化体验。',
  },
  {
    img: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=2000',
    title: '极简架构艺术',
    subtitle: '删繁就简，方能见其真意。',
  },
]
