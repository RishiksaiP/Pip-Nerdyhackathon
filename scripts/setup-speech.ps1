$ErrorActionPreference = 'Stop'
$toolsDir = Join-Path $HOME '.local/share/pip-tools'
$whisperDir = Join-Path $toolsDir 'whisper'
$modelDir = Join-Path $toolsDir 'models'
New-Item -ItemType Directory -Force $whisperDir, $modelDir | Out-Null
$binary = Join-Path $whisperDir 'whisper-cli.exe'
if (-not (Test-Path $binary)) {
  Write-Host 'Installing official whisper.cpp v1.8.7 CPU build outside the repository.'
  $archive = Join-Path $toolsDir 'whisper-bin-x64.zip'
  Invoke-WebRequest -UseBasicParsing 'https://github.com/ggml-org/whisper.cpp/releases/download/v1.8.7/whisper-bin-x64.zip' -OutFile $archive
  if ((Get-FileHash $archive -Algorithm SHA256).Hash.ToLower() -ne 'd9627486e1c34a03745880485593473e047294260ce9a3cb0aa8deaf15b99af6') { throw 'Whisper archive checksum mismatch.' }
  $extractDir = Join-Path $toolsDir 'whisper-extracted'
  Expand-Archive $archive $extractDir -Force
  $found = Get-ChildItem $extractDir -Recurse -Filter whisper-cli.exe | Select-Object -First 1
  if (-not $found) { throw 'whisper-cli.exe missing from archive.' }
  Copy-Item (Join-Path $found.Directory.FullName '*') $whisperDir -Recurse -Force
}
$model = Join-Path $modelDir 'ggml-base.en.bin'
if (-not (Test-Path $model)) {
  $answer = Read-Host 'Download the English speech model (about 142 MB)? [y/N]'
  if ($answer -ne 'y') { Write-Host 'Skipped speech. Typed teaching works.'; exit 0 }
  Invoke-WebRequest -UseBasicParsing 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.en.bin' -OutFile "$model.download"
  Move-Item "$model.download" $model
}
Write-Host 'Whisper ready. The launcher finds these files automatically. CPU speech keeps GPU memory available for Qwen.'
