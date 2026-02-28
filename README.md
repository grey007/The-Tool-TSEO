# IRTE - Infrastructure Risk Trigger Engine

IRTE is an **offline-first**, standalone infrastructure diagnostic engine for personal desktop use. It runs locally, scans public internet targets safely, stores all outputs locally, and never requires hosted services.

## Features
- Offline-first local execution (no cloud dependency).
- Interactive prompt when flags are missing.
- Non-interactive CLI mode and additive subcommands.
- First-run data directory selection.
- Deterministic snapshots and drift detection.
- 40 modular risk checks across TLS, DNS/email auth, HTTP security, and crawl/integrity.
- Baseline approval workflow to reduce drift noise.
- History timeline output.
- Target set scanning with optional tags.
- Markdown export for personal reporting.
- Sitemap check probes `/sitemap.xml` and `/sitemap_index.xml` with XML detection.
- Response-time volatility is calculated from collected homepage/crawled page timings.
- Packaged Windows EXE using `pkg`.
- Atomic snapshot/config writes via temp-file + rename for crash safety.
- Engine/check timeout guards with graceful partial snapshots and `target.engineTruncated`.
- Deterministic persistence (stable object/array ordering) for reproducible output.

## Development install
```bash
npm install
npm test
npm start
```

## Build executable
```bash
npm run build:win
# Optional
npm run build:linux
npm run build:mac
```

## Core usage
Interactive:
```bash
irte
```

Scan:
```bash
irte scan --target example.com --format text
irte scan --target example.com --format json
irte scan --target example.com --export md
```

Backwards-compatible direct flags also work:
```bash
irte --target example.com --format text
```

## Profiles
Built-ins:
- `fast` (maxPages 15, depth 1, timeout 5s, concurrency 4)
- `balanced` (maxPages 60, depth 2, timeout 6s, concurrency 6)
- `strict` (maxPages 80, depth 3, timeout 7s, concurrency 6)

Commands:
```bash
irte profile list
irte profile show balanced
irte profile set strict
irte profile create custom-a --from balanced
```

## Baseline workflow
```bash
irte baseline approve --target example.com
irte baseline approve --target example.com --run 2026-02-27T04-12-33+05-00.json
irte baseline status --target example.com
irte baseline clear --target example.com
```

Drift comparison uses baseline when present, otherwise falls back to previous snapshot.

## History / timeline
```bash
irte history --target example.com --last 10 --format text
irte history --target example.com --last 20 --format json
```

## Target sets + tags
Add set:
```bash
irte targets add-set clients --file C:\targets\clients.txt
irte targets list
irte targets show clients
```

Targets file format:
```text
example.com #money-sites,#high-risk
example.org #internal-priority
example.net
```

Scan a set:
```bash
irte scan --set clients
irte scan --set clients --tag high-risk
```

## Data location
- Config file: `%LOCALAPPDATA%\\IRTE\\config.json`
- First run prompt: `Choose a folder to store IRTE runs and reports.`
- Run data in selected folder:
```
<dataDir>/
  runs/
    <target>/
      latest.json
      baseline.json
      <timestamp>.json
  logs/
  exports/
    <target>/
      <timestamp>.md
```

## Retention policy
IRTE keeps the latest 20 timestamped snapshots per target, plus `latest.json`.

## Executive output interpretation
IRTE text output for `scan` follows this exact template:

```
INFRASTRUCTURE RISK SNAPSHOT

Critical: X
Warning: X
Stable: X
Unknown: X

Most Immediate Risk:
<single line headline>

Secondary Risks:
- <bullet>
- <bullet>

Infrastructure Stability Index: XX/100
```


## JSON output schema
When using `--format json`, IRTE exposes both `rollup` (canonical) and `summary` (backward-compatible alias).
Both objects contain the same values:

```json
{
  "rollup": {
    "stabilityIndex": 84,
    "critical": 0,
    "warning": 6,
    "stable": 30,
    "unknown": 4,
    "mostImmediateRisk": "...",
    "secondaryRisks": ["...", "..."]
  },
  "summary": {
    "stabilityIndex": 84,
    "critical": 0,
    "warning": 6,
    "stable": 30,
    "unknown": 4,
    "mostImmediateRisk": "...",
    "secondaryRisks": ["...", "..."]
  }
}
```

## Exit codes
- `0` stable
- `10` warning present
- `20` critical present
- `2` engine failure
- `3` misuse / invalid args

## Resilience and durability
- Snapshot and config writes are atomic (temp write + rename) to reduce corruption risk on crashes.
- Snapshot reads validate parse/schema; invalid files are ignored with warnings (scan continues).
- Missing baseline targets auto-recover by clearing broken `baseline.json` pointer.
- Per-check timeout isolation prevents single hanging checks from stalling the run.
- Engine-level timeout (`profile.limits.maxEngineMs`, default 60s) truncates remaining checks safely and sets `target.engineTruncated=true`.
- Determinism guarantee: stable object key ordering and stable array ordering before persistence.


## What IRTE Is Not
- Not a hosted scanner service.
- Not a penetration-testing framework.
- Not a real-time monitoring SaaS.

## How To Interpret Stability Index
- Critical findings dominate scoring and apply the heaviest penalties first.
- Warning findings apply moderate penalties; multiple warnings reduce index but do not automatically collapse it to zero.
- Unknown findings apply light penalties to reflect uncertainty without over-penalizing missing data.

## Upgrade Strategy
- Keep historical snapshots and baseline pointers.
- Upgrade binary, run `irte doctor`, then run a fresh scan.
- Re-approve baseline only after intentional infrastructure changes.

## Data Folder Backup Advice
- Periodically back up `<dataDir>/runs` and `<dataDir>/exports`.
- Keep `%LOCALAPPDATA%\IRTE\config.json` with backups for profile/set continuity.
