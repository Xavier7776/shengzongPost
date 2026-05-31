// scripts/crawl-skills.ts
// GitHub 爬虫脚本：搜索 awesome-ai-agents 仓库，解析 README，提取技能信息
// 运行方式：npx tsx scripts/crawl-skills.ts

import dotenv from 'dotenv'
import path from 'path'
import { neon } from '@neondatabase/serverless'

// 加载 .env.local 文件
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

// ─── Config ───────────────────────────────────────────────────────────────────

const GITHUB_API = 'https://api.github.com'
const GITHUB_TOKEN = process.env.GITHUB_TOKEN

const SEARCH_QUERIES = [
  'ai skills',
  'agent skills',
  'claude skills',
  'mcp tools',
  'llm skills',
  'ai agent capabilities',
  'cursor skills',
  'copilot skills',
  'ai assistant skills',
  'nature skills',
]

// 排除的仓库（awesome-list 资源合集，不是具体工具）
const EXCLUDE_PATTERNS = [
  'awesome-',
  '-awesome',
  'awesome_',
  '_awesome',
  '-list',
  '-resources',
  '-collection',
  '-curated',
]

const MAX_ITEMS = 3 // 每天只爬取最热门的 3 个

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  coding: ['code', 'programming', 'developer', 'ide', 'debug', 'refactor', 'test', 'api', 'sdk', 'coding', 'copilot', 'autocomplete', 'lint', 'compiler'],
  research: ['research', 'paper', 'academic', 'analysis', 'data', 'study', 'science', 'arxiv', 'scholar', 'literature'],
  creative: ['creative', 'design', 'art', 'music', 'write', 'content', 'image', 'video', 'generate', 'paint', 'draw', 'storytelling'],
  automation: ['automation', 'workflow', 'pipeline', 'agent', 'bot', 'task', 'orchestrat', 'rpa', 'scheduling', 'ci/cd'],
  productivity: ['productivity', 'management', 'organization', 'planning', 'schedule', 'todo', 'note', 'calendar', 'crm'],
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function classifySkill(text: string): string {
  const lower = text.toLowerCase()
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) return category
  }
  return 'other'
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 200)
}

function extractTags(text: string): string[] {
  const tagPatterns = [
    /agent/i, /llm/i, /gpt/i, /openai/i, /claude/i, /gemini/i,
    /langchain/i, /autogen/i, /crewai/i, /tool/i, /rag/i,
  ]
  return tagPatterns
    .filter(pattern => pattern.test(text))
    .map(pattern => pattern.source.replace(/[\/\^$]/g, '').toLowerCase())
}

// 清理描述格式
function cleanDescription(description: string): string {
  if (!description) return ''
  
  return description
    // 去掉多余的空白字符
    .replace(/\s+/g, ' ')
    // 去掉特殊字符
    .replace(/[^\w\s.,;:!?()（）【】《》\-+]/g, '')
    // 去掉连续的标点符号
    .replace(/[,，]{2,}/g, '，')
    .replace(/[.。]{2,}/g, '。')
    // 去掉首尾空白
    .trim()
    // 限制长度
    .slice(0, 300)
}

