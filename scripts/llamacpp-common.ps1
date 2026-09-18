# Shared by the Windows PowerShell 5.1+ launchers and downloader.
function Get-PipProjectRoot {
    $root = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).ProviderPath
    if (-not (Test-Path -LiteralPath (Join-Path $root 'package.json') -PathType Leaf)) {
        throw "Cannot locate the Pip project at $root. Keep these scripts in the project's scripts folder."
    }
    return $root
}

function Resolve-PipFile {
    param([string]$Path, [string]$ProjectRoot)
    if (-not [IO.Path]::IsPathRooted($Path)) { $Path = Join-Path $ProjectRoot $Path }
    if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) { throw "File not found: $Path" }
    return (Resolve-Path -LiteralPath $Path).ProviderPath
}

function Assert-PipGguf {
    param([string]$Path)
    $file = Get-Item -LiteralPath $Path -ErrorAction Stop
    $stream = [IO.File]::OpenRead($file.FullName)
    try {
        $magic = New-Object byte[] 4
        if ($stream.Read($magic, 0, 4) -ne 4 -or
            [Text.Encoding]::ASCII.GetString($magic) -ne 'GGUF' -or $file.Length -le 24) {
            throw "Not a valid GGUF file: $Path. Delete the invalid file and download again."
        }
    } finally { $stream.Dispose() }
    Write-Host ('Model: {0}' -f $file.FullName)
    Write-Host ('Size: {0:N0} bytes ({1:N2} GiB)' -f $file.Length, ($file.Length / 1GB))
}

function Resolve-PipLlamaServer {
    param([string]$LlamaServer, [string]$ProjectRoot)
    if ([IO.Path]::IsPathRooted($LlamaServer) -or $LlamaServer -match '[/\\]') {
        return Resolve-PipFile -Path $LlamaServer -ProjectRoot $ProjectRoot
    }
    $command = Get-Command $LlamaServer -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
    if (-not $command) {
        throw 'llama-server was not found. Install llama.cpp, add its binary folder to PATH, or pass -LlamaServer "C:\Tools\llama.cpp\llama-server.exe". See DEMO_SETUP.md.'
    }
    return $command.Source
}

function Assert-PipLlamaPort {
    # On Windows check IPv4/IPv6 listeners, then try an exclusive loopback bind.
    # Avoid macOS listener enumeration, which can stall in restricted environments.
    if ($env:OS -eq 'Windows_NT') {
        $listeners = [Net.NetworkInformation.IPGlobalProperties]::GetIPGlobalProperties().GetActiveTcpListeners()
        if (@($listeners | Where-Object { $_.Port -eq 8080 }).Count -gt 0) {
            throw 'Port 8080 is already in use. Stop its server in the original terminal before starting another model.'
        }
    }
    $probe = [Net.Sockets.TcpListener]::new([Net.IPAddress]::Loopback, 8080)
    try {
        $probe.Server.ExclusiveAddressUse = $true
        $probe.Start()
    } catch {
        throw "Port 8080 is unavailable: $($_.Exception.Message)"
    } finally { $probe.Stop() }
}

function Show-PipNvidiaGpu {
    $smi = Get-Command nvidia-smi -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
    # Older Windows driver installations may not put NVSMI on PATH.
    if (-not $smi -and $env:ProgramFiles) {
        $candidate = Join-Path $env:ProgramFiles 'NVIDIA Corporation\NVSMI\nvidia-smi.exe'
        if (Test-Path -LiteralPath $candidate -PathType Leaf) { $smi = Get-Command $candidate }
    }
    if ($smi) {
        $gpu = & $smi.Source '--query-gpu=name,memory.total,driver_version' '--format=csv,noheader'
        if ($LASTEXITCODE -ne 0 -or -not $gpu) {
            throw 'nvidia-smi could not verify the NVIDIA GPU. Check the NVIDIA driver with nvidia-smi before retrying.'
        }
        Write-Host 'NVIDIA GPU (name, total memory, driver):'
        $gpu | ForEach-Object { Write-Host "  $_" }
        Write-Host 'Use a CUDA-enabled llama.cpp build; confirm GPU offload in its startup log.'
    } else {
        Write-Warning 'nvidia-smi is unavailable; NVIDIA acceleration is unverified. llama.cpp may use another backend (such as Metal) or CPU. Check its startup log.'
    }
}

