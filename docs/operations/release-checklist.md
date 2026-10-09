# Release checklist

Each phase uses a separate Windows worktree and `codex/*` branch from freshly fetched `origin/main`. Check open PRs and semantic overlap first.

Before merging:

- Record the base and final head SHA, changed invariants, test count, failures, security review and rollback anchor in the PR.
- Run `npm ci`, `npm run typecheck`, `npm run lint`, `npm test`, `npm run build:ci` (which executes `npm run build`) and `git diff --check origin/main...HEAD`. A single successful command is not full validation.
- Confirm the `validate` check and Vercel status succeeded for that exact head. Inspect the deployment's SHA and READY state separately.
- Verify relevant Preview flows at desktop and 390px, including anonymous/private boundaries, console errors and failure recovery. Keep temporary access tokens out of reports.
- Review high-risk authentication, publishing, migrations and dependency changes explicitly. CI status alone is not a security review.
- Re-fetch main and recheck concurrent PRs before merge. Do not bypass required checks.

After merging:

- Record the merge SHA and production deployment ID; READY is only deployment readiness.
- Check public `/`, `/blog`, `/learn`, `/search`, a published article and the anonymous `/admin` gate. Run affected user flows and inspect console/network failures.
- Verify database/edition/public-cache status separately for publishing changes. Never retry by deleting or overwriting production records.
- Update the execution plan only with observed evidence. Keep untested administrator writes, device tests, external schedules or recovery exercises marked pending.

## Toolchain and CI data boundary

Vercel project `shengzong-post` currently selects Node 24.x. CI selects Node 24 and pins npm 11.6.0; `package.json` records Node/npm majors and the exact npm package manager. Vercel's npm patch is not independently exposed by the project API and is not claimed identical.

Every pull request runs, including changes only under `lib/`, `components/`, dependency/config files or documentation. No path filter means no missing required checks for docs-only PRs. The workflow uses `pull_request`, read-only permissions and no repository secrets; it never runs untrusted PR code with a production database credential.

`npm run build:ci` starts an ephemeral loopback PGlite database with synthetic public/draft articles, a skill and a project. Only the child process preloads a Neon HTTP transport; production `next.config.js` and `npm run build` are unchanged. SQL runs in read-only transactions, unexpected SQL/errors fail the build even when application fallback catches them, and external writes/real Neon fetches are refused. The fixture schema is deliberately limited to build queries; add fixture columns when legitimate build queries change. It is not a fresh-production schema or a substitute for real Preview/production verification.

`npm run build:ci -- --self-test` checks SQL decoding and write rejection without a full build. Fixture output must never be deployed: deploy with the ordinary Vercel build.

## Main protection

On 2026-10-09, the main protection REST response confirmed required `validate` (GitHub Actions app 15368) and `Vercel` (app 8329), strict up-to-date checks, administrator enforcement, resolved conversations and disabled force pushes/deletions. Review approval count is zero; the checklist's security review remains an operational obligation, not a claimed enforced independent reviewer. The GitHub connector itself lacks administration access; existing Git credentials were used without logging tokens.

## Current accepted production anchor

M00: PR #13, merge `e4b894bdd1ce57c1efad0505af924e4c2212a2f7`, production `dpl_8czf41qX1VyuLzqvE9orrLLz8LVS`, READY and public browser smoke passed on 2026-10-09. Search QA evidence is under `D:\download\search-v2-validation\m00`, prefix `production-main-`.
