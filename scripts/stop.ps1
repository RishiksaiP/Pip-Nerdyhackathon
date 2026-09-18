Set-Location (Split-Path $PSScriptRoot -Parent)
node scripts/stop-demo.mjs
exit $LASTEXITCODE
