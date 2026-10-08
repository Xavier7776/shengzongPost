import { NextRequest, NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'node:crypto'
import { chinaDate, validateEdition, type Edition } from '@/lib/learn/document'
import { publishEdition } from '@/lib/learn/publish'
export const runtime = 'nodejs'
export async function POST(req: NextRequest) {
  const secret = process.env.LEARN_PUBLISH_SECRET
  if (!secret || secret.length < 32) return NextResponse.json({error:'unconfigured'}, {status:503})
  const timestamp = req.headers.get('x-learn-timestamp') || ''
  const signature = req.headers.get('x-learn-signature') || ''
  if (!/^\d{10}$/.test(timestamp) || !/^[a-f0-9]{64}$/i.test(signature) ||
      Math.abs(Math.floor(Date.now()/1000)-Number(timestamp)) > 120) {
    return NextResponse.json({error:'unauthorized'}, {status:401})
  }
  const body = await req.text()
  if (Buffer.byteLength(body,'utf8') > 180000) return NextResponse.json({error:'too large'}, {status:413})
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
  } catch(e) {console.error('[learn] publication failure',e);return NextResponse.json({error:'publish failed'}, {status:500})}
}
