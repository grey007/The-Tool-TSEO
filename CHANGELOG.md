# Changelog

## 1.0.0 - 2026-02-27

### Release summary
IRTE 1.0.0 freezes feature development and marks the first stable offline-first desktop release.

### Completed phases
- Core engine + CLI contract stabilized (`scan/profile/baseline/history/targets/doctor/stats`).
- Deterministic snapshotting and drift workflows finalized.
- SSRF protections and bounded crawling hardened.
- Storage durability and resilience completed (atomic writes, corruption handling, baseline recovery).
- Timeout isolation and engine truncation behavior completed.
- Scoring + rollup ordering finalized.
- Help/version UX, operational docs, and maintainability polish completed.
- Unit test suite expanded and passing across collectors, scoring, storage, CLI, and resilience paths.

### Freeze notice
- No new feature development for the next 30 days (stability window).
