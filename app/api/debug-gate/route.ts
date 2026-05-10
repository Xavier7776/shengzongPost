// 临时调试用！验证完删掉！
// 放到: app/api/debug-gate/route.ts

import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

export async function GET() {
  const hash = process.env.ONLYUS_PASSCODE_HASH ?? '(未设置)'
  const testResult = hash !== '(未设置)'
    ? await bcrypt.compare('iloveyoutt', hash)
    : false

  return NextResponse.json({
    hashLength: hash.length,
    hashPreview: hash.slice(0, 10) + '...' + hash.slice(-4),
    hashRaw: JSON.stringify(hash), // 会暴露转义字符
    bcryptMatch: testResult,
  })
}
