import { withWriteGuard } from '@/lib/security/write-guard'
import { NextRequest, NextResponse } from 'next/server'
import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto'
import { chinaDate, validateEdition, type Edition } from '@/lib/learn/document'
import { publishEdition } from '@/lib/learn/publish'
import { PublicationError } from '@/lib/learn/publication-contract'
export const runtime = 'nodejs'
export const maxDuration = 30
async function handlePOST(req: NextRequest) {
  const secret = process.env.LEARN_PUBLISH_SECRET
  if (!secret || secret.length < 32) return NextResponse.json({error:'unconfigured'}, {status:503})
  const timestamp = req.headers.get('x-learn-timestamp') || ''
  const signature = req.headers.get('x-learn-signature') || ''
  if (!/^\d{10}$/.test(timestamp) || !/^[a-f0-9]{64}$/i.test(signature) ||
      Math.abs(Math.floor(Date.now()/1000)-Number(timestamp)) > 120) {
    return NextResponse.json({error:'unauthorized'}, {status:401})
  }
  if (Number(req.headers.get('content-length')) > 180000) return NextResponse.json({error:'too large'}, {status:413})
  const reader = req.body?.getReader()
  const chunks: Uint8Array[] = []
  let size = 0
  if (reader) {
    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        size += value.byteLength
        if (size > 180000) {
          await reader.cancel()
          return NextResponse.json({error:'too large'}, {status:413})
        }
        chunks.push(value)
      }
    } finally { reader.releaseLock() }
  }
  const body = Buffer.concat(chunks).toString('utf8')
  const digest = createHmac('sha256',secret).update(timestamp+'.'+body).digest()
  if (!timingSafeEqual(digest, Buffer.from(signature,'hex'))) return NextResponse.json({error:'unauthorized'}, {status:401})
  let input: unknown
  try {input=JSON.parse(body)} catch {return NextResponse.json({error:'invalid JSON'}, {status:400})}
  const verdict=validateEdition(input)
  if (!verdict.ok) return NextResponse.json({error:'quality check failed', reasons:verdict.errors}, {status:422})
  const edition=input as Edition
  if (edition.date!==chinaDate()) return NextResponse.json({error:'wrong Shanghai date'}, {status:409})
  try {
    const result=await publishEdition(edition)
    return NextResponse.json(result,{status:result.created?201:200})
  } catch(e) {
    const requestId = randomUUID()
    const category = e instanceof PublicationError ? e.category : 'database_failed'
    console.error('[learn] publication failure', {requestId,category,date:edition.date})
    return NextResponse.json({error:category,requestId,verified:false,reasons:e instanceof PublicationError?e.reasons:[],
      dbStatus:e instanceof PublicationError && e.created ? 'written_unverified' : 'unknown'},
      {status:category==='conflict'?409:category==='source_unverified'?502:500})
  }
}

export const POST = withWriteGuard(handlePOST, { maxBytes: 220000, sameOrigin: false })
