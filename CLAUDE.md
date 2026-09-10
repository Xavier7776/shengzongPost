# CLAUDE.md

开发约定、技术栈、命令与重构计划统一维护在 **[AGENTS.md](./AGENTS.md)**，
请以此为准。不要在此文件里重复描述，避免两份文档再次分叉。

补充：项目笔记同步到 Obsidian 仓库 `D:\obsidianWarehouse\XavierWarehouse`。

本地路径：`D:\BaiduNetdisk\post\shengzongPost`（远端 `github.com/Xavier7776/shengzongPost`）。

两条最容易被写错的事实（完整说明仍在 AGENTS.md）：

- **双数据库**：主站（博客/作品/社区）走 **Neon**，统一经 `@/lib/db`；
  `onlyus` 走 **Supabase**，经 `getSupabaseClient()`。两者不能跨库 JOIN。
- **版本**：Next.js **14** / React **18** / Tailwind **3**（不是 16 / 19 / 4）。

本轮项目整理的完整证据链见 `docs/项目整理计划-2026-09-10.md`。
