# M12 runtime candidate: Next16 / React19

Date: 2026-10-10. Base: `4badb72bbaf76fb8bdbaca2a9ba5517a60d7bc4a` (M12-A, Next14/React18). Candidate: Next16.4.0, React/DOM19.3.0, NextAuth4.24.15. **Not approved for release: mobile article performance remains below the candidate target.**

## Scope and checks

Windows Node24.9.0/npm11.6.0; isolated worktree, clean npm ci with valid peer dependencies; webpack production build, fixture-only database transport, no production writes. 70 Vitest files / 471 tests, typecheck, five real OnlyUs lint boundary probes and complete build pass. Lint has 0 errors / 100 warnings; the Compiler diagnostics remain visible and React Compiler is not enabled. All 136 existing app manifest entries remain; Next16 adds only its global error page. Static-generation counters (89 vs85) are framework output, not removed routes.

Actual production browser sessions across 390/1024/1440 pass public reading, login-page layout and hydration checks. Synthetic accounts exercise real NextAuth CSRF/credentials and both Tiptap editors: admin draft save/reload/preview/publish/withdraw, user submission stays pending/private. Local review approval/replacement/collision checks, atomic points and ledger checks, persistent uploads/provider failures/sprite access and public throttling all pass. Real logout, role revocation, changed-password rejection and relogin pass. Remote Preview remains pending. Existing native Neon concurrency evidence from M10 is not re-run or relabeled as M12 evidence.

Two hydration defects were fixed at their source: toolbar preferences now apply to the hydrated article shell without modifying streamed reader nodes; comments wait for their own hydration before rendering session-dependent controls. The delayed-reader preferences test and real renderToString/hydrateRoot session-race test preserve those invariants. No hydration warning is suppressed.

The first exact-head Preview (`af3f2ce`, CI38036975899/job114169328581, deployment dpl_AjHLvwWXskTZx3srvCJE1g3tf4so READY) passes the public-read/security checks, but its multi-page smoke test fails with React418. Instrumented diagnostic playback identifies the Navbar active-link span, not the reader. Active links now wait for Navbar hydration; a real SSR/hydrate route-change test passes. Complete local gates are rerun for this follow-up. Final Preview and performance validation remain pending; the earlier deployment is not called a full pass. The scoped15-minute error/fatal log query is empty, which does not negate the browser failure.

## Comparable laboratory observations

Chrome154, Lighthouse13.5.0, identical synthetic/public-content fixture, port3332 and settings; fresh Chrome instance per Lighthouse case. Before: `m12-before-sequential-lh-*`; after: `m12-after-delivery-lh-*`. Runs are sequential with no concurrent build or browser benchmark. These are single laboratory observations, **not field p75 or INP**. The desktop run retains the pre-existing mobile throttling settings with desktop viewport/form factor, so its absolute score is not a standard desktop-network claim.

| Viewport / page | Performance before → after | LCP ms before → after | TBT ms before → after | CLS before → after |
|---|---:|---:|---:|---:|
| 390 / home | 95 → 93 | 2886 → 3164 | 0 → 35 | .000060 → .000060 |
| 390 / old edition | 92 → 88 | 3238 → 3411 | 0 → 185 | .030446 → .000434 |
| 1440 / home | 69 → 67 | 3258 → 3701 | 0 → 61 | .000431 → .000431 |
| 1440 / old edition | 59 → 62 | 3328 → 3744 | 354 → 290 | .017587 → .000511 |

SEO is100 throughout; accessibility is100 on mobile home and96 on the other cases. All four LCPs exceed2500ms, as the baseline already did. Earlier valid candidate mobile article scores84/90 and final88 are preserved; a good sample does not erase a regression. No claim that M09-B has passed.

The 18-case production browser footprint compares `m12-before-sequential-metrics.json` with `m12-after-delivery-retry-metrics.json`: home gzip JS137411→176824 bytes; old article162149→201343 bytes at390px. Those roughly39KB increases include the framework/router upgrade. Script bytes include viewport-triggered and prefetched resources, not only an entry chunk. Work/search/login differ in footer/prefetch loading and must not be advertised as uniformly improved.

SQL counts include navigation prefetch and background ISR; a fresh browser context is not a cold server. Final page totals are home0–5, Learn3–12, old article2–3, search5–6, Work3–4, login0. Next15+ no longer caches fetch by default; only public Learn/Blog pages explicitly restore their60-second default cache, with immediate post-commit invalidation retained. Shared Neon, authentication and private/API calls have no blanket force-cache. Theme filters skip automatic prefetch, while article links retain it. Counts do not establish server p95, cost savings or publication freshness on their own.

## Failed attempts and release limits

Failed type migration, build interrupted by concurrent installation, both hydration discoveries, fixture-only missing skill/Suspense419, transient external image connection errors, and overlapping benchmark attempts are excluded from successful gates and retained in the external evidence directory. The local skill check now selects the seeded ci-skill; remote checks select a real published skill. Smoke waits for completed streaming before selecting the article, without weakening fingerprint/quiz/chart/404 assertions. A Work default-cache experiment prevented access to non-build slugs and was reverted.

[Next support policy](https://nextjs.org/support-policy) currently lists Next16 Active LTS and15 Maintenance LTS. Next15's release date is2024-10-21 and maintenance is limited to two years, so it is an unsuitable long-term substitute on2026-10-10. Next16 is still the candidate, with the performance tradeoff awaiting review.

Audit decreases from the M12-A57 findings to47 (33moderate/14high/0critical), with no Next/NextAuth audit entries. This does not resolve all dependency advisories: Tiptap/ProseMirror and other reachable patches need a separate, compatible follow-up. ESLint9 is EOL while the installed React/a11y plugins do not support10. Real GitHub OAuth, private Supabase operations, live Cloudinary credentials/uploads and real-user Web Vitals are not verified by these fixtures.

Rollback anchors: base commit4badb72 and production `dpl_GvXYN6tPZyknS1fCKjrCZJvUDfba`. No production schema, credentials, database connection,08:30 publisher or alias is changed by this candidate.

Local evidence: m12b-final-local-{read,smoke,ui}.json, m12b-{editor,auth,review,consistency,storage}-local.json; sprite72 successful reads/0 taints; balance1987/9 ledger entries/delta-2113; browser errors empty. Raw outputs stay outside Git under D:/download/search-v2-validation.
