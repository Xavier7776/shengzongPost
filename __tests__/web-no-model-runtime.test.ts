import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
const root = process.cwd()
const load = (path: string) => readFileSync(resolve(root, path), 'utf8')

describe('site AI runtime isolation', () => {
  it('does not expose Web provider routes or editor model UI', () => {
    for (const path of [
      'app/api/ai/write/route.ts',
      'app/api/ai/write-gemini/route.ts',
      'app/api/ai/comment/route.ts',
      'app/api/ai/review-comment/route.ts',
      'features/editor/useAiWriting.ts',
      'features/editor/AiSidebar.tsx',
    ]) expect(existsSync(resolve(root, path)), path).toBe(false)
    for (const path of [
      'features/admin-posts/AdminPostEditor.tsx',
      'features/submissions/UserPostEditor.tsx',
      'app/api/comments/route.ts',
    ]) expect(load(path)).not.toMatch(/XIAOMI_API_KEY|GEMINI_API_KEY|useAiWriting|AiSidebar|\/api\/ai\//)
  })
  it('runs external OpenAI in Actions, not Next.js and does not execute untrusted article code', () => {
    const action = load('.github/workflows/daily-learn.yml')
    const external = load('scripts/publish-learn-daily.ts')
    expect(action).toContain('OPENAI_API_KEY')
    expect(action).not.toContain('XIAOMI_API_KEY')
    expect(external).toContain('https://api.openai.com/v1/responses')
    expect(external).not.toContain('api.xiaomimimo.com')
    const route = load('app/api/internal/learn/publish/route.ts')
    expect(route).toContain('LEARN_PUBLISH_SECRET')
    expect(route).not.toContain('OPENAI_API_KEY')
  })
})
