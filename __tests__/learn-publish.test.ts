import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { makeEdition } from './fixtures/learn-edition'
import { editionFingerprint, slugFor, textVersion } from '@/lib/learn/publication-contract'
const { sql, revalidate } = vi.hoisted(() => ({ sql: vi.fn(), revalidate: vi.fn() }))
vi.mock('@/lib/db/_core', () => ({ sql }))
vi.mock('next/cache', () => ({ revalidatePath: revalidate }))
import { publishEdition } from '@/lib/learn/publish'

const edition = makeEdition()
function stored(e = edition) {
  return { id: 1, post_id: 1, slug: slugFor(e), title: e.title, excerpt: e.excerpt,
    content: textVersion(e), published: true, edition_date: e.date, topic: e.topic,
    document: e, status: 'published', tags: ['Agent 前沿', 'AI技术精读', '自动发布'] }
}
const network = vi.fn()
beforeEach(() => {
  sql.mockReset(); revalidate.mockReset(); network.mockReset()
  vi.stubGlobal('fetch', network)
  network.mockImplementation(async (url: string) => new Response(url.includes('/blog/')
    ? `<div data-learn-fingerprint="${editionFingerprint(edition)}" data-learn-slug="${slugFor(edition)}"></div>` : 'source', {status:200}))
})
afterEach(() => vi.unstubAllGlobals())

