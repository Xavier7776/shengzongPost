# Historical v1 reader compatibility (2026-10-13)

## Scope and evidence

Base: `e433270367db3a983a44650413757f3118229205` (latest origin/main at start).
Branch: `codex/learn-historical-reader`. No overlapping open PRs observed before implementation.

Captured the public Edition and matching post fields with a parameterized SELECT in a Neon read-only transaction; no UPDATE/INSERT or model request. The two JSON fixtures preserve the original documents and posts.content verbatim. They contain published content only, no account data or credentials.

| Edition | Strict validateEdition | Narrative characters | Canonical SHA-256 | posts.content = textVersion |
| --- | --- | --- | --- | --- |
| 2026-10-09 | Pass, no errors | 4857 | e061e72ad216a0dadf7c2f584bfbb38294b7ad03d71d069a20d6f2a743a70e2d | Yes |
| 2026-10-10 | block 32: quiz; block 34: quiz (all failures) | 3614 | 7c56c69cdcb610768bca28e873f4e3b2478c66854151c02af71d8d5469a9b4d2 | Yes |

10-10 quiz lengths: index 32 = 18, index 33 = 30 (valid), index 34 = 19. Current minimum is 20, maximum 350. The failure is reproduced by the real validator, not inferred from the UI.

## Read-only contract

- `validateEdition` is unchanged. The API, publication service, revision service and offline CLI continue using strict validation.
- The reader and admin audit share publication checks: matching id/post_id, slug/date, title/topic metadata, published post, published edition, and exact `textVersion(document) === posts.content`. The reader also checks its incoming post body against the joined stored body.
- Only the full canonical SHA-256 above, v1/date 2026-10-10, and exactly the two current validation errors qualify for `historical`. Every document field is pinned, including quiz options/answers, chart values and source URLs. A date-only or generic short-quiz exception does not exist.
- The real validator still runs before the exception; additional structure, citation, provenance or trusted-source errors fail closed. No normalization, padding, rewritten text or document mutation is used.
- Admin shows `历史兼容（未完全合规）`, both failures and the length shortfall. A separate count is excluded from completely compliant counts/consecutive dates; the calendar retains the historical status. Its public/task status remains unknown without separate evidence.
- `PostContent` and `StudyArticle` need no changes: the accepted original document goes through existing interactive rendering and local progress fingerprinting. Drifted content retains the existing safe fallback.

## Local verification

- Full typecheck: passed.
- Full lint: passed, 0 errors / 101 warnings.
- Full tests: 78 files / 533 tests passed. Historical test suite also rerun after adding saved-progress hydration assertions and flushing the ToC observer: 21 passed without test warnings.
- `npm run build:ci`: passed with the existing isolated PGlite read-only fixture transport, no production credentials.
- Real snapshot regressions: both dates, chart teaching label, quiz answers, table of contents, explicit completion and reload, SSR/hydration including saved local progress, admin classification/count/calendar.
- Negative cases: changed question/answer/chart/source/extra field/date, wrong publication state, link/title/topic mismatch, body drift. Current-day short questions and the exact historical document remain rejected by authenticated in-process API tests and the real offline CLI child process (network denied).

## Preview acceptance

Accepted on 2026-10-13, 11:41–11:46 Asia/Shanghai, after the full local gates above.

- Runtime commit: `b6eefba86aaebf971abc2826900f4209418933a5`.
- Real Vercel Git Preview: [deployment](https://shengzong-post-kdlo87lwz-leonidasholya-2025s-projects.vercel.app), deployment ID `dpl_9uvr8EYQNTRXtSwZthBmqcvRY7sk`, READY, target Preview (not production), matching repository/branch/SHA.
- [GitHub Actions run 38342740013](https://github.com/Xavier7776/shengzongPost/actions/runs/38342740013): completed / success. Vercel commit status: success.
- Both dates verified at 1440×1000 desktop and 390×844 mobile. `data-learn-validation` was `ok` for 10-09 and `historical` for 10-10, with the exact fingerprints above. Both viewports had no document overflow (scrollWidth 1425 / 375 including the browser's scrollbar allocation).
- Both editions: interactive quizzes, deliberately wrong answer feedback, correct answers, explicit practice confirmation, completion and reload restoration passed. On 10-10 mobile a wrong answer canceled completion and disabled the completion button; correcting it permitted explicit completion again.
- Both editions: desktop chapter buttons and mobile drawer navigation scrolled to the selected section; mobile drawer closed after selection. Desktop target heading offsets were approximately 145px, below the toolbar. The 10-10 chart displayed 20/90/50/75/48 fictional units; 10-09 displayed 1/2/3 illustrative evidence items, with expandable data tables and teaching labels retained.
- No hydration, minified React or uncaught rendering errors observed across the six page loads/reloads. Saved-progress SSR/hydration is also covered by real-snapshot tests.

### Read-only browser boundary and limits

The available browser API has no request interception. To honor the no-production-write requirement, the browser loaded **the real Preview HTML/JS/CSS through a local read-only forwarding relay**, not a local Next build or fixture page. Response bodies were streamed unchanged. The relay targeted only the verified Preview origin, held its temporary Vercel access cookie in memory, and rejected every non-GET/HEAD request and every `/api/` path before forwarding. No authentication secret is in the evidence. Header transport decoding/cache behavior and browser origin differ from direct Preview access.

The [request log](evidence/learn-historical-20261013/requests.jsonl) records 175 forwarded reads and **zero forwarded writes**. Blocked requests include 6 analytics POSTs, 2 view-count POSTs, 6 CSP-report POSTs and 6 auth-log POSTs, plus read-only session/comments/reactions APIs. The [console log](evidence/learn-historical-20261013/browser-console.json) contains six expected next-auth CLIENT_FETCH_ERROR entries caused by the blocked session endpoint; these are not hydration errors. Session/login, comments/reactions, direct-origin cookies/security policy and authenticated admin browser acceptance are outside this read-only reader acceptance. Admin classification/count/calendar are verified using the real snapshots in component tests; no production admin session was used.

This is Preview reader acceptance, not production release acceptance. The final evidence-only commit does not change the tested runtime code.

### Screenshots

| Evidence | Desktop | 390px |
| --- | --- | --- |
| 10-09 strict reader | [desktop](evidence/learn-historical-20261013/10-09-desktop.jpg) | [mobile](evidence/learn-historical-20261013/10-09-mobile.jpg) |
| 10-10 historical reader | [desktop](evidence/learn-historical-20261013/10-10-desktop.jpg) | [mobile, restored completed progress](evidence/learn-historical-20261013/10-10-mobile.jpg) |
| 10-10 chart | — | [chart and data table](evidence/learn-historical-20261013/10-10-mobile-chart.jpg) |

## Risks and rollback

The allowlist intentionally stops working if the historical document changes or future validators add failures. The reader then falls back to posts.content instead of guessing compatibility. Exact text equality means a concurrent/manual edit also falls back. The new joined metadata check can safely decline other inconsistent records that previously passed document-only checks.

This exception does not independently verify scientific claims or restore 10-10 to new-publication compliance. No additional historical editions are grandfathered automatically.

Rollback: revert this PR's code and redeploy through the normal authorized release procedure; the unchanged 10-10 article returns to the existing fallback. No database migration, content rollback or credential change is required. Local learning records remain tied to the unchanged canonical content fingerprint.

No changes to the 08:30 task, workflows, production database, published copy, credentials, paid API usage or production deployment are part of this PR.
