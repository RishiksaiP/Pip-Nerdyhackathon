Set-Location (Split-Path $PSScriptRoot -Parent)
node scripts/start-demo.mjs @args
exit $LASTEXITCODE
