#Requires -Version 5.1
[CmdletBinding()]
param(
    [string]$ModelPath,
    [string]$LlamaServer = 'llama-server',
    [switch]$SmokeTest,
    [ValidateRange(10, 1800)][int]$TimeoutSeconds = 300
)
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'llamacpp-common.ps1')
Start-PipLlamaCpp -Size '8b' @PSBoundParameters
