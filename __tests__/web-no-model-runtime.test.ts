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
  it('keeps paid manual publishing quarantined and the Web route model-free', () => {
    expect(existsSync(resolve(root, '.github/workflows/daily-learn.yml'))).toBe(false)
    expect(existsSync(resolve(root, 'scripts/publish-learn-daily.ts'))).toBe(false)
    const route = load('app/api/internal/learn/publish/route.ts')
    expect(route).toContain('LEARN_PUBLISH_SECRET')
    expect(route).not.toContain('OPENAI_API_KEY')
  })
})
