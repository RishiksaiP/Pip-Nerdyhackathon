$ErrorActionPreference = 'Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)
Write-Host 'PIP LOCAL SETUP'
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw 'Install Node 22.13+ LTS from https://nodejs.org, then reopen PowerShell.' }
npm ci
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
if (-not (Test-Path '.env')) { Copy-Item '.env.example' '.env' }
if (-not (Get-Command ollama -ErrorAction SilentlyContinue)) {
  Write-Host 'Install Ollama from https://ollama.com/download/windows and reopen PowerShell.'
  Write-Host 'Official alternative (review before running): irm https://ollama.com/install.ps1 | iex'
} else {
  $modelList = ollama list 2>$null
  if (($modelList -join ' ') -notmatch 'qwen3:8b') {
    $answer = Read-Host 'Download Qwen3-8B (5.2 GB, stored outside this repository)? [y/N]'
    if ($answer -eq 'y') { ollama pull qwen3:8b; if ($LASTEXITCODE -ne 0) { Write-Host 'Start the Ollama app and rerun setup.' } }
  }
}
if (Get-Command py -ErrorAction SilentlyContinue) { & "$PSScriptRoot/setup-faster-whisper.ps1" } else { Write-Host 'Optional speech needs Python 3.11 with the Windows py launcher.' }
npm test
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
node scripts/doctor.mjs
Write-Host 'No database service or migration is needed. /demo?reset=1 creates the labelled seed.'
Write-Host 'Start everything: .\scripts\start-demo.ps1'
