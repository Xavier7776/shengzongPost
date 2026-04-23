// app/api/ai/review-comment/route.ts
// POST /api/ai/review-comment
// 内部调用：对一条评论进行 AI 自动审核，返回 { pass: boolean, reason: string }
// 若 DEEPSEEK_API_KEY 未配置，直接返回 pass:true（降级为人工审核队列）

import { NextRequest, NextResponse } from 'next/server'

const INTERNAL_SECRET  = process.env.AI_COMMENT_SECRET ?? 'ai-comment-internal'
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY  ?? ''
const DEEPSEEK_MODEL   = process.env.DEEPSEEK_MODEL    ?? 'deepseek-chat'
const DEEPSEEK_URL     = 'https://api.deepseek.com/chat/completions'

const SYSTEM_PROMPT = `你是一个评论审核助手。你的任务是判断一条用户评论是否适合在技术博客上公开显示。

审核标准（满足任一 → 拒绝）：
- 包含广告、推广链接、联系方式推销
- 人身攻击、侮辱、歧视性语言
- 大量无意义内容（如重复字符、乱码）
- 明显的垃圾信息（SEO spam）
- 严重跑题（与博客内容完全无关的商业推销）

允许通过：
- 技术讨论、提问、补充观点
- 对文章的正面或负面评价（文明表达）
- 个人经验分享

输出格式：只返回 JSON，不要有任何其他内容。
{"pass": true/false, "reason": "一句话说明原因"}`

export async function POST(req: NextRequest) {
  // 内部鉴权
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${INTERNAL_SECRET}`) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { content, post_slug } = await req.json()
  if (!content) {
    return NextResponse.json({ error: '缺少 content' }, { status: 400 })
  }

  // 未配置 API key → 降级，默认进入待审核队列（pass: false，由人工处理）
  if (!DEEPSEEK_API_KEY) {
    console.warn('[ai/review-comment] DEEPSEEK_API_KEY 未配置，跳过 AI 审核')
    return NextResponse.json({ pass: false, reason: 'AI 审核未配置，进入人工审核队列' })
  }

  try {
    const resp = await fetch(DEEPSEEK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        max_tokens: 200,
        temperature: 0.1, // 审核任务用低温度，结果更稳定
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: `博客文章 slug：${post_slug ?? '未知'}\n\n评论内容：\n${content}`,
          },
        ],
      }),
    })

    if (!resp.ok) {
      const errText = await resp.text()
      console.error('[ai/review-comment] DeepSeek 调用失败:', errText)
      // API 失败 → 进入人工审核，不阻塞用户
      return NextResponse.json({ pass: false, reason: 'AI 服务暂时不可用，进入人工审核' })
    }

    const data = await resp.json()
    const raw  = data.choices?.[0]?.message?.content?.trim() ?? ''

    // 解析 JSON，容错处理
    let result = { pass: false, reason: '解析失败' }
    try {
      // 去掉可能的 markdown 代码块包裹
      const clean = raw.replace(/```json|```/g, '').trim()
      result = JSON.parse(clean)
    } catch {
      console.warn('[ai/review-comment] JSON 解析失败，原始输出:', raw)
      // 尝试关键词兜底：如果 AI 输出包含 "pass": true 就通过
      result.pass   = raw.includes('"pass": true') || raw.includes('"pass":true')
      result.reason = '响应格式异常，已兜底处理'
    }

    console.log(`[ai/review-comment] slug="${post_slug}" pass=${result.pass} reason="${result.reason}"`)
    return NextResponse.json({ pass: Boolean(result.pass), reason: result.reason ?? '' })
  } catch (err) {
    console.error('[ai/review-comment] 内部错误:', err)
    return NextResponse.json({ pass: false, reason: 'AI 服务异常，进入人工审核' })
  }
}
