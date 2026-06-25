'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import UserMenu from '@/components/layout/UserMenu'
import {
  LayoutDashboard, Sliders, ListTodo, FileText, Settings,
  ChevronDown, Plus, Bell,
  Check, Clock, ArrowRight, Pause,
  Copy, Download, BookOpen, Microscope, Coins,
  AlertCircle, RefreshCw, Globe, Trash2,
} from 'lucide-react'

// ── 预设模型 ──────────────────────────────────────────────
const MODEL_GROUPS = [
  {
    label: 'OpenAI',
    models: [
      { value: 'gpt-4o', label: 'GPT-4o', badge: '推荐' },
      { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
    ],
  },
  {
    label: 'DeepSeek',
    models: [
      { value: 'deepseek-chat', label: 'DeepSeek Chat', badge: '热门' },
      { value: 'deepseek-reasoner', label: 'DeepSeek Reasoner' },
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
const LANGUAGE_OPTIONS = [
  { value: '中文', label: '中文', guideline: '报告必须使用中文撰写' },
  { value: 'English', label: 'English', guideline: 'The report must be written in English' },
  { value: '日本語', label: '日本語', guideline: 'レポートは日本語で作成してください' },
  { value: '한국어', label: '한국어', guideline: '보고서는 한국어로 작성해 주세요' },
] as const

// ── LangGraph 节点定义（严格对齐后端 orchestrator.py） ────
// 后端流程: browser → planner → human → researcher → writer → publisher
// human 节点为条件分支: accept→researcher | revise→planner
const FLOW_NODES = [
  { id: 'browser',    name: 'Browser',    role: '浏览采集网络信息', icon: '🌐' },
  { id: 'planner',    name: 'Planner',    role: '规划研报大纲', icon: '📋' },
  { id: 'human',      name: 'Human',      role: '人工审阅计划', icon: '👤' },
  { id: 'researcher', name: 'Researcher', role: '深度研究各章节', icon: '🔬' },
  { id: 'writer',     name: 'Writer',     role: '撰写报告内容', icon: '✍️' },
  { id: 'publisher',  name: 'Publisher',  role: '发布输出成果', icon: '📤' },
] as const

// ── 任务表格行（对应 FLOW_NODES） ─────────────────────────
const TASK_ROWS = [
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
//     底层 GPTResearcher 也会发送: subqueries, researching, added_source_url, context_combined 等
//   - writer 节点（WriterAgent.run）发送: writing_report, research_layout_content, rewriting_layout
//   - publisher 节点（PublisherAgent.run）发送: publishing
//   - main.py 收尾发送: research_report
//
// 注意：subqueries 实际是 researcher 节点内部子流程发送的，不是 planner！
const CONTENT_TO_NODE: Record<string, string> = {
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
function inferNodeFromOutput(content: string, output: string): string | null {
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

interface LogEntry {
  time: string
  text: string
  type: 'info' | 'success' | 'system' | 'warn' | 'error'
  agent: string
}

type RunStage = 'idle' | 'running' | 'finished'

// ── 历史研报类型 ──────────────────────────────────────────
interface HistoryReport {
  id: number
  topic: string
  model: string
  language: string
  status: string
  report_content: string
  elapsed_seconds: number
  created_at: string
}

// ── 后端地址：优先用环境变量，否则用本地默认 ──────────────
const WS_BASE = process.env.NEXT_PUBLIC_GPT_RESEARCHER_URL || 'ws://localhost:8000'

// ── 积分费用 ──────────────────────────────────────────────
const RESEARCH_COST = 2000

export default function MultiAgentHub() {
  const { data: session } = useSession()

  // ── 导航 ──
  const [activeMenu, setActiveMenu] = useState<'工作台' | '配置中心' | '历史研报' | '运行日志' | '设置'>('配置中心')
  const [selectedProject, setSelectedProject] = useState('新建研报')
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'visual' | 'list'>('visual')

  // ── 配置参数 ──
  const [taskTopic, setTaskTopic] = useState('分析小米公司 2024 年财报，重点关注营收增长、手机业务、IoT 业务和汽车业务的表现，给出投资建议')
  const [selectedModel, setSelectedModel] = useState('mimo-v2.5-pro')
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false)
  const [maxSections, setMaxSections] = useState(5)
  const [maxPlanRevisions, setMaxPlanRevisions] = useState(3)
  const [followGuidelines, setFollowGuidelines] = useState(true)
  const [verbose, setVerbose] = useState(true)
  const [humanFeedback, setHumanFeedback] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState<string>('中文')
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false)
  const [guidelines, setGuidelines] = useState('报告必须使用中文撰写')

  // ── 运行状态 ──
  const [runStage, setRunStage] = useState<RunStage>('idle')
  const [currentNodeIdx, setCurrentNodeIdx] = useState(-1)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [reportContent, setReportContent] = useState('')
  const [showReportModal, setShowReportModal] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // ── 积分状态 ──
  const [points, setPoints] = useState<number | null>(null)
  const [pointsLoading, setPointsLoading] = useState(false)
  const [showInsufficientModal, setShowInsufficientModal] = useState(false)

  // ── 历史研报状态 ──
  const [historyReports, setHistoryReports] = useState<HistoryReport[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [viewingReport, setViewingReport] = useState<HistoryReport | null>(null)
  const [viewingLoading, setViewingLoading] = useState(false)

  // ── 人工反馈：计划内容 ──
  const [planContent, setPlanContent] = useState('')

  // ── 通知下拉 ──
  const [isNotifyOpen, setIsNotifyOpen] = useState(false)

  // ── refs ──
  const wsRef = useRef<WebSocket | null>(null)
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const logsEndRef = useRef<HTMLDivElement>(null)
  // 追踪是否已进入 writer 阶段（收到 writing_report 信号后才算）
  // 防止 researcher 子流程的 type=report 消息误触发 writer
  const reachedWriterRef = useRef(false)
  // 保存最新的报告内容（避免 WebSocket onmessage 闭包捕获旧 state）
  const reportContentRef = useRef('')
  // 记录每个节点的开始时间，用于动态计算进度条
  const nodeStartTimesRef = useRef<Record<string, number>>({})

  // ── 计时器 ──
  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    setElapsedTime(0)
    timerRef.current = setInterval(() => setElapsedTime(t => t + 1), 1000)
  }, [])
  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
  }, [])

  // ── 添加日志 ──
  const addLog = useCallback((text: string, type: LogEntry['type'] = 'info', agent = '系统') => {
    const time = new Date().toTimeString().split(' ')[0]
    setLogs(prev => [{ time, text, type, agent }, ...prev].slice(0, 200))
  }, [])

  // ── 设置当前节点（只前进不后退，避免日志乱序导致节点倒退） ──
  const setNodeActive = useCallback((nodeName: string) => {
    const idx = FLOW_NODES.findIndex(n => n.id === nodeName)
    if (idx < 0) return
    setCurrentNodeIdx(prev => {
      if (idx > prev) {
        // 进入新节点，记录开始时间（用于动态进度条）
        nodeStartTimesRef.current[nodeName] = Date.now()
      }
      return Math.max(prev, idx)
    })
  }, [])

  // ── 人类反馈状态 ──
  const [humanFeedbackPrompt, setHumanFeedbackPrompt] = useState('')
  const [humanFeedbackInput, setHumanFeedbackInput] = useState('')

  // ── 获取积分 ──
  const fetchPoints = useCallback(async () => {
    if (!session?.user) return
    setPointsLoading(true)
    try {
      const res = await fetch('/api/research/points', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        setPoints(data.points)
      }
    } catch (err) {
      console.error('[fetchPoints]', err)
    } finally {
      setPointsLoading(false)
    }
  }, [session])

  useEffect(() => {
    fetchPoints()
  }, [fetchPoints])

  // ── 获取历史研报列表 ──
  const fetchHistoryReports = useCallback(async () => {
    if (!session?.user) return
    setHistoryLoading(true)
    try {
      const res = await fetch('/api/research/reports', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        setHistoryReports(data.reports || [])
      }
    } catch (err) {
      console.error('[fetchHistoryReports]', err)
    } finally {
      setHistoryLoading(false)
    }
  }, [session])

  // ── 切换到历史研报时自动加载列表 ──
  useEffect(() => {
    if (activeMenu === '历史研报') fetchHistoryReports()
  }, [activeMenu, fetchHistoryReports])

  // ── 保存研报到数据库（生成完成后调用） ──
  const saveReportToDB = useCallback(async () => {
    if (!session?.user) return
    // 使用 ref 获取最新报告内容，避免 WebSocket onmessage 闭包捕获旧 state
    const content = reportContentRef.current
    if (!content) {
      addLog('报告内容为空，未保存到数据库', 'warn')
      return
    }
    try {
      await fetch('/api/research/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: taskTopic,
          model: selectedModel,
          language: selectedLanguage,
          status: 'finished',
          report_content: content,
          elapsed_seconds: elapsedTime,
        }),
      })
      addLog('研报已保存到历史记录', 'success')
    } catch (err) {
      console.error('[saveReportToDB]', err)
    }
  }, [session, taskTopic, selectedModel, selectedLanguage, elapsedTime, addLog])

  // ── 点击历史研报项，拉取完整正文 ──
  const openHistoryReport = useCallback(async (report: HistoryReport) => {
    setViewingLoading(true)
    setViewingReport(report) // 先展示元数据，避免空白
    try {
      const res = await fetch(`/api/research/reports/${report.id}`, { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        if (data.report) setViewingReport(data.report)
      }
    } catch (err) {
      console.error('[openHistoryReport]', err)
    } finally {
      setViewingLoading(false)
    }
  }, [])

  // ── 删除历史研报 ──
  const deleteHistoryReport = useCallback(async (reportId: number, e: React.MouseEvent) => {
    e.stopPropagation() // 阻止冒泡到卡片的 onClick
    if (!confirm('确定删除这份研报吗？此操作不可恢复。')) return
    try {
      const res = await fetch(`/api/research/reports/${reportId}`, { method: 'DELETE' })
      if (res.ok) {
        addLog('研报已删除', 'success')
        // 从列表中移除
        setHistoryReports(prev => prev.filter(r => r.id !== reportId))
        // 如果正在查看的就是被删除的研报，关闭 Modal
        setViewingReport(prev => prev?.id === reportId ? null : prev)
      } else {
        addLog('删除失败', 'error')
      }
    } catch (err) {
      console.error('[deleteHistoryReport]', err)
      addLog('删除失败', 'error')
    }
  }, [addLog])

  // ── WebSocket 消息处理 ──
  const handleMessage = useCallback((data: any) => {
    if (data.type === 'logs') {
      const content = data.content || ''
      const output = typeof data.output === 'string' ? data.output : JSON.stringify(data.output, null, 2)

      // research_report 是后端 main.py 发送的最终完整报告，提取到 reportContent
      if (content === 'research_report' && output) {
        reportContentRef.current = output
        setReportContent(output)
      }

      // 精准追踪：先用映射表，再用关键词兜底
      const node = CONTENT_TO_NODE[content] || inferNodeFromOutput(content, output)

      // 状态机：根据映射结果设置当前节点
      if (node) setNodeActive(node)

      // writer_start 是主 writer 节点的明确开始信号（区别于子流程的 writing_report）
      if (content === 'writer_start') {
        reachedWriterRef.current = true
      }

      addLog(`[${content}] ${output}`, 'info', node || '系统')
      // 捕获研究计划内容（planner 阶段的 plan 信号）
      if (content === 'plan' || content === 'planner_start') {
        setPlanContent(prev => prev ? `${prev}\n\n${output}` : output)
      }
    } else if (data.type === 'report') {
      // report 消息可能是 researcher 子流程的草稿报告，也可能是 writer 的最终报告
      // 只有当已经收到 writing_report 信号（reachedWriterRef=true）时，才视为 writer 阶段
      if (reachedWriterRef.current) {
        const chunk = data.output || ''
        reportContentRef.current += chunk
        setReportContent(prev => prev + chunk)
        setNodeActive('writer')
      } else {
        // researcher 子流程的草稿报告，不更新节点，只记录日志
        addLog(`[草稿片段] ${data.output?.slice(0, 100) || ''}...`, 'info', 'researcher')
      }
    } else if (data.type === 'path') {
      // path 消息表示后端已生成文件，整个流程完成
      addLog(`报告已保存: ${JSON.stringify(data.output)}`, 'success')
      setNodeActive('publisher')
      setRunStage('finished')
      setCurrentNodeIdx(FLOW_NODES.length)
      stopTimer()
      addLog('🎉 研报生成完成！', 'success')
      // 生成完成后刷新积分 + 保存研报到数据库
      fetchPoints()
      saveReportToDB()
    } else if (data.type === 'human_feedback') {
      // 后端请求人类反馈，弹出输入框等待用户回复
      addLog(`请求人工审阅研究计划`, 'system', 'HumanAgent')
      // 进入 human 节点
      setNodeActive('human')
      // 强制使用中文提示
      setHumanFeedbackPrompt('请对上述研究计划提供您的反馈意见。您可以提出修改建议，或确认计划无误。留空提交表示接受当前计划。')
      setHumanFeedbackInput('')
    } else if (data.type === 'error') {
      addLog(`错误: ${data.output}`, 'error')
      setErrorMsg(data.output || '生成失败')
      setRunStage('idle')
      stopTimer()
    }
  }, [addLog, setNodeActive, stopTimer, fetchPoints, saveReportToDB])

  // ── 连接 WebSocket ──
  const connectWS = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return wsRef.current

    addLog(`正在连接 ${WS_BASE}/ws ...`, 'system')
    const ws = new WebSocket(`${WS_BASE}/ws`)
    wsRef.current = ws

    ws.onopen = () => {
      addLog('WebSocket 连接成功', 'success')
      // 心跳保活：每 25 秒发一次 ping，避开 Render 30 秒空闲超时
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current)
      pingIntervalRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send('ping')
        }
      }, 25000)
    }
    ws.onmessage = (e) => {
      try { handleMessage(JSON.parse(e.data)) }
      catch { addLog(e.data, 'info') }
    }
    ws.onerror = () => {
      addLog('WebSocket 连接失败，请确认后端服务已启动', 'error')
      setErrorMsg('无法连接到后端服务，请检查 gpt-researcher 是否运行')
      setRunStage('idle')
      stopTimer()
    }
    ws.onclose = () => {
      addLog('WebSocket 已断开', 'warn')
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current)
        pingIntervalRef.current = null
      }
    }
    return ws
  }, [addLog, handleMessage, stopTimer])

  // ── 扣费并启动研报生成 ──
  const startGeneration = async () => {
    if (!taskTopic.trim()) { setErrorMsg('请输入研究主题'); return }
    if (!session?.user) { setErrorMsg('请先登录'); return }
    // 防重复点击：正在运行或正在扣费时不允许再次点击
    if (runStage === 'running' || pointsLoading) return

    setErrorMsg('')

    // 1. 先扣费
    setPointsLoading(true)
    try {
      const res = await fetch('/api/research/points', { method: 'POST', cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 402) {
          setShowInsufficientModal(true)
          setPoints(data.current)
          return
        }
        setErrorMsg(data.error || '扣费失败')
        return
      }
      setPoints(data.remaining)
      addLog(`已扣除 ${RESEARCH_COST} 积分启动深度研究，剩余 ${data.remaining} 积分`, 'system')
    } catch (err) {
      setErrorMsg('网络错误，请稍后重试')
      console.error('[startGeneration deduct]', err)
      return
    } finally {
      setPointsLoading(false)
    }

    // 2. 启动生成
    setReportContent('')
    reportContentRef.current = ''
    nodeStartTimesRef.current = {}
    setPlanContent('')
    setLogs([])
    setCurrentNodeIdx(-1)
    setRunStage('running')
    setActiveMenu('工作台')
    reachedWriterRef.current = false
    startTimer()

    // 根据语言构建 guidelines
    const langOption = LANGUAGE_OPTIONS.find(l => l.value === selectedLanguage)
    const finalGuidelines = guidelines.trim()
      ? `${langOption?.guideline ?? '报告必须使用中文撰写'} | ${guidelines.trim()}`
      : (langOption?.guideline ?? '报告必须使用中文撰写')

    addLog(`开始生成研报：${taskTopic}`, 'system')
    addLog(`模型: ${selectedModel} | 语言: ${selectedLanguage} | 章节数: ${maxSections}`, 'info')

    const message = {
      task: taskTopic,
      report_type: 'multi_agents',
      report_source: 'web',
      tone: 'Objective',
      headers: {
        model: selectedModel,
        max_sections: maxSections,
        max_plan_revisions: maxPlanRevisions,
        follow_guidelines: followGuidelines,
        guidelines: [finalGuidelines],
        verbose,
        include_human_feedback: humanFeedback,
        publish_formats: { markdown: true, pdf: false, docx: false },
        // 传递语言设置，后端会据此设置 config.language
        language: selectedLanguage === '中文' ? 'chinese' : selectedLanguage === 'English' ? 'english' : selectedLanguage === '日本語' ? 'japanese' : selectedLanguage === '한국어' ? 'korean' : 'english',
      },
    }

    const ws = connectWS()
    const sendTask = () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send('start ' + JSON.stringify(message))
        addLog('任务已发送到后端', 'success')
      } else {
        setTimeout(sendTask, 200)
      }
    }
    sendTask()
  }

  // ── 取消 ──
  const handleCancel = () => {
    setRunStage('idle')
    stopTimer()
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    addLog('用户取消生成', 'warn')
  }

  // ── 清理 ──
  useEffect(() => {
    return () => {
      stopTimer()
      if (wsRef.current) wsRef.current.close()
    }
  }, [stopTimer])

  // ── 格式化时间 ──
  const formatTime = (s: number) => `${Math.floor(s / 60)}m ${s % 60}s`

  // ── 下载 Markdown ──
  const downloadMd = () => {
    const blob = new Blob([reportContent], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `research-${Date.now()}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ── 复制全文 ──
  const copyAll = async () => {
    try {
      await navigator.clipboard.writeText(reportContent)
      addLog('已复制到剪贴板', 'success')
    } catch {
      addLog('复制失败', 'error')
    }
  }

  // ── 提交人类反馈 ──
  const submitHumanFeedback = () => {
    const feedback = humanFeedbackInput.trim() || 'no'
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'human_feedback',
        content: feedback,
      }))
      addLog(`已提交人工反馈: ${feedback === 'no' ? '接受当前计划' : feedback}`, 'success', 'HumanAgent')
      setHumanFeedbackPrompt('')
      setHumanFeedbackInput('')
      // 提交后从 human 节点推进到 researcher（accept 分支）
      setNodeActive('researcher')
    } else {
      addLog('WebSocket 未连接，无法提交反馈', 'error')
    }
  }

  const isRunning = runStage === 'running'
  const isFinished = runStage === 'finished'
  const canUsePoints = points !== null && points >= RESEARCH_COST

  // ── 任务表格行状态计算 ──
  const getTaskStatus = (taskId: number) => {
    const nodeIdx = taskId - 1 // task id 1-6 对应 node idx 0-5
    if (isFinished) return 'completed'
    if (nodeIdx < currentNodeIdx) return 'completed'
    if (nodeIdx === currentNodeIdx) return 'running'
    return 'waiting'
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F7F9FC] flex flex-col lg:flex-row">
      {/* ── 左侧导航 ── */}
      <aside className="w-full lg:w-64 bg-white border-r border-gray-100 flex flex-col justify-between shrink-0">
        <div>
          {/* Logo */}
          <div className="h-16 flex items-center px-6 border-b border-gray-50 gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white shadow-sm">
              <Microscope className="w-4 h-4" />
            </div>
            <span className="font-bold text-base text-gray-800">深度研究</span>
          </div>

          <nav className="mt-5 px-3 space-y-1">
            {[
              { id: '工作台' as const, label: '工作台', icon: LayoutDashboard },
              { id: '配置中心' as const, label: '配置中心', icon: Sliders },
              { id: '历史研报' as const, label: '历史研报', icon: ListTodo },
              { id: '运行日志' as const, label: '运行日志', icon: FileText },
              { id: '设置' as const, label: '设置', icon: Settings },
            ].map(item => {
              const Icon = item.icon
              const isActive = activeMenu === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveMenu(item.id)}
                  className={`w-full flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                  }`}
                >
                  <Icon className={`w-4 h-4 mr-3 ${isActive ? 'text-blue-500' : 'text-gray-400'}`} />
                  {item.label}
                </button>
              )
            })}
          </nav>

          {/* 返回 Trending */}
          <div className="mt-6 px-3">
            <Link
              href="/skills"
              className="w-full flex items-center px-4 py-2.5 rounded-xl text-xs font-medium text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-all"
            >
              <ArrowRight className="w-3.5 h-3.5 mr-2 rotate-180" />
              返回 Trending
            </Link>
          </div>
        </div>

        {/* 系统状态卡片 */}
        <div className="p-4 border-t border-gray-50">
          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">系统状态</span>
              <div className="flex items-center">
                <span className={`w-2 h-2 rounded-full mr-1.5 ${isRunning ? 'bg-blue-500 animate-pulse' : 'bg-green-500'}`} />
                <span className={`text-[10px] font-medium ${isRunning ? 'text-blue-600' : 'text-green-600'}`}>
                  {isRunning ? '运行中' : '就绪'}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-y-2 text-[10px]">
              <div>
                <span className="text-gray-400 block">Agent 总数</span>
                <span className="font-bold text-gray-800 text-sm">6</span>
              </div>
              <div>
                <span className="text-gray-400 block">已完成</span>
                <span className="font-bold text-gray-800 text-sm">
                  {isFinished ? FLOW_NODES.length : Math.max(0, currentNodeIdx)}
                </span>
              </div>
            </div>
            <div className="w-full bg-gray-200 h-1 rounded-full overflow-hidden mt-2">
              <div
                className="bg-blue-500 h-1 rounded-full transition-all duration-500"
                style={{ width: `${isFinished ? 100 : (currentNodeIdx >= 0 ? (currentNodeIdx / FLOW_NODES.length) * 100 : 0)}%` }}
              />
            </div>

            {/* 积分显示 */}
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                  <Coins className="w-3 h-3" /> 积分余额
                </span>
                <button
                  onClick={fetchPoints}
                  disabled={pointsLoading}
                  className="text-[10px] text-gray-400 hover:text-blue-500 transition-colors"
                  title="刷新"
                >
                  <RefreshCw className={`w-3 h-3 ${pointsLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className={`font-bold text-sm ${canUsePoints ? 'text-gray-800' : 'text-red-500'}`}>
                  {points === null ? '—' : points.toLocaleString()}
                </span>
                <span className="text-[9px] text-gray-400">/ {RESEARCH_COST} 每次研究</span>
              </div>
              {!session?.user && (
                <p className="text-[9px] text-amber-500 mt-1">请先登录</p>
              )}
              {session?.user && !canUsePoints && points !== null && (
                <p className="text-[9px] text-red-500 mt-1">积分不足</p>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* ── 主工作区 ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 轻量工具栏（非页眉，不 sticky） */}
        <div className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between shrink-0 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">快捷:</span>
            <div className="relative">
              <button
                onClick={() => {
                  setIsProjectDropdownOpen(!isProjectDropdownOpen)
                  if (!isProjectDropdownOpen) fetchHistoryReports()
                }}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 hover:border-gray-300 rounded-lg text-xs font-medium text-gray-700 transition-all"
              >
                <span>{selectedProject}</span>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
              </button>
              {isProjectDropdownOpen && (
                <div className="absolute left-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50 max-h-96 overflow-y-auto">
                  <div className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase border-b border-gray-50">
                    历史研报快速回忆
                  </div>
                  {historyReports.length === 0 ? (
                    <div className="px-4 py-6 text-center text-xs text-gray-400">
                      暂无历史研报<br />
                      <button
                        onClick={() => { setActiveMenu('配置中心'); setIsProjectDropdownOpen(false) }}
                        className="text-blue-500 hover:underline mt-1"
                      >
                        去创建第一份研报
                      </button>
                    </div>
                  ) : (
                    historyReports.slice(0, 10).map(report => (
                      <button
                        key={report.id}
                        onClick={async () => {
                          // 重置工作台状态
                          setRunStage('idle')
                          setCurrentNodeIdx(-1)
                          setReportContent('')
                          reportContentRef.current = ''
                          nodeStartTimesRef.current = {}
                          setPlanContent('')
                          setLogs([])
                          setErrorMsg('')
                          setHumanFeedbackPrompt('')
                          setHumanFeedbackInput('')
                          stopTimer()
                          setElapsedTime(0)

                          // 加载历史研报配置
                          setTaskTopic(report.topic)
                          setSelectedModel(report.model)
                          setSelectedLanguage(report.language)
                          setSelectedProject(report.topic.slice(0, 20) + (report.topic.length > 20 ? '...' : ''))
                          setIsProjectDropdownOpen(false)

                          // 拉取完整报告内容
                          try {
                            const res = await fetch(`/api/research/reports/${report.id}`, { cache: 'no-store' })
                            if (res.ok) {
                              const data = await res.json()
                              if (data.report) {
                                const content = data.report.report_content || ''
                                reportContentRef.current = content
                                setReportContent(content)
                                setElapsedTime(data.report.elapsed_seconds || 0)
                              }
                            }
                          } catch (err) {
                            console.error('[快捷入口加载报告]', err)
                          }

                          // 跳转到工作台，以完成状态展示报告
                          setRunStage('finished')
                          setCurrentNodeIdx(FLOW_NODES.length)
                          setActiveMenu('工作台')
                          addLog(`已加载历史研报: ${report.topic.slice(0, 30)}...`, 'info')
                        }}
                        className="w-full text-left px-4 py-2.5 hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-0"
                      >
                        <div className="text-xs font-medium text-gray-700 truncate">{report.topic}</div>
                        <div className="flex items-center gap-2 mt-1 text-[9px] text-gray-400">
                          <span>{report.language}</span>
                          <span className="font-mono">{report.model}</span>
                          <span>{new Date(report.created_at).toLocaleDateString('zh-CN')}</span>
                        </div>
                      </button>
                    ))
                  )}
                  <div className="px-4 py-2 border-t border-gray-50">
                    <button
                      onClick={() => { setActiveMenu('历史研报'); setIsProjectDropdownOpen(false) }}
                      className="w-full text-center text-[10px] text-blue-500 hover:underline py-1"
                    >
                      查看全部历史研报 →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* 积分快捷显示 */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg">
              <Coins className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-xs font-bold text-amber-700">
                {points === null ? '—' : points.toLocaleString()}
              </span>
            </div>
            <button
              onClick={() => {
                setActiveMenu('配置中心')
                setRunStage('idle')
                setErrorMsg('')
                setReportContent('')
                setLogs([])
                setCurrentNodeIdx(-1)
                setSelectedProject('新建研报')
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-medium transition-all shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              新建研报
            </button>
            <div className="w-px h-5 bg-gray-200" />
            {/* 通知下拉 */}
            <div className="relative">
              <button
                onClick={() => setIsNotifyOpen(!isNotifyOpen)}
                className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-50 relative"
              >
                <Bell className="w-4 h-4" />
                {logs.some(l => l.type === 'error') && (
                  <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </button>
              {isNotifyOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
                  <div className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase border-b border-gray-50">
                    系统通知
                  </div>
                  {logs.length === 0 ? (
                    <div className="px-4 py-6 text-center text-xs text-gray-400">暂无通知</div>
                  ) : (
                    logs.slice(0, 5).map((log, idx) => (
                      <div key={idx} className="px-4 py-2.5 border-b border-gray-50 last:border-0">
                        <div className="flex items-center gap-2">
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            log.type === 'error' ? 'bg-red-500'
                            : log.type === 'success' ? 'bg-green-500'
                            : log.type === 'system' ? 'bg-blue-500'
                            : log.type === 'warn' ? 'bg-amber-500'
                            : 'bg-purple-500'
                          }`} />
                          <span className="text-[10px] text-gray-400 font-mono">{log.time}</span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1 truncate">{log.text}</p>
                      </div>
                    ))
                  )}
                  <div className="px-4 py-2 border-t border-gray-50">
                    <button
                      onClick={() => { setActiveMenu('运行日志'); setIsNotifyOpen(false) }}
                      className="w-full text-center text-[10px] text-blue-500 hover:underline py-1"
                    >
                      查看全部日志 →
                    </button>
                  </div>
                </div>
              )}
            </div>
            {/* 用户头像菜单（复用博客 Navbar 的 UserMenu 组件） */}
            <div className="w-px h-5 bg-gray-200" />
            <UserMenu />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* ── 工作台视图 ── */}
          {activeMenu === '工作台' && (
            <div className="flex flex-col xl:flex-row min-h-full">
              <div className="flex-1 p-6 space-y-6 min-w-0">
                {/* 错误提示 */}
                {errorMsg && (
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-600 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* 完成提示 */}
                {isFinished && (
                  <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center">
                        <Check className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-green-900">研报生成完成！</h4>
                        <p className="text-xs text-green-700 mt-0.5">多 Agent 协同工作已全部通过检验</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowReportModal(true)}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      查看研报
                    </button>
                  </div>
                )}

                {/* 空状态 */}
                {runStage === 'idle' && !errorMsg && (
                  <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center">
                    <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Microscope className="w-8 h-8" />
                    </div>
                    <h3 className="text-base font-bold text-gray-800 mb-2">多 Agent 协作工作台</h3>
                    <p className="text-xs text-gray-400 mb-6 max-w-md mx-auto">
                      6 个 AI Agent 将协同完成：浏览采集 → 规划大纲 → 人工审阅 → 深度研究 → 撰写报告 → 发布输出
                    </p>
                    <button
                      onClick={() => setActiveMenu('配置中心')}
                      className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-bold rounded-xl transition-all shadow-sm"
                    >
                      前往配置中心开始
                    </button>
                  </div>
                )}

                {/* 流程看板 */}
                {(isRunning || isFinished) && (
                  <section className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                      <div>
                        <div className="flex items-center gap-2.5">
                          <h2 className="text-sm font-bold text-gray-800">多 Agent 协作流程</h2>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${
                            isRunning ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'bg-green-50 text-green-600 border border-green-200'
                          }`}>
                            {isRunning ? '运行中' : '已完成'}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-400 mt-1">LangGraph 编排 6 个 Agent 协同工作</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* 视图切换 */}
                        <div className="inline-flex rounded-lg border border-gray-200 p-0.5 bg-gray-50">
                          <button
                            onClick={() => setViewMode('visual')}
                            className={`px-3 py-1 text-[11px] font-medium rounded-md transition-all ${
                              viewMode === 'visual' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400'
                            }`}
                          >
                            可视化
                          </button>
                          <button
                            onClick={() => setViewMode('list')}
                            className={`px-3 py-1 text-[11px] font-medium rounded-md transition-all ${
                              viewMode === 'list' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400'
                            }`}
                          >
                            列表
                          </button>
                        </div>
                        {isRunning && (
                          <button
                            onClick={handleCancel}
                            className="p-1.5 border border-gray-200 rounded-lg text-gray-600 bg-white hover:bg-gray-50"
                            title="取消生成"
                          >
                            <Pause className="w-4 h-4 text-amber-500" />
                          </button>
                        )}
                      </div>
                    </div>

                    {viewMode === 'visual' ? (
                      <>
                        {/* 节点流程 — 响应式网格，无需横向滚动 */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {FLOW_NODES.map((node, index) => {
                            const isCompleted = currentNodeIdx > index || isFinished
                            const isRunningNode = currentNodeIdx === index && !isFinished
                            const isWaiting = !isCompleted && !isRunningNode
                            return (
                              <div
                                key={node.id}
                                className={`relative bg-white border rounded-xl p-4 transition-all duration-300 ${
                                  isRunningNode
                                    ? 'border-2 border-blue-500 shadow-lg shadow-blue-500/10 scale-[1.02]'
                                    : isCompleted
                                    ? 'border-green-400 bg-green-50/30'
                                    : 'border-gray-200 border-dashed opacity-60'
                                }`}
                              >
                                {/* 步骤编号 */}
                                <div className="absolute top-3 right-3 flex items-center gap-1.5">
                                  <span className="text-[9px] font-bold text-gray-300">#{index + 1}</span>
                                  {isCompleted && (
                                    <div className="w-4 h-4 rounded-full bg-green-500 text-white flex items-center justify-center shadow">
                                      <Check className="w-2.5 h-2.5" />
                                    </div>
                                  )}
                                  {isRunningNode && (
                                    <div className="w-4 h-4 rounded-full bg-blue-500 animate-ping" />
                                  )}
                                </div>
                                {/* 图标 + 名称 */}
                                <div className="flex items-center gap-2 mb-2">
                                  <span className={`text-2xl ${isRunningNode ? 'animate-bounce' : ''}`}>{node.icon}</span>
                                  <div>
                                    <h3 className="text-xs font-bold text-gray-800">{node.name}</h3>
                                    <div className="mt-0.5">
                                      {isCompleted && <span className="text-[9px] text-green-600 bg-green-50 px-1.5 py-0.5 rounded font-medium">已完成</span>}
                                      {isRunningNode && <span className="text-[9px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-medium animate-pulse">运行中</span>}
                                      {isWaiting && <span className="text-[9px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded font-medium">等待</span>}
                                    </div>
                                  </div>
                                </div>
                                <p className="text-[10px] text-gray-400 leading-relaxed mb-2">{node.role}</p>
                                <div className="flex items-center gap-1 text-[9px] text-gray-400 border-t border-gray-50 pt-2">
                                  <Clock className="w-3 h-3" />
                                  <span>{isRunningNode ? formatTime(elapsedTime) : isCompleted ? '已完成' : '—'}</span>
                                </div>
                              </div>
                            )
                          })}
                        </div>

                        {/* 计数底栏 */}
                        <div className="mt-6 flex items-center gap-6 border-t border-gray-50 pt-4 text-xs">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-green-500" />
                            <span className="text-gray-500">已完成</span>
                            <span className="font-bold text-gray-800 bg-green-50 px-1.5 rounded">
                              {isFinished ? FLOW_NODES.length : Math.max(0, currentNodeIdx)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-blue-500" />
                            <span className="text-gray-500">运行中</span>
                            <span className="font-bold text-gray-800 bg-blue-50 px-1.5 rounded">{isRunning ? 1 : 0}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-gray-300" />
                            <span className="text-gray-500">等待中</span>
                            <span className="font-bold text-gray-800 bg-gray-100 px-1.5 rounded">
                              {isFinished ? 0 : FLOW_NODES.length - Math.max(0, currentNodeIdx) - (isRunning ? 1 : 0)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 ml-auto">
                            <Clock className="w-3.5 h-3.5 text-gray-400" />
                            <span className="text-gray-500">总用时</span>
                            <span className="font-bold text-gray-800 font-mono">{formatTime(elapsedTime)}</span>
                          </div>
                        </div>
                      </>
                    ) : (
                      /* 列表视图 */
                      <div className="divide-y divide-gray-100 py-3 text-xs">
                        {FLOW_NODES.map((node, idx) => {
                          const status = getTaskStatus(idx + 1)
                          return (
                            <div key={node.id} className="py-3 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <span className="text-lg">{node.icon}</span>
                                <div>
                                  <span className="font-medium text-gray-700 block">{node.name}</span>
                                  <span className="text-[10px] text-gray-400">{node.role}</span>
                                </div>
                              </div>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                                status === 'completed' ? 'bg-green-50 text-green-600'
                                : status === 'running' ? 'bg-blue-50 text-blue-600 animate-pulse'
                                : 'bg-gray-100 text-gray-400'
                              }`}>
                                {status === 'completed' ? '已完成' : status === 'running' ? '运行中' : '等待中'}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </section>
                )}

                {/* 任务进度表格 */}
                {(isRunning || isFinished) && (
                  <section className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-sm font-bold text-gray-800">任务进度</h2>
                      <span className="text-[10px] text-gray-400">共 {TASK_ROWS.length} 个任务</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-gray-100 text-gray-400 font-semibold">
                            <th className="pb-3 pr-4">任务名称</th>
                            <th className="pb-3 pr-4">负责 Agent</th>
                            <th className="pb-3 pr-4">状态</th>
                            <th className="pb-3 pr-4">进度</th>
                            <th className="pb-3 pr-4">耗时</th>
                            <th className="pb-3 text-right">操作</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {TASK_ROWS.map(task => {
                            const status = getTaskStatus(task.id)
                            // 动态进度：基于节点已运行时间计算，而非硬编码
                            const taskNodeIdx = task.id - 1
                            let progress = 0
                            if (status === 'completed') {
                              progress = 100
                            } else if (status === 'running') {
                              // 运行中的任务：从当前节点的 baseProgress 逐渐增长到下一节点的 baseProgress
                              const baseProgress = (taskNodeIdx / TASK_ROWS.length) * 100
                              const nextBaseProgress = ((taskNodeIdx + 1) / TASK_ROWS.length) * 100
                              const nodeName = FLOW_NODES[taskNodeIdx].id
                              const startTime = nodeStartTimesRef.current[nodeName]
                              if (startTime) {
                                // 该节点已运行秒数
                                const nodeElapsed = Math.floor((Date.now() - startTime) / 1000)
                                // 每个节点预期 90 秒完成，进度从 baseProgress 增长到 nextBaseProgress - 3
                                const expectedDuration = 90
                                const ratio = Math.min(nodeElapsed / expectedDuration, 1)
                                progress = Math.min(Math.round(baseProgress + (nextBaseProgress - baseProgress - 3) * ratio), 95)
                              } else {
                                // 没有记录开始时间，使用默认值
                                progress = Math.min(Math.round(baseProgress + (100 / TASK_ROWS.length) * 0.3), 95)
                              }
                            }
                            return (
                              <tr key={task.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="py-3 pr-4 font-medium text-gray-800">{task.name}</td>
                                <td className="py-3 pr-4 text-gray-600">
                                  <span className="px-2 py-0.5 bg-gray-100 rounded text-[10px]">{task.agent}</span>
                                </td>
                                <td className="py-3 pr-4">
                                  {status === 'completed' && <span className="text-green-600 bg-green-50 px-1.5 py-0.5 rounded font-medium">已完成</span>}
                                  {status === 'running' && <span className="text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-medium animate-pulse">运行中</span>}
                                  {status === 'waiting' && <span className="text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded font-medium">等待中</span>}
                                </td>
                                <td className="py-3 pr-4">
                                  <div className="flex items-center gap-2">
                                    <div className="w-20 bg-gray-100 h-1.5 rounded-full overflow-hidden">
                                      <div
                                        className={`h-full rounded-full transition-all duration-500 ${
                                          status === 'completed' ? 'bg-green-500'
                                          : status === 'running' ? 'bg-blue-500'
                                          : 'bg-gray-200'
                                        }`}
                                        style={{ width: `${progress}%` }}
                                      />
                                    </div>
                                    <span className="font-semibold text-gray-500 w-8">{progress}%</span>
                                  </div>
                                </td>
                                <td className="py-3 pr-4 text-gray-400">
                                  {status === 'running' ? formatTime(elapsedTime) : status === 'completed' ? '已完成' : '—'}
                                </td>
                                <td className="py-3 text-right">
                                  <button
                                    onClick={() => isFinished && setShowReportModal(true)}
                                    className={`text-blue-500 font-semibold hover:underline text-[11px] ${
                                      isFinished ? '' : 'opacity-50 cursor-not-allowed'
                                    }`}
                                  >
                                    查看
                                  </button>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </section>
                )}
              </div>

              {/* 右侧实时日志 */}
              {(isRunning || isFinished || logs.length > 0) && (
                <aside className="w-full xl:w-80 border-t xl:border-t-0 xl:border-l border-gray-100 bg-white p-6 shrink-0 flex flex-col">
                  <div className="flex items-center justify-between border-b border-gray-50 pb-2 mb-3">
                    <h2 className="text-sm font-bold text-gray-800">实时日志</h2>
                    <span className="text-[10px] text-gray-400">{logs.length} 条</span>
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[500px]">
                    {logs.length === 0 ? (
                      <p className="text-xs text-gray-300 text-center py-8">等待日志...</p>
                    ) : (
                      logs.map((log, idx) => (
                        <div key={idx} className="flex gap-2 text-[11px] items-start leading-relaxed">
                          <span className="text-gray-400 font-mono shrink-0">{log.time}</span>
                          <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                            log.type === 'success' ? 'bg-green-500'
                            : log.type === 'error' ? 'bg-red-500'
                            : log.type === 'system' ? 'bg-blue-500'
                            : log.type === 'warn' ? 'bg-amber-500'
                            : 'bg-purple-500'
                          }`} />
                          <div className="min-w-0">
                            <span className="text-gray-700 font-semibold mr-1">{log.agent}:</span>
                            <span className={`break-words ${
                              log.type === 'error' ? 'text-red-500'
                              : log.type === 'success' ? 'text-green-600'
                              : 'text-gray-500'
                            }`}>{log.text}</span>
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={logsEndRef} />
                  </div>
                </aside>
              )}
            </div>
          )}

          {/* ── 配置中心视图 ── */}
          {activeMenu === '配置中心' && (
            <div className="p-6 max-w-3xl mx-auto space-y-6">
              <div className="border-b border-gray-100 pb-4">
                <h1 className="text-lg font-bold text-gray-800">新建深度研报</h1>
                <p className="text-xs text-gray-400 mt-1">
                  设置研究主题，多 Agent 将自动完成全网采集、大纲规划与报告编写
                </p>
              </div>

              {/* 积分提示条 */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                    <Coins className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-amber-900">深度研究服务</h4>
                    <p className="text-xs text-amber-700 mt-0.5">每次生成消耗 {RESEARCH_COST} 积分</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-amber-600 uppercase tracking-wider">当前余额</p>
                  <p className={`text-lg font-bold ${canUsePoints ? 'text-amber-900' : 'text-red-500'}`}>
                    {points === null ? '—' : points.toLocaleString()}
                  </p>
                </div>
              </div>

              {errorMsg && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-600 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-6">
                {/* 研究主题 */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-gray-500">研究主题</label>
                  <textarea
                    value={taskTopic}
                    onChange={e => setTaskTopic(e.target.value)}
                    className="w-full text-sm p-4 border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    rows={4}
                    placeholder="请输入研究主题..."
                  />
                  <div className="flex flex-wrap gap-2 mt-2">
                    {[
                      { label: '🍷 贵州茅台估值', text: '深度剖析贵州茅台2025年估值模型、产品价格体系与品牌护城河' },
                      { label: '🚗 新能源车格局', text: '新能源汽车行业2026年终大盘点：比亚迪、特斯拉与蔚小理竞争壁垒及市占预测' },
                      { label: '📱 小米人车家生态', text: '小米集团2024财报深度挖掘：聚焦人车家全生态变现能力与汽车毛利表现' },
                    ].map(t => (
                      <button
                        key={t.label}
                        onClick={() => setTaskTopic(t.text)}
                        className="text-xs px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors"
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 模型 + 语言 + 章节数 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="relative">
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">大语言模型</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={selectedModel}
                        onChange={e => setSelectedModel(e.target.value)}
                        className="w-full text-sm p-3 pr-10 border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono text-gray-700"
                        placeholder="输入模型名称或选择预设"
                      />
                      <button
                        type="button"
                        onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <ChevronDown className={`w-4 h-4 transition-transform ${isModelDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>
                    </div>
                    {isModelDropdownOpen && (
                      <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto">
                        {MODEL_GROUPS.map(group => (
                          <div key={group.label} className="py-1">
                            <div className="px-3 py-1 text-[10px] font-bold text-gray-400 bg-gray-50 uppercase">{group.label}</div>
                            {group.models.map(m => (
                              <button
                                key={m.value}
                                onClick={() => { setSelectedModel(m.value); setIsModelDropdownOpen(false) }}
                                className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-blue-50 flex items-center justify-between"
                              >
                                <span className="font-mono">{m.value}</span>
                                {m.badge && <span className="text-[9px] bg-blue-50 text-blue-500 px-1 rounded font-bold">{m.badge}</span>}
                              </button>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 语言选择 */}
                  <div className="relative">
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5 flex items-center gap-1">
                      <Globe className="w-3 h-3" /> 生成语言
                    </label>
                    <button
                      onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                      className="w-full text-sm p-3 border border-gray-200 rounded-xl bg-gray-50/50 flex items-center justify-between hover:border-gray-300 transition-all"
                    >
                      <span className="text-gray-700">{selectedLanguage}</span>
                      <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isLangDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isLangDropdownOpen && (
                      <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-50">
                        {LANGUAGE_OPTIONS.map(lang => (
                          <button
                            key={lang.value}
                            onClick={() => {
                              setSelectedLanguage(lang.value)
                              setGuidelines(lang.guideline)
                              setIsLangDropdownOpen(false)
                            }}
                            className="w-full text-left px-4 py-2.5 text-xs text-gray-700 hover:bg-blue-50 flex items-center justify-between"
                          >
                            <span className="font-medium">{lang.label}</span>
                            {selectedLanguage === lang.value && <Check className="w-3.5 h-3.5 text-blue-500" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                      最大章节数 ({maxSections} 章)
                    </label>
                    <input
                      type="range" min={3} max={10} value={maxSections}
                      onChange={e => setMaxSections(parseInt(e.target.value))}
                      className="w-full accent-blue-500 mt-3"
                    />
                  </div>
                </div>

                {/* 选项 */}
                <div className="border-t border-gray-50 pt-4 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <label className="flex items-center gap-2 cursor-pointer text-xs">
                      <input type="checkbox" checked={followGuidelines}
                        onChange={e => setFollowGuidelines(e.target.checked)}
                        className="w-4 h-4 rounded accent-blue-500" />
                      <span className="text-gray-600 font-semibold">遵守写作准则</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-xs">
                      <input type="checkbox" checked={verbose}
                        onChange={e => setVerbose(e.target.checked)}
                        className="w-4 h-4 rounded accent-blue-500" />
                      <span className="text-gray-600 font-semibold">详细日志</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-xs">
                      <input type="checkbox" checked={humanFeedback}
                        onChange={e => setHumanFeedback(e.target.checked)}
                        className="w-4 h-4 rounded accent-blue-500" />
                      <span className="text-blue-600 font-semibold">人工反馈审阅</span>
                    </label>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1.5">计划修订次数</label>
                      <input type="number" min={0} max={10} value={maxPlanRevisions}
                        onChange={e => setMaxPlanRevisions(parseInt(e.target.value) || 3)}
                        className="w-full text-sm p-2.5 border border-gray-200 rounded-lg bg-gray-50/50" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1.5">写作准则（附加）</label>
                      <input type="text" value={guidelines}
                        onChange={e => setGuidelines(e.target.value)}
                        className="w-full text-xs p-2.5 border border-gray-200 rounded-lg bg-gray-50/50" />
                    </div>
                  </div>
                </div>

                {/* 启动按钮 */}
                <div className="border-t border-gray-50 pt-6 space-y-3">
                  {/* 积分消耗提示 */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">本次操作将消耗</span>
                    <span className="font-bold text-amber-600 flex items-center gap-1">
                      <Coins className="w-3.5 h-3.5" />
                      {RESEARCH_COST} 积分
                    </span>
                  </div>
                  <button
                    onClick={startGeneration}
                    disabled={isRunning || pointsLoading || !session?.user || !canUsePoints}
                    className="w-full py-4 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-blue-500/10 flex items-center justify-center gap-2"
                  >
                    {!session?.user ? (
                      <><AlertCircle className="w-4 h-4" /> 请先登录</>
                    ) : !canUsePoints ? (
                      <><AlertCircle className="w-4 h-4" /> 积分不足（需 {RESEARCH_COST} 积分）</>
                    ) : isRunning ? (
                      <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> 生成中...</>
                    ) : pointsLoading ? (
                      <><RefreshCw className="w-4 h-4 animate-spin" /> 校验积分中...</>
                    ) : (
                      <>🚀 开始生成研报（消耗 {RESEARCH_COST} 积分）</>
                    )}
                  </button>
                  {session?.user && !canUsePoints && points !== null && (
                    <p className="text-center text-xs text-red-500">
                      当前积分 {points}，还差 {RESEARCH_COST - points} 积分
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── 历史研报视图 ── */}
          {activeMenu === '历史研报' && (
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-lg font-bold text-gray-800">历史研报</h1>
                  <p className="text-xs text-gray-400 mt-1">查看之前生成的深度研究报告</p>
                </div>
                <button
                  onClick={fetchHistoryReports}
                  disabled={historyLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-bold rounded-lg transition-all"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${historyLoading ? 'animate-spin' : ''}`} />
                  刷新
                </button>
              </div>

              {!session?.user ? (
                <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center">
                  <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-3">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <p className="text-sm text-gray-500">请先登录查看历史研报</p>
                </div>
              ) : historyLoading ? (
                <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center">
                  <RefreshCw className="w-6 h-6 text-blue-500 animate-spin mx-auto mb-3" />
                  <p className="text-xs text-gray-400">加载中...</p>
                </div>
              ) : historyReports.length === 0 ? (
                <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center">
                  <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
                    <ListTodo className="w-6 h-6" />
                  </div>
                  <p className="text-sm text-gray-500 mb-2">暂无历史研报</p>
                  <p className="text-xs text-gray-400">前往配置中心生成你的第一份深度研究报告</p>
                  <button
                    onClick={() => setActiveMenu('配置中心')}
                    className="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold rounded-xl transition-all"
                  >
                    前往配置中心
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {historyReports.map(report => (
                    <div
                      key={report.id}
                      className="bg-white border border-gray-100 rounded-2xl p-5 hover:border-blue-200 hover:shadow-sm transition-all cursor-pointer group"
                      onClick={() => openHistoryReport(report)}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-bold text-gray-800 truncate">{report.topic}</h3>
                          <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-400">
                            <span className="flex items-center gap-1">
                              <Globe className="w-3 h-3" /> {report.language}
                            </span>
                            <span className="font-mono">{report.model}</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {Math.floor(report.elapsed_seconds / 60)}m {report.elapsed_seconds % 60}s
                            </span>
                            <span>{new Date(report.created_at).toLocaleString('zh-CN')}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="px-2 py-1 bg-green-50 text-green-600 text-[10px] font-bold rounded">
                            已完成
                          </span>
                          <button
                            onClick={(e) => deleteHistoryReport(report.id, e)}
                            className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            title="删除研报"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── 运行日志视图 ── */}
          {activeMenu === '运行日志' && (
            <div className="p-6 space-y-4">
              <h1 className="text-lg font-bold text-gray-800">全链运行日志</h1>
              <div className="bg-[#1A1B1E] text-[#86C232] p-5 rounded-2xl font-mono text-xs max-h-[600px] overflow-y-auto space-y-1">
                <p className="text-gray-500">{'// LangGraph 节点日志'}</p>
                {logs.length === 0 ? (
                  <p className="text-gray-500">{'// 暂无日志'}</p>
                ) : (
                  logs.map((log, idx) => (
                    <p key={idx}>
                      <span className="text-gray-600">[{log.time}]</span>{' '}
                      <span className="text-blue-400">[{log.agent}]</span>{' '}
                      {log.text}
                    </p>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ── 设置视图 ── */}
          {activeMenu === '设置' && (
            <div className="p-6 max-w-2xl space-y-6">
              <h1 className="text-lg font-bold text-gray-800">系统设置</h1>
              <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4 text-xs">
                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                  <div>
                    <span className="font-bold text-gray-700 block">后端服务地址</span>
                    <span className="text-gray-400 block mt-0.5">gpt-researcher WebSocket 地址</span>
                  </div>
                  <code className="text-[10px] bg-gray-50 px-2 py-1 rounded font-mono text-gray-600">{WS_BASE}</code>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                  <div>
                    <span className="font-bold text-gray-700 block">详细日志模式</span>
                    <span className="text-gray-400 block mt-0.5">记录底层状态机各节点的变量状态流</span>
                  </div>
                  <input type="checkbox" defaultChecked className="accent-blue-500 w-4 h-4" />
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                  <div>
                    <span className="font-bold text-gray-700 block">深度研究费用</span>
                    <span className="text-gray-400 block mt-0.5">每次生成研报消耗的积分</span>
                  </div>
                  <span className="font-bold text-amber-600">{RESEARCH_COST} 积分</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <div>
                    <span className="font-bold text-gray-700 block">自动下载 Markdown</span>
                    <span className="text-gray-400 block mt-0.5">Publisher 完成后自动下载报告文件</span>
                  </div>
                  <input type="checkbox" className="accent-blue-500 w-4 h-4" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── 人类反馈弹窗（强制中文，含研究计划展示） ── */}
      {humanFeedbackPrompt && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-amber-500 text-white p-4 flex items-center gap-2 shrink-0">
              <span className="text-lg">🤖</span>
              <div>
                <h3 className="font-bold text-sm">人工审阅请求</h3>
                <p className="text-[10px] text-white/80 mt-0.5">HumanAgent 正在等待您的反馈</p>
              </div>
            </div>
            <div className="p-6 overflow-y-auto">
              <p className="text-sm text-gray-700 mb-3 leading-relaxed">{humanFeedbackPrompt}</p>
              {/* 研究计划内容展示 */}
              {planContent && (
                <div className="mb-4">
                  <div className="flex items-center gap-1.5 mb-2">
                    <FileText className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-xs font-bold text-gray-700">研究计划详情</span>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 max-h-60 overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-[11px] text-gray-600 font-mono leading-relaxed">{planContent}</pre>
                  </div>
                </div>
              )}
              <textarea
                value={humanFeedbackInput}
                onChange={e => setHumanFeedbackInput(e.target.value)}
                className="w-full text-sm p-3 border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                rows={3}
                placeholder="请输入您的反馈意见（中文）。留空提交表示接受当前计划。"
                autoFocus
              />
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => { setHumanFeedbackInput(''); setTimeout(submitHumanFeedback, 0) }}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-all"
                >
                  接受当前计划
                </button>
                <button
                  onClick={submitHumanFeedback}
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
                >
                  提交反馈
                </button>
              </div>
              <p className="text-[10px] text-gray-400 mt-3 text-center">
                提交后将进入 Researcher 节点继续深度研究
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── 积分不足弹窗 ── */}
      {showInsufficientModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
            <div className="bg-red-500 text-white p-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              <div>
                <h3 className="font-bold text-sm">积分不足</h3>
                <p className="text-[10px] text-white/80 mt-0.5">无法启动深度研究</p>
              </div>
            </div>
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Coins className="w-8 h-8" />
              </div>
              <p className="text-sm text-gray-700 mb-2">
                深度研究每次需要 <span className="font-bold text-amber-600">{RESEARCH_COST} 积分</span>
              </p>
              <p className="text-xs text-gray-400 mb-6">
                当前积分余额：<span className="font-bold text-gray-700">{points ?? 0}</span>
                ，还差 <span className="font-bold text-red-500">{RESEARCH_COST - (points ?? 0)}</span> 积分
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowInsufficientModal(false)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-all"
                >
                  稍后再说
                </button>
                <Link
                  href="/blog"
                  onClick={() => setShowInsufficientModal(false)}
                  className="flex-1 py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold rounded-xl transition-all"
                >
                  去阅读文章赚积分
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 研报预览 Modal ── */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl flex flex-col h-[85vh] overflow-hidden">
            <div className="bg-blue-500 text-white p-5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                <div>
                  <h3 className="font-bold text-sm">研报结果</h3>
                  <p className="text-[10px] text-white/80 mt-0.5">基于多 Agent 协作生成</p>
                </div>
              </div>
              <button
                onClick={() => setShowReportModal(false)}
                className="text-white hover:text-gray-100 font-bold bg-white/20 p-1.5 rounded-lg text-xs"
              >
                关闭 ✕
              </button>
            </div>
            <div className="flex-1 p-6 md:p-8 overflow-y-auto bg-[#FAFBFD]">
              {reportContent ? (
                <div className="prose max-w-none">
                  <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed">{reportContent}</pre>
                </div>
              ) : (
                <p className="text-gray-400 text-center py-12">暂无报告内容</p>
              )}
            </div>
            <div className="bg-gray-50 p-4 border-t border-gray-100 flex items-center justify-end gap-2 shrink-0">
              <button
                onClick={copyAll}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
              >
                <Copy className="w-4 h-4" />
                复制全文
              </button>
              <button
                onClick={downloadMd}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
              >
                <Download className="w-4 h-4" />
                下载 Markdown
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 历史研报查看 Modal ── */}
      {viewingReport && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl flex flex-col h-[85vh] overflow-hidden">
            <div className="bg-indigo-500 text-white p-5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <BookOpen className="w-5 h-5 shrink-0" />
                <div className="min-w-0">
                  <h3 className="font-bold text-sm truncate">{viewingReport.topic}</h3>
                  <p className="text-[10px] text-white/80 mt-0.5">
                    {viewingReport.language} · {viewingReport.model} · {Math.floor(viewingReport.elapsed_seconds / 60)}m {viewingReport.elapsed_seconds % 60}s
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingReport(null)}
                className="text-white hover:text-gray-100 font-bold bg-white/20 p-1.5 rounded-lg text-xs shrink-0"
              >
                关闭 ✕
              </button>
            </div>
            <div className="flex-1 p-6 md:p-8 overflow-y-auto bg-[#FAFBFD]">
              {viewingLoading ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <RefreshCw className="w-6 h-6 animate-spin mb-3" />
                  <p className="text-xs">正在加载报告内容...</p>
                </div>
              ) : viewingReport.report_content ? (
                <div className="prose max-w-none">
                  <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed">{viewingReport.report_content}</pre>
                </div>
              ) : (
                <p className="text-gray-400 text-center py-12">暂无报告内容</p>
              )}
            </div>
            <div className="bg-gray-50 p-4 border-t border-gray-100 flex items-center justify-end gap-2 shrink-0">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(viewingReport.report_content || '')
                }}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
              >
                <Copy className="w-4 h-4" />
                复制全文
              </button>
              <button
                onClick={() => {
                  const blob = new Blob([viewingReport.report_content || ''], { type: 'text/markdown;charset=utf-8' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `research-${viewingReport.id}.md`
                  a.click()
                  URL.revokeObjectURL(url)
                }}
                className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
              >
                <Download className="w-4 h-4" />
                下载 Markdown
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
