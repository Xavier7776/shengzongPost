# Rollback procedure

Record each release's merge SHA, exact deployment ID, public smoke result and last accepted deployment before merge. Never infer acceptance from READY alone.

Known anchors on 2026-10-09:

| Release | Commit | Deployment | Evidence |
|---|---|---|---|
| Before Search V2 | `ed7821e9e2965b0250e0ac4907c370fc08edacd2` | `dpl_927hMaqydgtF4SupdshqFB26ezHf` | Production READY |
| M00 Search V2 | `e4b894bdd1ce57c1efad0505af924e4c2212a2f7` | `dpl_8czf41qX1VyuLzqvE9orrLLz8LVS` | READY + public search/browser smoke |

1. Identify the actual affected SHA/deployment, symptom and data impact. Pause dependent merges while investigating.
2. For code-only incidents, prepare an isolated revert PR from latest main, run all affected checks and Preview QA, then merge under existing authorization. Do not reset or force-push main.
3. If an urgent Vercel deployment/alias rollback is necessary, present the exact accepted target and obtain production-operation authorization. The general implementation instruction does not authorize silently switching aliases.
4. After any rollback, repeat the affected public smoke and record the new production deployment ID. A code revert does not restore database state.
5. Preserve all production articles, users and editions. DDL, DML, secret rotation and restore operations require their own concrete approval and isolated rehearsal. Never DROP a table or DELETE a successful edition as a retry strategy.

M01 rollback reverts only CI scripts, workflow, package toolchain metadata, authentication tests and documentation. To undo branch protection, first read current settings and compare them with the recorded policy; do not erase newer protection changes. Previous main was unprotected (REST 404), with no rulesets. Do not disable protection merely to get a failing PR merged.

A production rollback exercise and an isolated data-restore exercise remain separate M11 acceptance gates; neither has been performed by writing this runbook.
