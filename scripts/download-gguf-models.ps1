#Requires -Version 5.1
[CmdletBinding()]
param(
    # Select ONLY the optional 14B model instead of the default 8B model.
    [switch]$Quality,
    [switch]$SmokeTest,
    [string]$LlamaServer = 'llama-server',
    [ValidateRange(10, 1800)][int]$TimeoutSeconds = 300
)
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'llamacpp-common.ps1')
$root = Get-PipProjectRoot
$size = if ($Quality) { '14B' } else { '8B' }
$directory = Join-Path $root ("models/qwen3-" + $size.ToLowerInvariant())
$filename = "Qwen3-$size-Q4_K_M.gguf"
$destination = Join-Path $directory $filename
$url = "https://huggingface.co/Qwen/Qwen3-$size-GGUF/resolve/main/$filename"

if (Test-Path -LiteralPath $destination -PathType Leaf) {
    Write-Host 'Using the existing model; no download needed.'
} else {
    # Use the actual curl executable, not Windows PowerShell's curl alias.
    $curl = Get-Command curl.exe, curl -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
    if (-not $curl) { throw 'curl.exe was not found. Install curl or use a current Windows 10/11 installation, then retry.' }
    New-Item -ItemType Directory -Path $directory -Force | Out-Null
    $partial = "$destination.partial"
    Write-Host "Downloading ONLY Qwen3-$size Q4_K_M from $url"
    Write-Host "Destination: $destination"
    Write-Host 'The 8B download is about 5 GB; the optional 14B download is about 9 GB.'
    & $curl.Source --fail --location --retry 3 --connect-timeout 30 --output $partial $url
    if ($LASTEXITCODE -ne 0) {
        throw "Download failed (curl exit $LASTEXITCODE). No final model was installed. Rerun this command to replace the partial download."
    }
    Assert-PipGguf -Path $partial
    Move-Item -LiteralPath $partial -Destination $destination -ErrorAction Stop
}
Assert-PipGguf -Path $destination
Write-Host 'GGUF header checked. Use -SmokeTest to verify that llama.cpp can load it and generate text.'
if ($SmokeTest) {
    Start-PipLlamaCpp -Size $size.ToLowerInvariant() -ModelPath $destination `
        -LlamaServer $LlamaServer -SmokeTest -TimeoutSeconds $TimeoutSeconds
}
