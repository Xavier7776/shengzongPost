# Historical edition evidence audit, 2026-10-10

Scope: the only published edition, `daily-learn-2026-10-09`, checked read-only. These are author-reported findings, not a local reproduction. No production content changed.

Primary source: [arXiv 2610.10170v1](https://arxiv.org/html/2610.10170v1), submitted October 7, 2026; Kuehlkamp, Moreira and Rund, Notre Dame. Title/date/version/author metadata and full-text locations were checked. The stored v1 document retains its original URLs and fingerprint.

Ten claims selected from a 14-item inventory with Fisher–Yates/LCG seed 20261010 (selected inventory IDs 6,10,0,9,4,8,2,7,5,3). Inventory 0–9: placebo, mechanisms, shared vectors, length, coverage, means, C1, C2, generation, C4; 10–13: reranker gap, first-stage recall, Holm significance, effect size. Indices below identify zero-based document blocks, including headings/callouts.

| Index | Claim | Source location | Result |
| --- | --- | --- | --- |
| 14 | C1: +.0218/+.0115 | Table 1, primary cell | Match |
| 18 | Reranker shrinks QASPER gap to −.0038 | §6.4 | Match |
| 3 | Placebo uses shuffled heading paths | §3.2 | Match |
| 17 | C4 losses: −.0326/−.0147; top-five centroid routing only | Table 1, §8 | Match |
| 10 | Coverage metric discounts repeated evidence | §5.1, Appendix B | Match |
| 15 | Answer generation is unevaluated | §8 | Match |
| 7 | A3/A4 share chunk vectors | §3.2 | Match |
| 14 | C2: +.0099/+.0161 | Table 1, primary cell | Match |
| 13 | A0–A3 Wikipedia: .362/.391/.403/.413; QASPER: .098/.114/.117/.125 | Table 2, strong embedder, no reranker | Match |
| 9 | Chunk length is controlled | §3.2 | Match |

§4.2 distinguishes 1,585 source papers from 1,508 papers with usable questions. Retain that distinction. Significance is author-reported clustered bootstrap/Holm; it does not establish downstream accuracy.

The secondary updates were checked against their [function-aware retrieval abstract](https://arxiv.org/abs/2610.09361v1) and [retrieval diversity abstract](https://arxiv.org/abs/2610.09412v1), both October 7 v1. They support the recorded summaries; neither abstract establishes a local or clinical reproduction. Their detailed experiments were not independently audited in this sample.

The existing chart and code remain teaching examples. No historical document was promoted to schema v2 or silently rewritten. Full v1 structural/text/SSR/browser regression and corresponding CI/Preview evidence are recorded in the execution plan.
