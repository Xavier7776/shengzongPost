# CLAUDE.md

> 本文件不再重复维护项目说明，完整内容见 **`AGENTS.md`**（同一目录）。
> 下方只保留最容易被写错、且必须每次确认的关键事实。

## 必须记住的事实

| 项 | 正确值 | 常见错误 |
| --- | --- | --- |
| 框架版本 | Next.js **14** / React **18** / Tailwind **3** | ~~Next 16 / React 19 / Tailwind 4~~ |
| 项目路径 | `D:\BaiduNetdisk\post\shengzongPost` | ~~/e/chromeDownload/arc-portfolio~~ |
| 主站数据库 | **Neon**，统一走 `@/lib/db` | 不要直连 |
| onlyus 数据库 | **Supabase**，走 `getSupabaseClient()` | 不要新建 client |
| 全局样式 | `app/globals.css` | 根目录已无 globals.css |

## 常用命令

```bash
npm run dev          # 开发
npm run build        # 构建
npm run typecheck    # 类型检查
npm test             # 测试
npm run crawl:skills   # 爬取 Skills → Neon
npm run crawl:trending # 爬取 Trending → Neon
```

## 改动前须知

- **导航入口**在 `components/layout/Navbar.tsx` 的 `NAV_ITEMS`（当前 5 项）。
- **两套认证**：主站 NextAuth v4；`onlyus` 用独立 HMAC Cookie（`lib/onlyus-gate.ts` + `middleware.ts`，仅保护 `/onlyus/:path*`）。
- **两个数据库不能互相 JOIN**，跨库数据需在应用层聚合。
- 完整目录结构、已知问题与整理计划见 `AGENTS.md` 与 `docs/项目整理计划-2026-09-10.md`。