function Start-PipLlamaCpp {
    param(
        [ValidateSet('8b', '14b')][string]$Size,
        [string]$ModelPath,
        [string]$LlamaServer = 'llama-server',
        [switch]$SmokeTest,
        [ValidateRange(10, 1800)][int]$TimeoutSeconds = 300
    )
    $root = Get-PipProjectRoot
    $server = Resolve-PipLlamaServer -LlamaServer $LlamaServer -ProjectRoot $root
    if (-not $ModelPath) { $ModelPath = 'models/qwen3-{0}/Qwen3-{1}-Q4_K_M.gguf' -f $Size, $Size.ToUpperInvariant() }
    try { $model = Resolve-PipFile -Path $ModelPath -ProjectRoot $root }
    catch { throw "$($_.Exception.Message) Run scripts/download-gguf-models.ps1$(if ($Size -eq '14b') { ' -Quality' }) or pass -ModelPath." }
    Assert-PipGguf -Path $model
    Assert-PipLlamaPort
    Show-PipNvidiaGpu
    $alias = "qwen3-$Size"
    $serverArgs = @('-m', $model, '--host', '127.0.0.1', '--port', '8080',
        '--ctx-size', '8192', '--gpu-layers', 'all', '--flash-attn', 'on',
        '--parallel', '1', '--alias', $alias)
    Write-Host "Project root: $root"
    Write-Host "llama-server: $server"
    Write-Host "Model alias: $alias"
    Write-Host 'API URL: http://127.0.0.1:8080/v1'
    Write-Host 'Health URL: http://127.0.0.1:8080/health'
    if (-not $SmokeTest) {
        Write-Host 'Starting llama.cpp. Keep this terminal open; Ctrl+C stops it. Wait for /health to report status ok.'
        & $server @serverArgs
        if ($LASTEXITCODE -ne 0) { throw "llama-server exited with code $LASTEXITCODE. See its output above." }
        return
    }

    $logBase = Join-Path ([IO.Path]::GetTempPath()) ('pip-llamacpp-' + [Guid]::NewGuid().ToString('N'))
    $process = $null
    try {
        # Start-Process joins ArgumentList into a command line even on PowerShell 7.
        # Quote paths explicitly so spaces in Windows user/project folders survive.
        if ($model.Contains('"')) { throw 'Model paths containing double quotes are unsupported.' }
        $quotedArgs = $serverArgs | ForEach-Object { '"' + $_ + '"' }
        $process = Start-Process -FilePath $server -ArgumentList $quotedArgs -WorkingDirectory $root `
            -PassThru -NoNewWindow -RedirectStandardOutput "$logBase.stdout.log" -RedirectStandardError "$logBase.stderr.log"
        Write-Host "Smoke test logs: $logBase.stdout.log and $logBase.stderr.log"
        $deadline = [DateTime]::UtcNow.AddSeconds($TimeoutSeconds)
        $ready = $false
        while ([DateTime]::UtcNow -lt $deadline) {
            if ($process.HasExited) { throw "llama-server exited early with code $($process.ExitCode). Check the smoke test logs." }
            try {
                $health = Invoke-RestMethod -Uri 'http://127.0.0.1:8080/health' -TimeoutSec 3
                $ready = $health.status -eq 'ok'
            } catch { $ready = $false }
            if ($ready) { break }
            Start-Sleep -Seconds 1
        }
        if (-not $ready) { throw "llama.cpp did not become healthy within $TimeoutSeconds seconds. Check the smoke test logs." }
        $models = Invoke-RestMethod -Uri 'http://127.0.0.1:8080/v1/models' -TimeoutSec 10
        if ($alias -notin @($models.data.id)) { throw "Server did not advertise the expected model alias $alias." }
        $body = @{
            model = $alias
            messages = @(@{ role = 'user'; content = 'Reply with only the word OK. /no_think' })
            chat_template_kwargs = @{ enable_thinking = $false }
            max_tokens = 32
            temperature = 0
            stream = $false
        } | ConvertTo-Json -Depth 6
        $response = Invoke-RestMethod -Uri 'http://127.0.0.1:8080/v1/chat/completions' `
            -Method Post -ContentType 'application/json' -Body $body -TimeoutSec $TimeoutSeconds
        if ([string]::IsNullOrWhiteSpace($response.choices[0].message.content)) { throw 'Smoke test returned no generated text.' }
        if ($process.HasExited) { throw 'llama-server exited during the smoke test.' }
        Write-Host "PASS: health, model alias and chat inference verified for $alias."
    } finally {
        if ($process -and -not $process.HasExited) {
            Stop-Process -Id $process.Id -Force -ErrorAction Stop
            if (-not $process.WaitForExit(10000)) { throw 'The smoke test server did not stop within 10 seconds.' }
        }
        if ($process) { $process.Dispose() }
        Write-Host 'Smoke test finished; its temporary server has been stopped.'
    }
}
