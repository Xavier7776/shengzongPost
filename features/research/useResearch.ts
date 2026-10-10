'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import {
  LANGUAGE_OPTIONS, FLOW_NODES, CONTENT_TO_NODE, inferNodeFromOutput, LogEntry, RunStage,
  HistoryReport, RESEARCH_COST, fetchWsUrl,
} from '@/features/research/lib/research'

export function useResearch() {
  const { data: session } = useSession()

  // ── 导航 ──
  const [activeMenu, setActiveMenu] = useState<'工作台' | '配置中心' | '历史研报' | '运行日志' | '设置'>('配置中心')
  const [selectedProject, setSelectedProject] = useState('新建研报')
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'visual' | 'list'>('visual')

  // ── 配置参数 ──
  const [taskTopic, setTaskTopic] = useState('分析苹果公司2026年财报，重点关注营收增长、手机业务等方面的表现，给出投资建议')
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
  const chargeRequestRef = useRef<{ userId: string; requestId: string } | null>(null)
  const chargingRef = useRef(false)

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
  const connectWS = useCallback(async () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return wsRef.current

    // 通过 API 获取后端地址，避免在客户端 bundle 中暴露
    const wsBase = await fetchWsUrl()
    if (!wsBase) {
      addLog('无法获取后端服务地址，请先登录', 'error')
      setErrorMsg('无法获取后端服务地址，请确认已登录')
      setRunStage('idle')
      stopTimer()
      return null
    }

    addLog('正在连接后端研究服务...', 'system')
    const ws = new WebSocket(`${wsBase}/ws`)
    wsRef.current = ws

    ws.onopen = () => {
      addLog('WebSocket 连接成功', 'success')
    }
    ws.onmessage = (e) => {
      try { handleMessage(JSON.parse(e.data)) }
      catch { addLog(e.data, 'info') }
    }
    ws.onerror = () => {
      addLog('WebSocket 连接失败，请确认后端服务已启动', 'error')
      setErrorMsg('无法连接到后端服务，请检查 MindStack 研究服务是否运行')
      setRunStage('idle')
      stopTimer()
    }
    ws.onclose = () => {
      addLog('WebSocket 已断开', 'warn')
    }
    return ws
  }, [addLog, handleMessage, stopTimer])

  // ── 扣费并启动研报生成 ──
  const startGeneration = async () => {
    if (!taskTopic.trim()) { setErrorMsg('请输入研究主题'); return }
    if (!session?.user) { setErrorMsg('请先登录'); return }
    // 防重复点击：正在运行或正在扣费时不允许再次点击
    if (runStage === 'running' || pointsLoading || chargingRef.current) return

    setErrorMsg('')

    // 1. 先扣费
    setPointsLoading(true)
    chargingRef.current = true
    const userId = String((session.user as { id?: string }).id)
    if (chargeRequestRef.current?.userId !== userId) {
      chargeRequestRef.current = { userId, requestId: crypto.randomUUID() }
    }
    try {
      const res = await fetch('/api/research/points', {
        method: 'POST', cache: 'no-store', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId: chargeRequestRef.current.requestId }),
      })
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
      chargeRequestRef.current = null
      setPoints(data.remaining)
      addLog(`已扣除 ${RESEARCH_COST} 积分启动深度研究，剩余 ${data.remaining} 积分`, 'system')
    } catch (err) {
      setErrorMsg('网络错误，请稍后重试')
      console.error('[startGeneration deduct]', err)
      return
    } finally {
      chargingRef.current = false
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

    const ws = await connectWS()
    if (!ws) return // 获取地址失败或连接异常，已由 connectWS 处理错误
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
  return {
    activeMenu, setActiveMenu, isRunning, isFinished, currentNodeIdx, fetchPoints, pointsLoading,
    canUsePoints, points, session, setIsProjectDropdownOpen, isProjectDropdownOpen,
    fetchHistoryReports, selectedProject, historyReports, setRunStage, setCurrentNodeIdx,
    setReportContent, reportContentRef, nodeStartTimesRef, setPlanContent, setLogs, setErrorMsg,
    setHumanFeedbackPrompt, setHumanFeedbackInput, stopTimer, setElapsedTime, setTaskTopic,
    setSelectedModel, setSelectedLanguage, setSelectedProject, addLog, setIsNotifyOpen, isNotifyOpen,
    logs, errorMsg, setShowReportModal, runStage, setViewMode, viewMode, handleCancel, formatTime,
    elapsedTime, getTaskStatus, logsEndRef, taskTopic, selectedModel, setIsModelDropdownOpen,
    isModelDropdownOpen, setIsLangDropdownOpen, isLangDropdownOpen, selectedLanguage, setGuidelines,
    maxSections, setMaxSections, followGuidelines, setFollowGuidelines, verbose, setVerbose,
    humanFeedback, setHumanFeedback, maxPlanRevisions, setMaxPlanRevisions, guidelines,
    startGeneration, historyLoading, openHistoryReport, deleteHistoryReport, humanFeedbackPrompt,
    planContent, humanFeedbackInput, submitHumanFeedback, showInsufficientModal,
    setShowInsufficientModal, showReportModal, reportContent, copyAll, downloadMd, viewingReport,
    setViewingReport, viewingLoading,
  }
}

export type ResearchState = ReturnType<typeof useResearch>