describe('learn publication integrity', () => {
  it('validates before any database or network access', async () => {
    await expect(publishEdition({ ...edition, blocks: [] })).rejects.toThrow('quality gate rejected')
    expect(sql).not.toHaveBeenCalled(); expect(network).not.toHaveBeenCalled()
  })
  it('reports created and verified only after independent readback', async () => {
    sql.mockResolvedValueOnce([]).mockResolvedValueOnce([{inserted:1}]).mockResolvedValueOnce([stored()])
    await expect(publishEdition(edition)).resolves.toMatchObject({created:true,alreadyExists:false,verified:true,dbStatus:'db_ready',publicStatus:'public_ready'})
    expect(sql).toHaveBeenCalledTimes(3)
    for(const path of ['/','/blog','/learn','/feed.xml','/sitemap.xml','/blog/'+slugFor(edition)])expect(revalidate).toHaveBeenCalledWith(path)
    expect(revalidate).toHaveBeenCalledWith('/blog/[slug]','page')
  })
  it('accepts a content-identical retry with no new write or source request', async () => {
    sql.mockResolvedValueOnce([stored()])
    await expect(publishEdition(edition)).resolves.toMatchObject({created:false,alreadyExists:true,verified:true})
    expect(sql).toHaveBeenCalledOnce(); expect(revalidate).not.toHaveBeenCalled()
    expect(network.mock.calls.every(([url]) => url.includes('/blog/'))).toBe(true)
  })
  it.each(['title', 'excerpt', 'content', 'published', 'post_id', 'edition_date', 'topic', 'document'])('rejects %s drift before mutation', async field => {
    const row = {...stored(), [field]: field === 'published' ? false : field === 'document' ? {...edition, careerTip:edition.careerTip+' changed'} : 'different'}
    sql.mockResolvedValueOnce([row])
    await expect(publishEdition(edition)).rejects.toMatchObject({category:'conflict'})
    expect(sql).toHaveBeenCalledOnce(); expect(revalidate).not.toHaveBeenCalled()
  })
  it('rejects a post without an edition and duplicate/mismatched relations', async () => {
    sql.mockResolvedValueOnce([{...stored(),post_id:null}])
    await expect(publishEdition(edition)).rejects.toMatchObject({category:'conflict'})
    sql.mockResolvedValueOnce([stored(),stored()])
    await expect(publishEdition(edition)).rejects.toMatchObject({category:'conflict'})
  })
  it('fails source timeout or 404 without inserting an article', async () => {
    sql.mockResolvedValue([])
    network.mockRejectedValueOnce(new Error('timeout'))
    await expect(publishEdition(edition)).rejects.toMatchObject({category:'source_unverified',reasons:['sources.s1: unreachable or timed out']})
    expect(sql).toHaveBeenCalledOnce()
    sql.mockClear(); network.mockResolvedValue(new Response('',{status:404}))
    await expect(publishEdition(edition)).rejects.toMatchObject({category:'source_unverified'})
    expect(sql).toHaveBeenCalledOnce()
  })
  it('does not report success after insert or readback failure', async () => {
    sql.mockResolvedValueOnce([]).mockRejectedValueOnce(new Error('database unavailable'))
    await expect(publishEdition(edition)).rejects.toThrow('database unavailable')
    sql.mockResolvedValueOnce([]).mockResolvedValueOnce([{inserted:1}]).mockRejectedValueOnce(new Error('readback unavailable'))
    await expect(publishEdition(edition)).rejects.toMatchObject({category:'readback_failed',created:true})
    expect(revalidate).not.toHaveBeenCalled()
  })
  it('fails closed if newly written content cannot be verified', async () => {
    sql.mockResolvedValueOnce([]).mockResolvedValueOnce([{inserted:1}]).mockResolvedValueOnce([{...stored(),content:'wrong'}])
    await expect(publishEdition(edition)).rejects.toMatchObject({category:'readback_failed',created:true})
  })
  it('verifies the winner of a concurrent same-content insert', async () => {
    sql.mockResolvedValueOnce([]).mockResolvedValueOnce([{inserted:0}]).mockResolvedValueOnce([stored()])
    await expect(publishEdition(edition)).resolves.toMatchObject({created:false,alreadyExists:true,verified:true})
  })
  it('keeps db_ready separate from public_pending and never rewrites during public retry', async () => {
    sql.mockResolvedValueOnce([stored()])
    network.mockImplementation(async () => new Response('old cached page',{status:200}))
    await expect(publishEdition(edition)).resolves.toMatchObject({verified:true,dbStatus:'db_ready',publicStatus:'public_pending'})
    expect(network).toHaveBeenCalledTimes(3); expect(sql).toHaveBeenCalledOnce()
  })
  it('reports cache invalidation failure without losing a verified write', async () => {
    const log=vi.spyOn(console,'error').mockImplementation(()=>{})
    try {
    sql.mockResolvedValueOnce([]).mockResolvedValueOnce([{inserted:1}]).mockResolvedValueOnce([stored()])
    revalidate.mockImplementation(() => {throw Error('cache unavailable')})
    await expect(publishEdition(edition)).resolves.toMatchObject({verified:true,cacheStatus:'failed'})
    } finally {log.mockRestore()}
  })
  it.each(['timeout', 'wrong fingerprint', 'wrong slug'])('does not claim public readiness after %s', async failure => {
    sql.mockResolvedValueOnce([stored()])
    network.mockImplementation(async () => {
      if (failure === 'timeout') throw Error('timeout')
      return new Response(`<div data-learn-fingerprint="${failure === 'wrong fingerprint' ? '0'.repeat(64) : editionFingerprint(edition)}" data-learn-slug="${failure === 'wrong slug' ? 'another-article' : slugFor(edition)}"></div>`)
    })
    await expect(publishEdition(edition)).resolves.toMatchObject({dbStatus:'db_ready',publicStatus:'public_pending'})
    expect(sql).toHaveBeenCalledOnce(); expect(network).toHaveBeenCalledTimes(3)
  })
  it('disallows source and public redirects and bounds network requests', async () => {
    sql.mockResolvedValueOnce([]).mockResolvedValueOnce([{inserted:1}]).mockResolvedValueOnce([stored()])
    await publishEdition(edition)
    for (const [, options] of network.mock.calls) {
      expect(options).toMatchObject({redirect:'error',cache:'no-store'})
      expect(options.signal).toBeInstanceOf(AbortSignal)
    }
  })
})
