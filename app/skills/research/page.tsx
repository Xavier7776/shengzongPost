// app/skills/research/page.tsx
import type { Metadata } from 'next'
import MultiAgentHub from './MultiAgentHub'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '深度研究 · 多 Agent 协作 — MindStack.',
  description: '6 个 AI Agent 协同工作：浏览 → 规划 → 研究 → 撰写 → 审校 → 发布',
}

export default function ResearchPage() {
  return <MultiAgentHub />
}
