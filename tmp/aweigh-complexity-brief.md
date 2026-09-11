# Aweigh: make the engineering visible

## Objective

Build a concise, compelling demonstration of Aweigh's engineering judgment for iOS engineers, hiring teams, and an industry community. Help someone understand the consequential problems this app solves without requiring weeks of ferry travel. The public portfolio is awaiting Aweigh's App Review approval; local demo development need not depend on approval.

The owner wants Codex to orchestrate and review, with Claude Code doing most substantial work using the owner's existing Claude subscription. Use Opus for design judgment and user-visible work. Use Sonnet for fully specified plumbing and routine analysis. Do not launch an expensive oracle consult without asking. Do not turn this into a broad app redesign or an open-ended modeling project.

## Repositories

- App and scenario/capture tooling: `/Users/ztc0611/Developer/Aweigh`
- Empirical research and archive tooling: `/Users/ztc0611/Developer/wsf-research`
- Portfolio and existing Aweigh case study: `/Users/ztc0611/Developer/portfolio-website`

Read applicable AGENTS.md and CLAUDE.md instructions before work. The research checkout contains substantial uncommitted and untracked work. Preserve it. The owner reports that recorded data since March has just been brought up to today, September 8, 2026. Verify actual endpoint coverage and gaps before making a duration or completeness claim.

## First assignment: evidence and demonstration discovery

Read-only investigation of the source repositories. Return a compact evidence dossier; do not implement yet.

Start with:

- `wsf-research/AGENTS.md`
- `wsf-research/api-reference/README.md` and relevant endpoint references, before guessing endpoint behavior
- `wsf-research/audits/README.md` and recent relevant audits
- `Aweigh/scenario-server/README.md`
- `Aweigh/AppStoreScreenshots/README.md`
- `Aweigh/AppStoreScreenshots/watch-grid/README.md`
- `Aweigh/IOS_SCHEDULE_PRINCIPLES.md`
- Current app implementation corresponding to each proposed claim
- `portfolio-website/portfolio.html` and `aweigh/index.html`

Identify four to six candidate moments. Possible starting points include operational versus tidal cancellation, stale or missing capacity, service-day rollover, island-aware terminal selection, and schedule changes. These are leads, not predetermined conclusions. Find stronger stories if the current code and archive support them.

For each candidate, report:

1. The rider's concrete situation and what could go wrong.
2. A specific recorded example, with endpoint, timestamp, local archive path, and a reproducible extraction command. Distinguish an authentic event from a synthetic fault-injection case.
3. The tempting but incorrect implementation and the evidence showing why it fails.
4. The actual current app behavior, with source references. Separate implemented behavior from old research, proposals, and experiments. Do not sell a model that the app does not use.
5. How to reproduce it with the existing scenario server or capture tooling, including any smallest necessary tooling addition.
6. What a visitor could understand in about ten seconds, and what deeper explanation an engineer could choose to read.
7. Uncertainty, freshness concerns, and verification still needed.

Recommend the strongest three moments and a rough sequence. Prefer clear consequences and defensible decisions over impressive-sounding complexity. Do not read the entire archive into model context. Use targeted local scripts and the repository's decoders, accounting for both JSONL and gzipped JSONL. Critical math must run in Python or shell.

## Subsequent implementation direction

After evidence review, create a local, reviewable demo using real app recordings or captures. A small scenario selector paired with short explanations is a candidate, not a requirement. Reuse the existing site and assets where sensible. Do not recreate the whole native app in JavaScript merely to make it interactive.

Use one isolated checkout per editing agent, with explicit file ownership. Other people and agents may be editing these repositories; do not revert their changes. Preserve current app behavior unless a narrowly justified capture/debug change is necessary. Use Xcode MCP for relevant inspection and CLI builds for validation. Apply SwiftUI and animation skills if changing SwiftUI.

Public claims must be traceable to verified evidence. Archived timestamps must be labeled as recorded examples, not presented as live data. Use Pacific time with a suffix in prose, following the research repository's conventions. Keep contact information, credentials, private paths, local network addresses, and raw private research material out of public artifacts. Do not deploy, publish, contact people, or post to Slack.

No em dashes in user-facing text. Make the visual result legible on mobile, with reduced-motion support and usable controls. End with screenshots or recordings of the result, concise verification notes, and any remaining limitations.

## Completion standard

A visitor can see a consequential situation, understand how Aweigh handles it, and inspect the reasoning and evidence without installing the app. The result demonstrates product and engineering judgment, rather than merely listing features or showing an exhaustive state grid.
