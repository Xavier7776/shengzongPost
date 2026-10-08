// ── 预设模型 ──────────────────────────────────────────────
export const MODEL_GROUPS = [
  {
    label: 'OpenAI',
    models: [
      { value: 'gpt-5.1', label: 'GPT-5.1', badge: '推荐' },
      { value: 'gpt-5.1-mini', label: 'GPT-5.1 Mini' },
      { value: 'gpt-5.4', label: 'GPT-5.4', badge: '前沿' },
    ],
  },
  {
    label: 'Anthropic Claude',
    models: [
      { value: 'claude-opus-4-6', label: 'Claude Opus 4.6', badge: '推荐' },
      { value: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6' },
    ],
  },
  {
    label: 'DeepSeek',
    models: [
      { value: 'deepseek-v4-flash', label: 'DeepSeek V4 Flash', badge: '热门' },
      { value: 'deepseek-v4-thinking', label: 'DeepSeek V4 Thinking' },
    ],
  },
  {
    label: '通义千问 Qwen',
    models: [
      { value: 'qwen3.7-max', label: 'Qwen3.7 Max' },
      { value: 'qwen3.7-plus', label: 'Qwen3.7 Plus' },
    ],
  },
  {
    label: '小米 MiMo',
    models: [
      { value: 'mimo-v2.5-pro', label: 'MiMo v2.5 Pro', badge: '推荐' },
      { value: 'mimo-v2.5', label: 'MiMo v2.5' },
    ],
  },
]

// ── 语言选项 ──────────────────────────────────────────────
export const LANGUAGE_OPTIONS = [
  { value: '中文', label: '中文', guideline: '报告必须使用中文撰写' },
  { value: 'English', label: 'English', guideline: 'The report must be written in English' },
  { value: '日本語', label: '日本語', guideline: 'レポートは日本語で作成してください' },
  { value: '한국어', label: '한국어', guideline: '보고서는 한국어로 작성해 주세요' },
] as const

// ── LangGraph 节点定义（严格对齐后端 orchestrator.py） ────
// 后端流程: browser → planner → human → researcher → writer → publisher
// human 节点为条件分支: accept→researcher | revise→planner
export const FLOW_NODES = [
  { id: 'browser',    name: 'Browser',    role: '浏览采集网络信息', icon: '🌐' },
  { id: 'planner',    name: 'Planner',    role: '规划研报大纲', icon: '📋' },
  { id: 'human',      name: 'Human',      role: '人工审阅计划', icon: '👤' },
  { id: 'researcher', name: 'Researcher', role: '深度研究各章节', icon: '🔬' },
  { id: 'writer',     name: 'Writer',     role: '撰写报告内容', icon: '✍️' },
  { id: 'publisher',  name: 'Publisher',  role: '发布输出成果', icon: '📤' },
] as const

// ── 任务表格行（对应 FLOW_NODES） ─────────────────────────
export const TASK_ROWS = [
  { id: 1, name: '全网资料采集',   agent: 'Browser Agent' },
  { id: 2, name: '研报大纲规划',   agent: 'Planner Agent' },
  { id: 3, name: '人工审阅反馈',   agent: 'Human Agent' },
  { id: 4, name: '深度研究分析',   agent: 'Researcher Agent' },
  { id: 5, name: '报告内容撰写',   agent: 'Writer Agent' },
  { id: 6, name: '成果发布输出',   agent: 'Publisher Agent' },
]

// ── 日志 content → node 映射（基于后端真实 stream_output 调用） ──
// 后端实际发送的 content 值 → 对应的 LangGraph 节点
// 关键发现：
//   - browser 节点（ResearchAgent.run_initial_research）发送: starting_research, initial_research
//   - planner 节点（EditorAgent.plan_research）不发送任何 stream_output！
//   - human 节点（HumanAgent.review_plan）发送 type=human_feedback, content=request
//   - researcher 节点（EditorAgent.run_parallel_research）发送: parallel_research
//     底层研究器也会发送: subqueries, researching, added_source_url, context_combined 等
//   - writer 节点（WriterAgent.run）发送: writing_report, research_layout_content, rewriting_layout
//   - publisher 节点（PublisherAgent.run）发送: publishing
//   - main.py 收尾发送: research_report
//
// 注意：subqueries 实际是 researcher 节点内部子流程发送的，不是 planner！
export const CONTENT_TO_NODE: Record<string, string> = {
  // browser 节点
  starting_research: 'browser',
  initial_research: 'browser',
  mcp_init: 'browser',
  // planner 节点（后端 editor.py 新增的明确信号）
  planner_start: 'planner',
  plan: 'planner',
  planning_research: 'planner',
  // researcher 节点（包括其内部子流程的所有日志）
  parallel_research: 'researcher',
  subqueries: 'researcher',
  researching: 'researcher',
  added_source_url: 'researcher',
  context_combined: 'researcher',
  scraping_urls: 'researcher',
  scraping_content: 'researcher',
  scraping_images: 'researcher',
  scraping_complete: 'researcher',
  fetching_query_content: 'researcher',
  research_step_finalized: 'researcher',
  depth_research: 'researcher',
  research_logs: 'researcher',
  running_subquery_research: 'researcher',
  // ⚠️ writing_report 和 report_written 是 researcher 子流程写草稿，不是主 writer！
  writing_report: 'researcher',
  report_written: 'researcher',
  // writer 节点（主 writer 节点的明确开始信号）
  writer_start: 'writer',
  research_layout_content: 'writer',
  rewriting_layout: 'writer',
  review_feedback: 'writer',
  revision_notes: 'writer',
  draft: 'writer',
  // publisher 节点
  publisher_start: 'publisher',
  publishing: 'publisher',
  publish: 'publisher',
  research_report: 'publisher',
}

// ── 关键词兜底匹配：当 content 不在映射表时，用关键词推断节点 ──
export function inferNodeFromOutput(content: string, output: string): string | null {
  const text = `${content} ${output}`.toLowerCase()
  // publisher 优先匹配（避免被 writer 的 "report" 关键词捕获）
  if (/publish|发布|output|path|文件|research_report/.test(text)) return 'publisher'
  if (/writ|draft|layout|review|revis|撰写|报告内容/.test(text)) return 'writer'
  if (/human|feedback|审阅|人工/.test(text)) return 'human'
  if (/research|depth|parallel|研究|分析|scraping|scraped|context|source_url|subquer/.test(text)) return 'researcher'
  if (/plan|planner|大纲|规划/.test(text)) return 'planner'
  if (/browser|browse|搜索|采集|initial_research|starting_research|mcp/.test(text)) return 'browser'
  return null
}

export interface LogEntry {
  time: string
  text: string
  type: 'info' | 'success' | 'system' | 'warn' | 'error'
  agent: string
}

export type RunStage = 'idle' | 'running' | 'finished'

// ── 历史研报类型 ──────────────────────────────────────────
export interface HistoryReport {
  id: number
  topic: string
  model: string
  language: string
  status: string
  report_content: string
  elapsed_seconds: number
  created_at: string
}

// ── 积分费用 ──────────────────────────────────────────────
export const RESEARCH_COST = 2000

// 获取后端 WebSocket 地址（服务端私有环境变量，不打包进客户端 bundle）
export async function fetchWsUrl(): Promise<string> {
  try {
    const res = await fetch('/api/research/ws-url', { cache: 'no-store' })
    if (res.ok) {
      const data = await res.json()
      if (data.url) return data.url
    }
  } catch (err) {
    console.error('[fetchWsUrl]', err)
  }
  return ''
}
