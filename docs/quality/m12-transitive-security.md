# M12-D compatible transitive dependency patches

2026-10-10. Stacked on Draft M12-C; not approved for production. Only the lockfile changes dependency versions; no new direct dependency, override, forced peer resolution or major upgrade.

| Package | Before | Candidate | Reachability |
|---|---|---|---|
| Undici | 7.29.0 | 7.30.0 | jsdom development dependency; not Node's embedded fetch implementation |
| baseline-browser-mapping | 2.10.33 | 2.11.28 | Next/build browser targets |
| browserslist | 4.28.2 | 4.29.3 | Autoprefixer and compilation targets; its browser data also updates |
| brace-expansion | 1.1.15 | 1.1.21 | ESLint's minimatch3; existing nested5.0.12 unchanged |
| nanoid | 3.3.16 | 3.3.20 | PostCSS dependency |
| source-map-js | 1.2.1 | 1.2.2 | PostCSS and jsdom CSS source maps |
| postcss-selector-parser | 6.1.2 | 6.1.4 | Tailwind3 build dependency; only the compatible recursion patch is covered |

Application modules do not directly import these packages. Build/test inputs remain repository-controlled; no API accepts caller-selected glob patterns, browser target arguments or indexed source maps. This is a reachability assessment, not proof that every transitive call is unreachable.

Primary notices: [Nano ID zero-size loop](https://github.com/advisories/GHSA-2v37-7h3g-55p8), [Baseline invalid-input process exit](https://github.com/advisories/GHSA-w5vr-8v7q-w6rv), [indexed source-map offset amplification](https://github.com/advisories/GHSA-68fv-2mgg-jv7q), [selector recursion](https://github.com/advisories/GHSA-w9m9-85wc-3x92). A bounded child-process regression exercises the actual installed packages: zero-size custom generators return; invalid Baseline arguments throw without exiting; huge and cumulatively huge indexed offsets reject, with valid generation/mapping controls. A vulnerable lockfile cannot hang the parent runner indefinitely.

Remaining [braces nested-pattern DoS](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) has no compatible patched3.x version; its Tailwind/ESLint/glob dependents account for seven high audit entries, rather than seven independent flaws. [Flat selector CPU amplification](https://github.com/advisories/GHSA-rj75-hqrm-r3gf) needs selector-parser7.1.6 and remains under Tailwind3's6.x constraint. Do not silently move to Tailwind4, override a major parser version, or downgrade Next's ESLint configuration to14 as npm audit suggests. No CSS/glob parser is offered as a public service by this application.

The final compatible patch set reports9 findings (2 moderate/7 high/0 critical), compared with C's14. Before the selector recursion patch the count was8; npm now also labels postcss-nested through the remaining selector advisory. Counts include dependent packages and are not independent flaw counts. The production-only dependency audit is0; that excludes development/build tools and does not certify the application or hosting runtime. Local Node24.9.0 embeds Undici7.16.0; lockfile updates do not patch that host executable. ESLint9's support limit and existing Compiler warnings also remain.

Before the base refresh, restored lockfile installation: npm ci, 72 files/475 tests, typecheck, lint(0 errors/100 warnings), complete85-page fixture build and diff check pass. Every installed lockfile entry checked (634) matches its locked version; native Windows Sharp loads0.35.5. Full npm ls --all still reports four optional WASM packages as extraneous and @emnapi/core missing in that optional graph, identically reproduced on the unchanged M12-C installation. This is an open installation diagnostic; do not call the complete npm ls --all output clean.

An attempted npm prune with package-lock=false rebuilt the local installation from ranges instead of the lockfile. The lockfile did not change; that installation and its checks are excluded. npm ci restored the locked tree and all affected tests/type/lint/build were repeated successfully. The first source-map control queried column0 and exposed the existing indexed-map boundary behavior; the valid column1 control verifies the actual mapped source. Failure logs are retained outside Git. Exact-head CI/Preview and browser checks remain pending.

No production data, schema, secrets, DSN, provider configuration, publishing schedule or editor behavior changes. Keep the stacked PR Draft until its base is approved and all exact-head gates pass. The user's instruction to keep PR30 Draft is still in force.

The base was refreshed by ordinary merge of C1f91520, which includes B's e40377d performance patch. No editor or lockfile patch was overwritten or force-pushed. Refreshed local gates and exact-head CI/Preview/browser checks remain pending; earlier successful checks are retained as historical evidence.
