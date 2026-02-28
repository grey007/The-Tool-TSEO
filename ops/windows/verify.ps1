[CmdletBinding()]
param(
  [string[]]$Targets = @('example.com', 'apple.com')
)

$ErrorActionPreference = 'Stop'

if (-not (Test-Path -LiteralPath '.\package.json')) {
  Write-Error 'Run this script from the repository root (package.json not found).'
  exit 1
}

if (-not (Test-Path -LiteralPath '.\bin\irte.js')) {
  Write-Error 'Could not find .\bin\irte.js. Run from the IRTE repo root.'
  exit 1
}

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Error 'Node.js is required but was not found in PATH.'
  exit 1
}

$auditDir = Join-Path (Get-Location) 'audits'
if (-not (Test-Path -LiteralPath $auditDir)) {
  New-Item -ItemType Directory -Path $auditDir | Out-Null
}

Write-Host '== IRTE Doctor ==' -ForegroundColor Cyan
& node .\bin\irte.js doctor
if ($LASTEXITCODE -ne 0) {
  Write-Error ("Doctor failed with exit code {0}." -f $LASTEXITCODE)
  exit $LASTEXITCODE
}

$rows = @()

foreach ($target in $Targets) {
  $safeName = ($target -replace '[^a-zA-Z0-9._-]', '_')
  $outFile = Join-Path $auditDir ($safeName + '.json')

  Write-Host ("== Scanning {0} ==" -f $target) -ForegroundColor Cyan
  $jsonText = & node .\bin\irte.js scan --target $target --format json 2>&1
  $scanExit = $LASTEXITCODE

  if ($scanExit -ne 0 -and $scanExit -ne 10 -and $scanExit -ne 20) {
    Write-Warning ("Scan failed for {0} with exit code {1}." -f $target, $scanExit)
    continue
  }

  $jsonString = ($jsonText | Out-String)
  $jsonString | Set-Content -LiteralPath $outFile -Encoding UTF8

  try {
    $snapshot = $jsonString | ConvertFrom-Json
  } catch {
    Write-Warning ("Failed to parse JSON for {0}. Raw output saved to {1}" -f $target, $outFile)
    continue
  }

  if ($null -eq $snapshot.rollup) {
    Write-Warning ("Missing rollup in scan output for {0}." -f $target)
    continue
  }

  $rows += [PSCustomObject]@{
    Target = $target
    StabilityIndex = $snapshot.rollup.stabilityIndex
    Critical = $snapshot.rollup.critical
    Warning = $snapshot.rollup.warning
    Stable = $snapshot.rollup.stable
    Unknown = $snapshot.rollup.unknown
    MostImmediateRisk = $snapshot.rollup.mostImmediateRisk
    AuditFile = $outFile
  }
}

if ($rows.Count -eq 0) {
  Write-Warning 'No successful scans were produced.'
  exit 1
}

Write-Host ''
Write-Host '== Verification Summary ==' -ForegroundColor Green
$rows | Sort-Object Target | Format-Table -AutoSize

Write-Host ''
Write-Host ("Audit JSON files written to: {0}" -f $auditDir) -ForegroundColor Green
