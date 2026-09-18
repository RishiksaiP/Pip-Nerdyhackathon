Set-Location (Split-Path $PSScriptRoot -Parent)
npm run dev -- @args
exit $LASTEXITCODE
