# Archive evidence assignment

Model: Sonnet. Launch with `--permission-mode auto` so local analysis commands and the assigned report write can proceed through automatic review.

Read `aweigh-complexity-brief.md` beside this file. Own empirical evidence discovery. Source repositories are read-only for this assignment; write the report to `/private/tmp/aweigh-showcase-team/archive-evidence.md`. Other agents are working concurrently. Preserve their work and all existing changes. Do not spawn subagents.

The updated local archive includes `wsf-research/data/vessellocations_archive/` and `wsf-research/data/routedetails_today/`, both updated September 8. The older snapshot is under `data/2026-06-10/`. Determine coverage separately for each endpoint, not from directory names or the owner's recollection. Account for dedupe-on-write: a missing timestamp can mean an unchanged payload. Avoid remote Pi access if local evidence is sufficient.

Find four to six defensible stories from the archive, then recommend three. For each, supply a real timestamp and local fixture source, a targeted reproduction/extraction command, the rider consequence, and the uncertainty. Prioritize cancellation meaning, disappearance of capacity data, service-day boundaries, and observed versus published crossing times where supported. Current app support must be distinguished from research proposals; a separate app investigator will cross-check it.

Read the research AGENTS.md, CLAUDE.md, endpoint reference index, relevant endpoint references, and recent audits first. Do not perform a new exhaustive model tournament or scrape the whole archive into context. Use Python or shell for math and small reproducible analysis scripts in the temporary output directory. Avoid credentials and contact details. Do not publish, deploy, message people, or change source files or the Pi. Report blockers rather than altering access configuration.

Return a compact dossier with an appendix of exact reproduction commands. Record whether each candidate is backed by a real event or only a synthetic fault test. Stop after writing the dossier.
