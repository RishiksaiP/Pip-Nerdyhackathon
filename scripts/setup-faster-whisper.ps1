#Requires -Version 5.1
[CmdletBinding()]
param([switch]$DownloadModel)
$ErrorActionPreference = 'Stop'
$pipRoot = Split-Path $PSScriptRoot -Parent
$pipTools = Join-Path $env:USERPROFILE '.local\share\pip-tools'
$pipEnv = Join-Path $pipTools 'faster-whisper-env'
$pipPython = Join-Path $pipEnv 'Scripts\python.exe'
$pipModel = Join-Path $pipTools 'models\faster-whisper-base.en'
if (-not (Test-Path -LiteralPath $pipPython)) {
  py -3.11 -m venv $pipEnv
  if ($LASTEXITCODE -ne 0) { throw 'Install Python 3.11 with the Windows py launcher.' }
}
& $pipPython -m pip install -r (Join-Path $PSScriptRoot 'requirements-speech.txt')
if ($LASTEXITCODE -ne 0) { throw 'Speech dependency installation failed.' }
if (-not (Test-Path -LiteralPath (Join-Path $pipModel 'model.bin'))) {
  if (-not $DownloadModel) {
    $pipAnswer = Read-Host 'Download the English speech model (about 145 MB)? [y/N]'
    if ($pipAnswer -ne 'y') { Write-Host 'Speech skipped. Typed teaching is ready.'; exit 0 }
  }
  & $pipPython -c "from huggingface_hub import snapshot_download; import sys; snapshot_download('Systran/faster-whisper-base.en', local_dir=sys.argv[1], allow_patterns=['model.bin','config.json','tokenizer.json','vocabulary.*','preprocessor_config.json'])" $pipModel
  if ($LASTEXITCODE -ne 0) { throw 'Speech model download failed.' }
}
$pipEnvPath = Join-Path $pipRoot '.env'
$pipExisting = if (Test-Path -LiteralPath $pipEnvPath) { Get-Content -LiteralPath $pipEnvPath } else { @() }
$pipExisting = @($pipExisting | Where-Object { $_ -notmatch '^(PIP_SPEECH_ENGINE|PIP_PYTHON|PIP_FASTER_WHISPER_MODEL)=' })
$pipExisting += @('PIP_SPEECH_ENGINE=faster-whisper', ('PIP_PYTHON=' + $pipPython.Replace('\','/')), ('PIP_FASTER_WHISPER_MODEL=' + $pipModel.Replace('\','/')))
[IO.File]::WriteAllLines($pipEnvPath, $pipExisting, (New-Object Text.UTF8Encoding($false)))
Write-Host 'faster-whisper ready: base.en, CPU int8. Run .\scripts\start-demo.ps1.'
