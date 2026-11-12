'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, Copy } from 'lucide-react'

export default function ReaderCodeBlock({ language, code, caption }: { language: string; code: string; caption: string }) {
  const [status, setStatus] = useState<'idle' | 'copied' | 'failed'>('idle')
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])
  const copy = async () => {
    try { await navigator.clipboard.writeText(code); setStatus('copied') }
    catch { setStatus('failed') }
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setStatus('idle'), 2000)
  }
  return <figure className="reader-code-block">
    <div className="reader-code-heading"><span>{language} <small>· 示例代码（未执行）</small></span>
      <button type="button" onClick={copy} aria-label="复制代码">
        {status === 'copied' ? <Check size={15} /> : <Copy size={15} />}
        <span role={status === 'idle' ? undefined : 'status'}>{status === 'copied' ? '已复制' : status === 'failed' ? '复制失败' : '复制'}</span>
      </button>
    </div>
    <pre><code>{code}</code></pre>
    <figcaption>{caption}</figcaption>
  </figure>
}
