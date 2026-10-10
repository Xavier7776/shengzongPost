import assert from 'node:assert/strict'
import { ESLint } from 'eslint'

const eslint = new ESLint()
for (const [filePath, source, denied] of [
  ['features/onlyus/components/boundary-probe.tsx', '@/lib/auth', true],
  ['components/boundary-probe.tsx', '@/features/onlyus/lib/gate', true],
  ['features/onlyus/components/boundary-probe.tsx', '@/shared/hooks', false],
  ['components/boundary-probe.tsx', '@/shared/hooks', false],
  ['features/onlyus/components/boundary-probe.tsx', '@/features/onlyus/lib/gate', false],
]) {
  const [result] = await eslint.lintText(`import '${source}'\n`, { filePath })
  assert.ok(result, `No lint result: ${filePath}`)
  const errors = result.messages.filter(message => message.severity === 2)
  assert.deepEqual(errors.map(message => message.ruleId), denied ? ['no-restricted-imports'] : [], filePath)
}
console.log('OnlyUs bidirectional lint boundaries and shared imports passed')
