// scripts/crawl-trending.ts
// GitHub Trending 爬虫：每日热门、每周热门、Star 增速排行
// 运行方式：npx tsx scripts/crawl-trending.ts

import dotenv from 'dotenv'
import path from 'path'
import { neon } from '@neondatabase/serverless'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

// ─── Config ───────────────────────────────────────────────────────────────────

const GITHUB_API = 'https://api.github.com'
const GITHUB_TOKEN = process.env.GITHUB_TOKEN
const DATABASE_URL = process.env.DATABASE_URL

const PER_PAGE = 30
const MAX_RETRIES = 3
const REQUEST_DELAY_MS = GITHUB_TOKEN ? 1000 : 3000

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 200)
}

function getDateStr(daysAgo: number): string {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString().slice(0, 10)
}

// ─── GitHub API ───────────────────────────────────────────────────────────────

interface GitHubRepo {
  id: number
  name: string
  full_name: string
  description: string | null
  html_url: string
  stargazers_count: number
  forks_count: number
  language: string | null
  topics: string[]
  owner: {
    login: string
    avatar_url: string
  }
  created_at: string
  updated_at: string
}

interface SearchResponse {
  total_count: number
  incomplete_results: boolean
  items: GitHubRepo[]
}

async function fetchGitHub(url: string, retries = MAX_RETRIES): Promise<any> {
  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'MindStack-Trending-Crawler',
  }
  if (GITHUB_TOKEN) {
    headers['Authorization'] = `token ${GITHUB_TOKEN}`
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, { headers })
      if (response.status === 403) {
        // Rate limited
        const resetTime = response.headers.get('x-ratelimit-reset')
        const waitMs = resetTime
          ? Math.max(0, parseInt(resetTime) * 1000 - Date.now()) + 1000
          : 60000
        console.warn(`Rate limited. Waiting ${Math.round(waitMs / 1000)}s...`)
        await sleep(waitMs)
        continue
      }
      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`)
      }
      return response.json()
    } catch (err) {
      if (attempt === retries) throw err
      console.warn(`Attempt ${attempt} failed, retrying...`)
      await sleep(2000 * attempt)
    }
  }
}

async function searchRepos(query: string, sort: string, perPage: number): Promise<GitHubRepo[]> {
  const url = `${GITHUB_API}/search/repositories?q=${encodeURIComponent(query)}&sort=${sort}&order=desc&per_page=${perPage}`
  const data: SearchResponse = await fetchGitHub(url)
  return data.items || []
}

// ─── Crawl Functions ──────────────────────────────────────────────────────────

async function crawlDailyTrending(): Promise<GitHubRepo[]> {
  const yesterday = getDateStr(1)
  console.log(`\n📅 Crawling daily trending (created after ${yesterday})...`)

  const repos = await searchRepos(`created:>${yesterday}`, 'stars', PER_PAGE)
  console.log(`  Found ${repos.length} repos`)
  return repos
}

async function crawlWeeklyTrending(): Promise<GitHubRepo[]> {
  const weekAgo = getDateStr(7)
  console.log(`\n📆 Crawling weekly trending (created after ${weekAgo})...`)

  const repos = await searchRepos(`created:>${weekAgo}`, 'stars', PER_PAGE)
  console.log(`  Found ${repos.length} repos`)
  return repos
}

async function crawlGrowthRate(sql: any): Promise<GitHubRepo[]> {
  console.log(`\n🚀 Crawling growth rate (top starred repos)...`)

  // 获取上次爬取的 daily/weekly 数据中的仓库
  // 注意：去掉 DISTINCT，因为 ORDER BY crawled_at 不在 SELECT 列表中会报错
  // 后续用 Map 去重（previousStars.has 检查）
  const previousRepos = await sql`
    SELECT repo_name, stars
    FROM github_trending
    WHERE period IN ('daily', 'weekly')
      AND crawled_at > NOW() - INTERVAL '7 days'
    ORDER BY crawled_at DESC
    LIMIT 100
  `

  if (previousRepos.length === 0) {
    console.log('  No previous data found, fetching top repos instead')
    // 如果没有历史数据，获取最近热门仓库
    const weekAgo = getDateStr(7)
    return searchRepos(`created:>${weekAgo}`, 'stars', PER_PAGE)
  }

  // 获取这些仓库的当前 star 数
  const repoNames: string[] = previousRepos.map((r: any) => r.repo_name)
  const repos: GitHubRepo[] = []

  for (const repoName of repoNames.slice(0, PER_PAGE)) {
    try {
      const [owner, name] = repoName.split('/')
      if (!owner || !name) continue
      const data = await fetchGitHub(`${GITHUB_API}/repos/${owner}/${name}`)
      repos.push(data)
      await sleep(REQUEST_DELAY_MS)
    } catch {
      // Skip failed repos
    }
  }

  console.log(`  Fetched ${repos.length} repos for growth calculation`)
  return repos
}

// ─── Database ─────────────────────────────────────────────────────────────────

interface TrendingItem {
  repo_name: string
  slug: string
  full_name: string
  description: string | null
  html_url: string
  stars: number
  forks: number
  language: string | null
  owner_avatar: string
  topics: string[]
  period: string
  stars_gained: number
  rank: number
}

async function saveToDatabase(sql: any, items: TrendingItem[]): Promise<void> {
  const today = new Date().toISOString().slice(0, 10)
  for (const item of items) {
    try {
      await sql`
        INSERT INTO github_trending (repo_name, slug, full_name, description, html_url, stars, forks, language, owner_avatar, topics, period, stars_gained, rank, crawled_date)
        VALUES (
          ${item.repo_name},
          ${item.slug},
          ${item.full_name},
          ${item.description},
          ${item.html_url},
          ${item.stars},
          ${item.forks},
          ${item.language},
          ${item.owner_avatar},
          ${item.topics},
          ${item.period},
          ${item.stars_gained},
          ${item.rank},
          ${today}
        )
        ON CONFLICT (repo_name, period, crawled_date) DO UPDATE SET
          full_name = EXCLUDED.full_name,
          description = EXCLUDED.description,
          html_url = EXCLUDED.html_url,
          stars = EXCLUDED.stars,
          forks = EXCLUDED.forks,
          language = EXCLUDED.language,
          owner_avatar = EXCLUDED.owner_avatar,
          topics = EXCLUDED.topics,
          stars_gained = EXCLUDED.stars_gained,
          rank = EXCLUDED.rank,
          crawled_at = NOW()
      `
    } catch (err) {
      console.error(`Error saving ${item.repo_name}:`, err)
    }
  }
}

async function cleanupOldData(sql: any): Promise<void> {
  console.log('\n🧹 Cleaning up old data (>30 days)...')
  const result = await sql`
    DELETE FROM github_trending WHERE crawled_at < NOW() - INTERVAL '30 days'
  `
  console.log(`  Cleaned ${(result as any).count || 0} old records`)
}

// ─── Build Trending Items ─────────────────────────────────────────────────────

function buildTrendingItems(repos: GitHubRepo[], period: string, previousStars?: Map<string, number>): TrendingItem[] {
  return repos.map((repo, index) => {
    const prevStars = previousStars?.get(repo.full_name)
    const starsGained = prevStars ? repo.stargazers_count - prevStars : 0

    return {
      repo_name: repo.full_name,
      slug: slugify(repo.full_name),
      full_name: repo.full_name,
      description: repo.description,
      html_url: repo.html_url,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      language: repo.language,
      owner_avatar: repo.owner.avatar_url,
      topics: repo.topics || [],
      period,
      stars_gained: starsGained,
      rank: index + 1,
    }
  })
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🔥 Starting GitHub Trending crawler...')

  if (!GITHUB_TOKEN) {
    console.warn('⚠️  No GITHUB_TOKEN found. API rate limits will be lower.')
  }
  if (!DATABASE_URL) {
    console.error('❌ Missing DATABASE_URL')
    process.exit(1)
  }

  const sql = neon(DATABASE_URL)

  // 1. 获取上次爬取的 star 数据（用于计算增速）
  const previousData = await sql`
    SELECT repo_name, stars FROM github_trending
    WHERE period IN ('daily', 'weekly')
    ORDER BY crawled_at DESC
    LIMIT 200
  `
  const previousStars = new Map<string, number>()
  for (const row of previousData as any[]) {
    if (!previousStars.has(row.repo_name)) {
      previousStars.set(row.repo_name, row.stars)
    }
  }
  console.log(`📊 Loaded ${previousStars.size} previous records for growth calculation`)

  // 2. 爬取每日热门
  const dailyRepos = await crawlDailyTrending()
  const dailyItems = buildTrendingItems(dailyRepos, 'daily')
  await saveToDatabase(sql, dailyItems)
  console.log(`✅ Saved ${dailyItems.length} daily trending items`)

  await sleep(REQUEST_DELAY_MS)

  // 3. 爬取每周热门
  const weeklyRepos = await crawlWeeklyTrending()
  const weeklyItems = buildTrendingItems(weeklyRepos, 'weekly')
  await saveToDatabase(sql, weeklyItems)
  console.log(`✅ Saved ${weeklyItems.length} weekly trending items`)

  await sleep(REQUEST_DELAY_MS)

  // 4. 计算增速排行
  const growthRepos = await crawlGrowthRate(sql)
  const growthItems = buildTrendingItems(growthRepos, 'growth', previousStars)
  // 按增速排序
  growthItems.sort((a, b) => b.stars_gained - a.stars_gained)
  // 重新分配排名
  growthItems.forEach((item, i) => { item.rank = i + 1 })
  await saveToDatabase(sql, growthItems)
  console.log(`✅ Saved ${growthItems.length} growth rate items`)

  // 5. 清理旧数据
  await cleanupOldData(sql)

  console.log('\n🎉 Trending crawl completed!')
}

main().catch(console.error)
