# M12 runtime candidate: Next16 / React19

Date: 2026-10-10. Base: `4badb72bbaf76fb8bdbaca2a9ba5517a60d7bc4a` (M12-A, Next14/React18). Candidate: Next16.4.0, React/DOM19.3.0, NextAuth4.24.15. **Keep Draft per the user's instruction. The optimized mobile laboratory candidate reaches the90-point floor; release approval and latest-head CI/Preview remain pending.**

## Scope and checks

Windows Node24.9.0/npm11.6.0; isolated worktree, npm ci with valid declared peers; webpack production build, fixture-only database transport, no production writes. 71 Vitest files / 474 tests, typecheck and complete build pass. Five real OnlyUs lint boundary probes passed the framework candidate and remain mandatory in CI. Lint has0 errors /101 warnings; the Compiler diagnostics remain visible and React Compiler is not enabled. All136 existing app manifest entries remain; Next16 adds only its global error page. Static-generation counters(89 vs85) are framework output, not removed routes.

Actual production browser sessions across390/1024/1440 pass public reading, login-page layout and hydration checks. Synthetic accounts exercise real NextAuth CSRF/credentials and both Tiptap editors: admin draft save/reload/preview/publish/withdraw, user submission stays pending/private. Local review approval/replacement/collision checks, atomic points and ledger checks, persistent uploads/provider failures/sprite access and public throttling all pass. Real logout, role revocation, changed-password rejection and relogin pass. Previous-head Preview passes; the optimized head's exact Preview remains pending. Existing native Neon concurrency evidence from M10 is not re-run or relabeled as M12 evidence.

Two hydration defects were fixed at their source: toolbar preferences now apply to the hydrated article shell without modifying streamed reader nodes; comments wait for their own hydration before rendering session-dependent controls. The delayed-reader preferences test and real renderToString/hydrateRoot session-race test preserve those invariants. No hydration warning is suppressed.

The first exact-head Preview(`af3f2ce`, CI38036975899/job114169328581, deployment dpl_AjHLvwWXskTZx3srvCJE1g3tf4so READY) passes the public-read/security checks, but its multi-page smoke test fails with React418. Instrumented diagnostic playback identifies the Navbar active-link span. Active links now wait for Navbar hydration; a real SSR/hydrate route-change test passes. Follow-up2e93ad4 passes CI38037984006/job114172330743 and exact Preview dpl_FzfUoJHkbX9xJfFksCCzLHAqBAy2, including public/security, multi-page smoke and Shop/Research at three widths with no browser errors. That head still scores87 on mobile article; the user explicitly kept PR30 Draft and requested optimization. Its empty scoped15-minute error/fatal log query does not negate the initial deployment's browser failure.

## Prior candidate laboratory observations

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

## Optimized candidate: complete repeated observations

The unchanged QR generator now loads only when the reader clicks WeChat. Public Navbar links and the shared anonymous UserMenu login link load target routes on click; authenticated menu links and article links retain their behavior. At page top the chapter rail selects the first heading without measuring every heading; restored/deep-linked positions and scrolling keep the existing frame-coalesced measurements. These changes add no dependency or UI redesign. The tradeoff is waiting for a first uncached destination/QR chunk on interaction.

QR-only produced one mobile article91. QR plus public prefetch changes produced90/90/89, so it was not treated as stable acceptance. Moving the initial geometry read to the next frame produced88/88/88 and was rejected. The final top-position branch produces91/90/90. All twelve final cases ran sequentially, after every build/test/browser check completed, with a fresh Chrome instance per case and the same fixture/settings. Baseline still has one comparable sample; repeated candidate observations are not a repeated baseline distribution.

| Viewport / page | Baseline score | All three final scores | Baseline → median LCP ms | Baseline → median TBT ms | Baseline → final CLS |
|---|---:|---:|---:|---:|---:|
|390 / home|95|94 /94 /94|2886 →3012|0 →32.5|.000060 →.000060|
|390 / old edition|92|91 /90 /90|3238 →3325|0 →155|.030446 →.000434|
|1440 / home|69|69 /69 /69|3258 →3263|0 →37|.000431 →.000431|
|1440 / old edition|59|65 /68 /69|3328 →3671|354 →198.5|.017587 →.000511–.000605|

Every final mobile observation reaches90; all SEO scores are100, mobile-home accessibility100 and the other cases96. The old article mobile LCP remains about2.7% above baseline; desktop-viewport article LCP remains about10.3% above baseline under the inherited mobile throttling. M09's2500ms/field p75/INP and broader desktop targets are not passed.

Final18-case footprint: old article gzip JS187412 bytes at all three widths, down13948 bytes from the navigation-fix candidate's201360 at390px, but still25263 bytes above the Next14 baseline162149. Home173074 bytes versus137411 baseline. The framework/router overhead remains explicit; this optimization does not restore baseline bundle size. SQL totals remain home0–5, Learn3–12, article2–3, search5–6, Work3–4 and login0, including prefetch/ISR.

The QR browser self-check proves its generator is absent on initial navigation, loads on click and renders a real SVG; copy and close work. Three widths prove background home/login scripts are absent, route/back/keyboard navigation works, and mobile Escape restores focus. Chapter checks cover initial location, rapid scroll, return to top and deep-link refresh at all three widths. Old-edition fingerprint/quiz/chart/sources/RSS/sitemap/404 checks pass with no browser errors. Evidence: m12-qr-lazy-local.json, m12-nav-lazy-local.json, m12-toc-local.json and m12b-top-local-smoke.json; m12-after-top-metrics.json and m12-after-top-lh-{one,two,three}-* preserve all observations. The RAF-only failure is m12-after-frame-*; previous failures remain intact.

## Failed attempts and release limits

Failed type migration, build interrupted by concurrent installation, both hydration discoveries, fixture-only missing skill/Suspense419, transient external image connection errors, and overlapping benchmark attempts are excluded from successful gates and retained in the external evidence directory. The local skill check now selects the seeded ci-skill; remote checks select a real published skill. Smoke waits for completed streaming before selecting the article, without weakening fingerprint/quiz/chart/404 assertions. A Work default-cache experiment prevented access to non-build slugs and was reverted.

[Next support policy](https://nextjs.org/support-policy) currently lists Next16 Active LTS and15 Maintenance LTS. Next15's release date is2024-10-21 and maintenance is limited to two years, so it is an unsuitable long-term substitute on2026-10-10. Next16 is still the candidate, with the performance tradeoff awaiting review.

Audit decreases from the M12-A57 findings to47 (33moderate/14high/0critical), with no Next/NextAuth audit entries. This does not resolve all dependency advisories: Tiptap/ProseMirror and other reachable patches need a separate, compatible follow-up. ESLint9 is EOL while the installed React/a11y plugins do not support10. Real GitHub OAuth, private Supabase operations, live Cloudinary credentials/uploads and real-user Web Vitals are not verified by these fixtures.

Rollback anchors: base commit4badb72 and production `dpl_GvXYN6tPZyknS1fCKjrCZJvUDfba`. No production schema, credentials, database connection,08:30 publisher or alias is changed by this candidate.

Local evidence: m12b-final-local-{read,smoke,ui}.json, m12b-{editor,auth,review,consistency,storage}-local.json; sprite72 successful reads/0 taints; balance1987/9 ledger entries/delta-2113; browser errors empty. Raw outputs stay outside Git under D:/download/search-v2-validation.