// 从 README 提取关键信息
function extractReadmeHighlights(readme: string): { features: string[]; description: string } {
  if (!readme) return { features: [], description: '' }
  
  const lines = readme.split('\n')
  const features: string[] = []
  let description = ''
  
  // 提取第一段非标题非空行作为描述
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('![') || trimmed.startsWith('<')) continue
    if (trimmed.length > 20 && !trimmed.startsWith('-') && !trimmed.startsWith('*')) {
      description = trimmed.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // 去掉 markdown 链接
      break
    }
  }
  
  // 提取特性列表（以 - 或 * 开头的行）
  for (const line of lines) {
    const trimmed = line.trim()
    if ((trimmed.startsWith('- ') || trimmed.startsWith('* ')) && trimmed.length > 10) {
      const feature = trimmed.slice(2).replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/[*_`]/g, '')
      if (feature.length > 5 && feature.length < 100) {
        features.push(feature)
      }
    }
    if (features.length >= 5) break
  }
  
  return { features, description: description.slice(0, 200) }
}

// 生成中文简介 - 更详细版本
function generateChineseSummary(name: string, description: string, category: string, readme: string): string {
  const categoryNames: Record<string, string> = {
    coding: '编程开发',
    research: '学术研究',
    creative: '创意设计',
    automation: '自动化',
    productivity: '效率工具',
    other: 'AI 工具',
  }
  
  const categoryName = categoryNames[category] || 'AI 工具'
  const cleanDesc = cleanDescription(description)
  const { features, description: readmeDesc } = extractReadmeHighlights(readme)
  
  // 知名项目的硬编码简介
  const knownProjects: Record<string, string> = {
    'andrej-karpathy-skills': 'Andrej Karpathy 推荐的 Claude Code 技能配置文件，通过一个 CLAUDE.md 文件提升 AI 编程助手的代码质量。涵盖最佳实践、常见陷阱规避、代码审查规则等，是使用 Claude Code 的必备配置。',
    'agent-skills': '生产级 AI 编程代理技能库，收录了经过验证的工作流、质量门禁和最佳实践。涵盖代码审查、测试编写、文档生成、部署运维等工程技能，适合企业级项目使用。',
    'scientific-agent-skills': '将 AI 代理转变为 AI 科学家的技能库，全球 16 万+ 科学家使用。涵盖论文阅读、实验设计、数据分析、文献综述等科研技能，是科研工作者的 AI 助手。',
    'claude-skills': '337 个 Claude Code 技能集合，包含 30+ 代理、70+ 自定义命令、330+ 技能。支持自定义参考、脚本、模板等，是 Claude Code 技能的百科全书。',
    'Agent-Skills-for-Context-Engineering': '上下文工程的代理技能大全，涵盖多代理架构、生产环境代理系统设计。提供技能模板、最佳实践、架构模式，适合构建复杂的 AI 代理系统。',
    'skills': 'MiniMax AI 官方技能库，提供中文版 Claude Code 技能。包含代码审查、PR 规范、贡献指南等工程技能，适合中文开发者使用。',
    'AI-Research-SKILLs': '开源 AI 研究和工程技能库，适用于任何 AI 模型。打包技能和你的专业知识，让 AI 代理具备专业领域能力。',
    'browser-tools-mcp': 'MCP 浏览器工具服务器，支持从 Cursor 等 IDE 直接监控浏览器日志。内置 NextJS 专用提示、网络请求分析、DOM 检查等技能。',
    'ai-marketing-skills': '开源 AI 营销技能库，涵盖增长实验、销售漏斗、内容运营、外呼、SEO 和财务自动化。是营销团队的 AI 助手。',
    'claude-code-plugins-plus-skills': '425 个插件、2810 个技能、200 个代理的 Claude Code 技能市场。通过 ccpi CLI 工具安装，是最大的 Claude Code 技能集合。',
    'nature-skills': '自然语言处理技能包，提供文本分类、情感分析、命名实体识别、摘要生成等 NLP 能力。可集成到 AI 代理中，增强语言理解能力。',
  }
  
  if (knownProjects[name]) {
    return knownProjects[name]
  }
  
  // 如果有 README 特性，生成详细简介
  if (features.length > 0) {
    const featureSummary = features.slice(0, 3).join('、')
    return `${cleanDesc || readmeDesc || `一个${categoryName}方向的开源项目`}。主要特性包括：${featureSummary}。${features.length > 3 ? `还包含 ${features.length - 3} 个其他特性。` : ''}`
  }
  
  // 如果有 README 描述
  if (readmeDesc && readmeDesc.length > 30) {
    return `${cleanDesc || `一个${categoryName}方向的开源项目`}。${readmeDesc}`
  }
  
  // 如果有仓库描述
  if (cleanDesc) {
    // 扩展描述
    const lower = cleanDesc.toLowerCase()
    if (lower.includes('curated list') || lower.includes('collection') || lower.includes('awesome')) {
      return `精心整理的${categoryName}资源合集，${cleanDesc}`
    }
    if (lower.includes('framework') || lower.includes('platform')) {
      return `${categoryName}开发框架，${cleanDesc}。提供完整的开发工具链和文档支持。`
    }
    if (lower.includes('tool') || lower.includes('utility') || lower.includes('sdk')) {
      return `${categoryName}工具库，${cleanDesc}。帮助开发者提高效率，简化开发流程。`
    }
    if (lower.includes('agent') || lower.includes('bot') || lower.includes('assistant')) {
      return `AI 智能体项目，${cleanDesc}。支持多种 LLM 后端，可扩展性强。`
    }
    if (lower.includes('research') || lower.includes('paper') || lower.includes('survey')) {
      return `学术研究资源，${cleanDesc}。包含论文、数据集和实验代码。`
    }
    if (lower.includes('automation') || lower.includes('workflow') || lower.includes('pipeline')) {
      return `自动化工作流工具，${cleanDesc}。支持可视化编排和定时执行。`
    }
    if (lower.includes('code') || lower.includes('coding') || lower.includes('programming')) {
      return `编程开发辅助工具，${cleanDesc}。集成主流 IDE 和编辑器。`
    }
    return `${categoryName}项目 — ${cleanDesc}`
  }
  
  // 无描述时的默认简介
  return `一个${categoryName}方向的开源项目，提供 AI 智能体相关资源与工具。该项目在 GitHub 上获得了广泛关注，适合开发者学习和使用。`
}

// 提取关键词
function extractKeywords(text: string): string[] {
  const keywords: string[] = []
  
  // 提取英文单词
  const words = text.match(/[a-zA-Z]+/g) || []
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought', 'used', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'its', 'our', 'their', 'mine', 'yours', 'hers', 'ours', 'theirs', 'what', 'which', 'who', 'whom', 'whose', 'where', 'when', 'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'because', 'as', 'until', 'while', 'of', 'at', 'by', 'for', 'with', 'about', 'against', 'between', 'through', 'during', 'before', 'after', 'above', 'below', 'to', 'from', 'up', 'down', 'in', 'out', 'on', 'off', 'over', 'under', 'again', 'further', 'then', 'once'])
  
  for (const word of words) {
    const lower = word.toLowerCase()
    if (lower.length > 2 && !stopWords.has(lower) && !keywords.includes(lower)) {
      keywords.push(lower)
    }
  }
  
  return keywords.slice(0, 5)
}

// ─── GitHub API ───────────────────────────────────────────────────────────────

async function fetchGitHub(url: string): Promise<any> {
  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'MindStack-Skills-Crawler',
  }
  if (GITHUB_TOKEN) {
    headers['Authorization'] = `token ${GITHUB_TOKEN}`
  }

  const response = await fetch(url, { headers })
  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status} ${response.statusText}`)
  }
  return response.json()
}

