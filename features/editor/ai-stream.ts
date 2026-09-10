/**
 * 把 AI 接口的 SSE 流读成完整文本。
 * 管理员 AI 助手、用户 AI 助手、AI slug 生成三处都在用同一套解析逻辑。
 */
export async function readAiStream(
  res: Response,
  onDelta?: (delta: string) => void,
): Promise<string> {
  const reader = res.body!.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let result = ''
  while (true) {
    const { done, value } = await reader.read(); if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n'); buffer = lines.pop() ?? ''
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const data = line.slice(6).trim(); if (data === '[DONE]') break
      try {
        const delta = JSON.parse(data).choices?.[0]?.delta?.content
        if (delta) { result += delta; onDelta?.(delta) }
      } catch {}
    }
  }
  return result
}
