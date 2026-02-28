# Windows Task Scheduler

Use Task Scheduler to execute `irte.exe --target example.com --format text` on a recurring basis.

- Program/script: `C:\path\to\irte.exe`
- Add arguments: `--target example.com --format json`
- Start in: folder containing executable.


## Local verification script

From the repository root, run:

```powershell
powershell -ExecutionPolicy Bypass -File ops/windows/verify.ps1
```

This runs `doctor`, scans default targets, writes `audits/*.json`, and prints a rollup-based table.
