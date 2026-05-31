# Skills 页面实施计划

## 项目信息
- 框架：Next.js 16 + React 19 + Tailwind CSS 4
- 后端：Supabase (Neon PostgreSQL)
- 博客项目路径：/e/chromeDownload/arc-portfolio
- Obsidian 记录路径：D:\obsidianWarehouse\XavierWarehouse

## 需求确认
1. **爬取频率**：每天一次，每天早上 10:00 开始爬取
2. **首批数据量**：30 条
3. **分类数量**：动态调整（初始 5 个分类）
4. **详情页**：需要独立详情页

## 实施阶段

### Phase 1：数据库 + API（优先级：高）
1. 创建 Supabase `skills` 表
   - 字段：id, name, slug, description, source_url, source_type, stars, tags, category, cover_image, content, created_at, updated_at
   - 索引：category, stars DESC, updated_at DESC
   - 唯一约束：source_url（去重）

2. 实现 `/api/skills` 接口
   - GET /api/skills - 获取技能列表（支持分页、筛选、排序）
   - GET /api/skills/[slug] - 获取单个技能详情

3. 实现爬虫脚本
   - GitHub API 搜索：awesome-ai-agents, llm-tools, agent-skills
   - 解析 README 内容，提取技能信息
   - AI 自动分类（关键词匹配 + 逻辑判断）
   - 保存到数据库

### Phase 2：页面 + 组件（优先级：高）
1. 创建 `/skills` 页面
   - app/skills/page.tsx - Server Component
   - app/skills/loading.tsx - 骨架屏
   - app/skills/SkillList.tsx - 客户端组件（筛选、排序）

2. 创建 `/skills/[slug]` 详情页
   - app/skills/[slug]/page.tsx - Server Component
   - app/skills/[slug]/loading.tsx - 骨架屏
   - 展示：名称、简介、完整内容、来源链接、标签、分类

3. 实现 `SkillCard` 组件
   - 复用 BlogCard 的 Card3D 和 useScrollReveal
   - 内容：分类角标、名称、简介、来源图标、⭐数、更新时间、标签
   - 点击跳转到详情页

4. 修改导航栏
   - Navbar.tsx 的 NAV_ITEMS 新增 Skills 入口
   - 移动端抽屉菜单同步更新

### Phase 3：定时任务（优先级：中）
1. 创建每日爬取定时任务
   - 触发时间：每天 10:00（北京时间）
   - 执行内容：运行爬虫脚本，保存到数据库
   - 任务 ID：待生成

2. 写入 Obsidian 记录
   - 路径：D:\obsidianWarehouse\XavierWarehouse\定时任务\Skills每日爬取.md
   - 内容：任务ID、触发时间、管理命令

### Phase 4：优化（优先级：低）
1. 缓存策略
   - 使用 ISR（Incremental Static Regeneration）
   - revalidate: 3600（1小时）

2. 搜索功能
   - 全文搜索：名称、描述、标签
   - 筛选：分类、来源、热度

3. 数据去重
   - 根据 source_url 去重
   - 更新时覆盖旧数据

## 技术要点

### GitHub API 使用
```typescript
// 搜索仓库
const response = await fetch(
  'https://api.github.com/search/repositories?q=awesome-ai-agents+in:name&sort=stars&order=desc',
  {
    headers: {
      'Authorization': `token ${process.env.GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json'
    }
  }
)

// 获取 README
const readmeResponse = await fetch(
  `https://api.github.com/repos/${owner}/${repo}/readme`,
  {
    headers: {
      'Authorization': `token ${process.env.GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json'
    }
  }
)
```

### AI 自动分类逻辑
```typescript
const CATEGORY_KEYWORDS = {
  coding: ['code', 'programming', 'developer', 'IDE', 'debug', 'refactor', 'test', 'api', 'sdk'],
  research: ['research', 'paper', 'academic', 'analysis', 'data', 'study', 'science'],
  creative: ['creative', 'design', 'art', 'music', 'write', 'content', 'image', 'video'],
  automation: ['automation', 'workflow', 'pipeline', 'agent', 'bot', 'task', 'orchestrat'],
  productivity: ['productivity', 'management', 'organization', 'planning', 'schedule'],
}

function classifySkill(description: string): string {
  const desc = description.toLowerCase()
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(kw => desc.includes(kw))) {
      return category
    }
  }
  return 'other'
}
```

### 数据库表结构
```sql
CREATE TABLE skills (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  content TEXT, -- 完整内容（README 或详情）
  source_url VARCHAR(500) UNIQUE NOT NULL,
  source_type VARCHAR(20) NOT NULL, -- 'github' | 'reddit' | 'hn' | 'ph'
  stars INTEGER DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  category VARCHAR(50) DEFAULT 'other',
  cover_image VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at_TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_skills_category ON skills(category);
CREATE INDEX idx_skills_stars ON skills(stars DESC);
CREATE INDEX idx_skills_updated ON skills(updated_at DESC);
CREATE INDEX idx_skills_source_type ON skills(source_type);
```

## 验收标准
1. ✅ 导航栏新增 Skills 入口
2. ✅ /skills 页面展示技能卡片列表
3. ✅ /skills/[slug] 详情页展示完整内容
4. ✅ 卡片支持筛选（分类、来源）和排序（热度、时间）
5. ✅ 每日 10:00 自动爬取 30 条新技能
6. ✅ 数据自动去重（根据 source_url）
7. ✅ AI 自动分类（5 个分类 + other）
8. ✅ 骨架屏加载效果
9. ✅ 响应式布局（桌面端 + 移动端）
10. ✅ 写入 Obsidian 记录

## 风险与应对
1. **GitHub API 限制**：使用 GITHUB_TOKEN 提升限额到 5000次/小时
2. **爬取失败**：重试机制（最多 3 次），失败记录日志
3. **分类不准确**：允许手动修正，后续优化关键词
4. **数据量过大**：分页加载，每页 12 条

## 时间估算
- Phase 1：2-3 小时（数据库 + API + 爬虫）
- Phase 2：2-3 小时（页面 + 组件）
- Phase 3：0.5 小时（定时任务）
- Phase 4：1-2 小时（优化）
- **总计**：6-9 小时

## 执行方式
使用 Claude Code 分阶段执行：
```bash
cd /e/chromeDownload/arc-portfolio
claude -p "按照 SKILLS_PLAN.md 中的 Phase X 要求，实现 Skills 页面的 XXX 部分。" --allowedTools "Read,Write,Edit,Bash" --max-turns 35 --dangerously-skip-permissions
```

每阶段完成后：
1. 运行 `npm run build` 验证
2. 运行 `npm run dev` 测试
3. 汇报进度
4. 更新 CLAUDE.md
