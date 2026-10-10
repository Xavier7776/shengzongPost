import { logFailure } from '@/lib/security/log'
import { withWriteGuard } from '@/lib/security/write-guard'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/auth'
import { sql } from '@/lib/db/_core'
import { validateEdition, type Edition, type EditionV2 } from '@/lib/learn/document'
import { editionFingerprint, PublicationError, slugFor } from '@/lib/learn/publication-contract'
import { reviseEdition } from '@/lib/learn/publish'

export const dynamic='force-dynamic'
export const fetchCache='force-no-store'
type Ctx={params:{slug:string}}
export async function GET(_req:NextRequest,{params}:Ctx) {
  if(!await requireAdminApi())return NextResponse.json({error:'Unauthorized'},{status:401})
  try {
    const rows=await sql`SELECT l.document FROM learn_editions l JOIN posts p ON p.id=l.post_id WHERE p.slug=${params.slug}`
    if(!rows[0])return NextResponse.json({error:'文章不存在'},{status:404})
    if(!validateEdition(rows[0].document).ok)return NextResponse.json({error:'原始结构待修复，不能自动修订'},{status:409})
    return NextResponse.json({edition:rows[0].document,fingerprint:editionFingerprint(rows[0].document as Edition)},{headers:{'Cache-Control':'private, no-store'}})
  } catch {
    logFailure('app/api/admin/learn/[slug]')
    return NextResponse.json({error:'无法读取当前版本，请稍后重试'},{status:503})
  }
}
async function handlePATCH(req:NextRequest,{params}:Ctx) {
  if(!await requireAdminApi())return NextResponse.json({error:'Unauthorized'},{status:401})
  try {
    const text=await req.text()
    if(Buffer.byteLength(text,'utf8')>220000)return NextResponse.json({error:'修订数据过大'},{status:413})
    const payload=JSON.parse(text)
    if(!payload || typeof payload!=='object' || Array.isArray(payload))return NextResponse.json({error:'修订契约必须为对象'},{status:400})
    const {edition,previousFingerprint}=payload
    const verdict=validateEdition(edition)
    if(!verdict.ok || edition.version!==2 || slugFor(edition)!==params.slug || typeof previousFingerprint!=='string' || !/^[a-f0-9]{64}$/.test(previousFingerprint))
      return NextResponse.json({error:'修订契约不完整',details:verdict.errors},{status:400})
    return NextResponse.json(await reviseEdition(edition as EditionV2,previousFingerprint),{headers:{'Cache-Control':'private, no-store'}})
  } catch(error) {
    if(error instanceof PublicationError)return NextResponse.json({error:error.category,committed:error.committed,details:error.reasons},{status:error.category==='conflict'?409:error.category==='source_unverified'?422:503})
    if(error instanceof SyntaxError)return NextResponse.json({error:'JSON 格式错误'},{status:400})
    logFailure('app/api/admin/learn/[slug]')
    return NextResponse.json({error:'修订失败，请先回读版本，勿盲目重试'},{status:500})
  }
}

export const PATCH = withWriteGuard(handlePATCH)
