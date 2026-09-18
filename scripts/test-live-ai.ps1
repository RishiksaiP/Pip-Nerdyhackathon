#Requires -Version 5.1
$ErrorActionPreference = 'Stop'
Push-Location (Split-Path $PSScriptRoot -Parent)
try {
    if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw 'Install Node 22.13+ and reopen PowerShell.' }
    & node 'node_modules/tsx/dist/cli.mjs' 'scripts/test-live-ai.ts' @args
    if ($LASTEXITCODE -ne 0) { throw "Live AI integration failed (exit $LASTEXITCODE)." }
} finally { Pop-Location }