async function searchRepositories(query: string, page = 1, perPage = 10): Promise<any[]> {
  const url = `${GITHUB_API}/search/repositories?q=${encodeURIComponent(query)}+in:name&sort=stars&order=desc&page=${page}&per_page=${perPage}`
  const data = await fetchGitHub(url)
  return data.items || []
}

async function getReadme(owner: string, repo: string): Promise<string> {
  try {
    const data = await fetchGitHub(`${GITHUB_API}/repos/${owner}/${repo}/readme`)
    return Buffer.from(data.content, 'base64').toString('utf-8')
  } catch {
    return ''
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

interface Skill {
  name: string
  slug: string
  description: string
  chinese_summary: string
  content: string
  source_url: string
  source_type: 'github'
  stars: number
  tags: string[]
  category: string
  cover_image: string | null
}

async function crawlSkills(): Promise<Skill[]> {
  const skills: Skill[] = []
  const seenUrls = new Set<string>()

  for (const query of SEARCH_QUERIES) {
    console.log(`Searching: ${query}`)
    const repos = await searchRepositories(query, 1, 10)

    for (const repo of repos) {
      if (skills.length >= MAX_ITEMS) break
      if (seenUrls.has(repo.html_url)) continue
      
      // 排除 awesome-list 等资源合集
      const repoNameLower = repo.name.toLowerCase()
      if (EXCLUDE_PATTERNS.some(p => repoNameLower.includes(p))) {
        console.log(`Skipped (awesome-list): ${repo.full_name}`)
        continue
      }
      
      seenUrls.add(repo.html_url)

      console.log(`Processing: ${repo.full_name}`)

      const readme = await getReadme(repo.owner.login, repo.name)
      const description = repo.description || ''
      const fullText = `${repo.name} ${description} ${readme}`
      
      // 清理描述
      const cleanDesc = cleanDescription(description)
      
      // 分类
      const category = classifySkill(fullText)
      
      // 生成中文简介
      const chineseSummary = generateChineseSummary(repo.name, cleanDesc, category, readme)

      const skill: Skill = {
        name: repo.name,
        slug: slugify(repo.name),
        description: cleanDesc,
        chinese_summary: chineseSummary,
        content: readme.slice(0, 5000),
        source_url: repo.html_url,
        source_type: 'github',
        stars: repo.stargazers_count || 0,
        tags: extractTags(fullText),
        category: category,
        cover_image: repo.owner.avatar_url || null,
      }

      skills.push(skill)
    }
  }

  return skills.slice(0, MAX_ITEMS)
}

async function saveToDatabase(skills: Skill[]): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    console.error('Missing DATABASE_URL')
    process.exit(1)
  }

  const sql = neon(databaseUrl)

  for (const skill of skills) {
    try {
      await sql`
        INSERT INTO skills (name, slug, description, chinese_summary, content, source_url, source_type, stars, tags, category, cover_image)
        VALUES (${skill.name}, ${skill.slug}, ${skill.description}, ${skill.chinese_summary}, ${skill.content}, ${skill.source_url}, ${skill.source_type}, ${skill.stars}, ${skill.tags}, ${skill.category}, ${skill.cover_image})
        ON CONFLICT (source_url) DO UPDATE SET
          name = EXCLUDED.name,
          slug = EXCLUDED.slug,
          description = EXCLUDED.description,
          chinese_summary = EXCLUDED.chinese_summary,
          content = EXCLUDED.content,
          stars = EXCLUDED.stars,
          tags = EXCLUDED.tags,
          category = EXCLUDED.category,
          cover_image = EXCLUDED.cover_image,
          updated_at = NOW()
      `
      console.log(`Saved: ${skill.name}`)
    } catch (error) {
      console.error(`Error saving ${skill.name}:`, error)
    }
  }
}

async function main() {
  console.log('Starting Skills crawler...')
  
  if (!GITHUB_TOKEN) {
    console.warn('Warning: No GITHUB_TOKEN found. API rate limits will be lower.')
  }

  const skills = await crawlSkills()
  console.log(`Found ${skills.length} skills`)

  await saveToDatabase(skills)
  console.log('Done!')
}

main().catch(console.error)
