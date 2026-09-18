Set-Location (Split-Path $PSScriptRoot -Parent)
node scripts/doctor.mjs @args
exit $LASTEXITCODE
