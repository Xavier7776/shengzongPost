# Published content cache contract

Applies to Next.js 14.2.35. Verify this table again after a framework upgrade.

| Entry | Actual server cache | Site mutation | Direct database write |
| --- | --- | --- | --- |
| `/` | Full Route/Data Cache, 60 second revalidation | Exact path invalidated | TTL plus request-triggered regeneration |
| `/blog`, `/learn` | Dynamic rendering because pagination reads `searchParams`; eligible SQL Data Cache retains 60 second revalidation | Exact paths invalidated | TTL plus regeneration; dynamic rendering alone does not guarantee fresh SQL |
| `/blog/[slug]` | 60 second revalidation for eligible data; path dependent rendering | Old/new slug plus page pattern invalidated | TTL plus regeneration |
| `/feed.xml`, `/sitemap.xml` | Dynamic response over explicit `unstable_cache` XML/data, 300 second revalidation | `published-content` tag plus exact paths invalidated | TTL plus request-triggered regeneration |
| `/search`, `/api/search` | Dynamic query; API explicitly sets `fetchCache='force-no-store'` | No persisted search index to invalidate | Next search request reads published rows |
| Administrator pages | Authenticated dynamic rendering | Never public cache invalidation targets | Authorized request reads current rows |

Neon HTTP POST transport uses Next's patched `fetch`. It can be cached in a static render; a POST alone does not prove absence of a Data Cache. There are no `posts`/`post-*` tagged reads, so unrelated legacy tags are removed. `published-content` is now attached to the actual RSS/Sitemap cached values. Keep `_core.ts` unchanged: blanket `no-store` previously broke static builds.

The installed Next 14 file-system cache checks tag invalidation for `PAGE`/`FETCH` entries, but not `ROUTE` entries. A real production-artifact replay accepted `revalidatePath('/feed.xml')` while the response remained stale. RSS/Sitemap therefore bypass Full Route Cache and keep their reusable XML/data in a genuinely tagged `unstable_cache` entry. This retains bounded query volume and makes publication invalidation observable. Search replay also showed repeated SQL fetches using a year-long default cache despite `force-dynamic`; its explicit fetch policy prevents that reuse.

`invalidatePublishedContent` runs **after** a committed create, update, withdrawal, deletion, batch mutation, or approved edit of a published post. New drafts and rejected edits do not publish content. It invalidates Home, Blog, Learn, RSS, Sitemap, old/new article URLs, and the article page pattern because adjacent navigation changes too. It never invalidates the root layout or private OnlyUs paths. Identical edition retries remain read-only and do not invalidate caches.

Post mutation response header `X-Content-Cache-Status` reports `invalidated`, `failed`, or `unchanged`; M02 returns this state in its JSON. Approved edit requests use the same fixed failure log. `invalidated` means invalidation was accepted, not that every existing browser tab has refreshed. Partial failure attempts the remaining paths and logs a fixed category; the already committed write remains successful. Do not repeat a create to repair cache state. M02 retains separate database verification and public visibility checks.

All public post queries require `published=true`. RSS and Sitemap use the same filtered metadata. RSS preserves original publication dates and derives build date from actual latest content changes; static Sitemap entries omit unknown modification dates. Query variants are not Sitemap entries.

Missing/withdrawn articles must emit 404 before streaming a page. Blog route-level loading boundaries previously committed HTTP 200 before `notFound`; they are removed while the article's internal content/comment skeletons remain. On client navigation the previous view can remain while the server query completes. Metadata also rejects absent published rows. Next 14 documents [streaming status behavior](https://nextjs.org/docs/14/app/api-reference/file-conventions/not-found).

## Eventual visibility and cost

Direct SQL does not contact the site process. Candidate operating targets are detail/Home within 120 seconds and feed/Sitemap within 330 seconds **with continued requests, a healthy database, and successful regeneration**. A 60/300 second TTL is not a hard wall-clock delivery guarantee: the first stale response can start background regeneration, and idle entries wait for a request. Existing browser Router Cache/reader polling may add delay. Do not claim immediate publication or a five minute universal SLA from the TTL alone.

Feed data TTL falls from 3600 to 300 seconds; Sitemap gains 300 second data regeneration. Only requests after expiry cause regeneration, rather than a new background cron. No paid model, index, scheduled writer, or per-request polling is added. Measure real subscription traffic and Neon query volume before changing these TTLs again.

## Verification and rollback

Unit tests cover every mutation caller, old/new URLs, private path exclusion, partial cache failure, RSS dates/XML, Sitemap variants and absent article metadata. The production artifact is tested against a loopback, ephemeral PGlite database with synthetic credentials; lifecycle mutations and direct writes never use production data. Record the lifecycle matrix, measured direct-write visibility, and before/after TTFB before accepting M04.

2026-10-10 isolated production-artifact results: create/rename/withdraw/batch republish/delete, edition withdrawal/republish/deletion, and adjacent keyboard navigation updates pass. Direct SQL appeared in Search at 189ms, Blog at 63496ms, detail at 63559ms, Learn at 61973ms (separate run), and RSS/Sitemap at 304741/304743ms. These observations use continuous test requests and prove this fixture, not all production traffic conditions.

Same Windows host, identical synthetic seeds, two warmups and ten sequential samples per route yielded the following headers TTFB. These small local samples are not the M06 public network/load benchmark.

| Route | Before p50 / p95 ms | After p50 / p95 ms |
| --- | --- | --- |
| Blog | 45.61 / 61.25 | 61.68 / 75.06 |
| Learn | 45.00 / 72.29 | 54.85 / 75.90 |
| Published edition detail | 37.77 / 53.77 | 28.50 / 46.38 |
| Search API | 1.60 / 2.37 | 6.20 / 11.25 |

Search now executes one real SQL statement per request, rather than returning the former cached result; no extra search statement is added. The other routes retain their existing query shapes. Local raw reports and repeatable scripts are in `D:/download/search-v2-validation/m04-*`; real Preview/production acceptance is recorded separately in the execution plan.

Rollback: revert the M04 code commit, redeploy the previous accepted artifact, and verify public pages/read-only queries. No schema or business data changes are needed. This restores older feed/Sitemap freshness limitations; do not describe rollback as preserving the new consistency contract.
