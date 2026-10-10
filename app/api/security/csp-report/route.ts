import { NextRequest } from 'next/server'
import { rateLimit, clientIp } from '@/lib/rate-limit'
import { withWriteGuard } from '@/lib/security/write-guard'

const directives = new Set(['script-src','script-src-elem','script-src-attr','style-src','style-src-elem','style-src-attr','img-src','connect-src','font-src','media-src','frame-src','object-src','base-uri','form-action'])
async function handlePOST(req: NextRequest) {
  if (!rateLimit('csp:'+clientIp(req),10,60_000)) return new Response(null,{status:204})
  let input: unknown
  try { input = JSON.parse(await req.text()) } catch { return new Response(null,{status:204}) }
  const reports = Array.isArray(input) ? input.slice(0,10) : [input]
  for (const entry of reports) {
    if (!entry || typeof entry !== 'object') continue
    const raw = entry as Record<string, unknown>
    const report = (raw['csp-report'] ?? raw.body) as Record<string, unknown> | undefined
    if (!report || typeof report !== 'object') continue
    const directive = report['effective-directive'] ?? report.effectiveDirective
    if (typeof directive !== 'string' || !directives.has(directive)) continue
    const blocked = report['blocked-uri'] ?? report.blockedURL
    const scheme = typeof blocked === 'string' && /^(https?:|data:|blob:)/.test(blocked) ? blocked.split(':')[0] : ['inline','eval'].includes(String(blocked)) ? blocked : 'other'
    // No document URL, referrer, source sample, hostname, cookie, user/IP or arbitrary report fields.
    console.info('[csp report-only]', { directive, scheme })
  }
  return new Response(null,{status:204,headers:{'Cache-Control':'no-store'}})
}
export const POST = withWriteGuard(handlePOST,{maxBytes:32*1024})
