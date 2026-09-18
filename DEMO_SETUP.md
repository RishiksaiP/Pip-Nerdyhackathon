# Pip — Windows setup and demo day

## Already installed on this PC

Open PowerShell and run this one command:

```powershell
& "C:\Users\panju\OneDrive\Desktop\nerdy\scripts\start-demo.ps1"
```

Wait for **PIP IS READY**. The launcher starts the production frontend/API, llama.cpp with Qwen3-8B, and faster-whisper. It warms both models, verifies a real backend evaluation, forces cloud OFF, and opens:

[Live presentation](http://localhost:3176/demo?presentation=1&reset=1&provider=llamacpp)

Keep the terminal open. Stop only Pip-owned services with `npm run stop:demo` from the project directory. An already-running launcher prints its URL instead of starting duplicates.

**This PC:** Windows, RTX 5070 Ti / 16 GB VRAM, 32 GB RAM. Default inference is the previously configured **llama.cpp**, preserving the verified GGUF setup. Ollama 0.34.2 is also installed and verified with the same official Qwen GGUF imported as `qwen3:8b`. The two inference servers must not load models simultaneously. Quality 14B is optional and not installed.

## First-time setup on a clean Windows PC

### 1. Open the project

```powershell
git clone https://github.com/RishiksaiP/nerdy.git
cd nerdy
```

This working release must be committed/pushed before a new clone contains these changes. Alternatively copy the source folder, excluding node_modules, .next, dist, .pip-run, model weights and tool environments.

### 2. Prerequisites

- Node 22.13+ and npm; verified here with Node 24.13.1.
- Python 3.11 with the Windows `py` launcher for the pinned speech environment.
- Current Chrome/Edge; localhost is a secure microphone context.
- NVIDIA driver for accelerated inference. No separate database is needed.

```powershell
node --version
npm --version
py -3.11 --version
nvidia-smi
```

Official installers: [Node](https://nodejs.org/en/download), [Python](https://www.python.org/downloads/windows/).

### 3. Install dependencies

```powershell
npm ci
Copy-Item .env.example .env
```

Do not overwrite an existing configured .env. `scripts/setup.ps1` offers an interactive project/dependency setup; models are separate downloads.

### 4. Local reasoning: choose one provider

**Simplest clean-machine path — Ollama:** install from the [official Windows download](https://ollama.com/download/windows), open Ollama, then reopen PowerShell.

```powershell
ollama --version
ollama pull qwen3:8b
ollama list
Invoke-RestMethod http://127.0.0.1:11434/api/tags
```

This downloads about 5 GB. Only run `ollama serve` if the API is unavailable and port 11434 is free. The Pip launcher can start it when installed.

Set these values in .env:

```dotenv
AI_PROVIDER=ollama
PIP_STRICT_LOCAL_AI=false
LOCAL_AI_BASE_URL=http://127.0.0.1:11434
LOCAL_AI_MODEL=qwen3:8b
LOCAL_AI_QUALITY_MODEL=qwen3:14b
LLAMACPP_BASE_URL=http://127.0.0.1:8080/v1
LLAMACPP_MODEL=qwen3-8b
AI_TIMEOUT_MS=15000
ALLOW_CLOUD_FALLBACK=false
AI_FALLBACK_PROVIDER=none
DEMO_MODE=false
LOCAL_STT_URL=http://127.0.0.1:8178
```

Start with `npm run start:demo -- --ollama`. The explicit flag chooses this alternative.

**This PC’s default — llama.cpp:** install an official CUDA-enabled Windows release from [llama.cpp releases](https://github.com/ggml-org/llama.cpp/releases). Keep the executable and DLLs together outside the repository. Then:

```powershell
.\scripts\download-gguf-models.ps1
```

The default downloader retrieves only official Qwen3-8B Q4_K_M. Configure:

```dotenv
AI_PROVIDER=llamacpp
PIP_STRICT_LOCAL_AI=true
LLAMACPP_BASE_URL=http://127.0.0.1:8080/v1
LLAMACPP_MODEL=qwen3-8b
PIP_LLAMA_SERVER=C:/Users/panju/.local/share/pip-tools/llama.cpp-b11026/llama-server.exe
PIP_LLAMA_MODEL=models/qwen3-8b/Qwen3-8B-Q4_K_M.gguf
AI_TIMEOUT_MS=15000
ALLOW_CLOUD_FALLBACK=false
AI_FALLBACK_PROVIDER=none
LOCAL_STT_URL=http://127.0.0.1:8178
```

Replace the executable path on another machine. Strict mode fails visibly if inference fails; it never substitutes the authored rubric for a live evaluation.

### 5. Optional quality model

`ollama pull qwen3:14b` downloads roughly 9 GB. It is not required, installed, or benchmarked here. Stop 8B before switching; do not run alongside llama.cpp. The Lab’s Quality Local option is for evaluation, not the default demo.

### 6. Install local speech

```powershell
.\scripts\setup-faster-whisper.ps1 -DownloadModel
```

This creates a separate Python 3.11 environment under your user tool directory, installs the pinned speech dependencies, downloads base.en (about 145 MB), and writes only its three speech settings into .env. CPU int8 keeps GPU memory for Qwen. No CUDA speech libraries or system FFmpeg installation are required. The Python dependency includes PyAV/FFmpeg libraries; see LICENSE_AUDIT.md before redistributing tools.

On this PC these settings are already configured:

```dotenv
PIP_SPEECH_ENGINE=faster-whisper
PIP_PYTHON=C:/Users/panju/.local/share/pip-tools/faster-whisper-env/Scripts/python.exe
PIP_FASTER_WHISPER_MODEL=C:/Users/panju/.local/share/pip-tools/models/faster-whisper-base.en
```

The older whisper.cpp adapter remains available through `PIP_SPEECH_ENGINE=whisper.cpp`.

### 7. Initialize, launch, verify

No database migration. `/demo?reset=1` creates the labelled demo seed; ordinary play starts with zero XP.

```powershell
npm test
.\scripts\start-demo.ps1
```

In another terminal, from the project folder:

```powershell
.\scripts\doctor.ps1
Invoke-RestMethod http://localhost:3176/api/health
```

The default startup must report backend → llama.cpp → Qwen **PASS**, **Whisper: Local — Warm**, and **Cloud: OFF**. In [Technical Lab](http://localhost:3176/lab), check the actual provider/model and speech status. Run `npx tsx scripts/test-live-ai.ts` for strict live fixtures.

### 8. Test microphone

Choose the 1/4 bottle → **Show Pip** → **Talk to Pip**. Speak the explanation below → **Stop recording**. Read/edit the transcript → **Teach Pip**. The recording indicator and timer must disappear. Typing always remains available.

## Procedure A — full local live demo

1. Open PowerShell; run the one-command launcher above.
2. Open the live presentation URL; its reset parameter is consumed once so refresh resumes progress.
3. Choose **Moonberry Potion, 1/4 full** → **Show Pip**.
4. Talk or type: **“They are the same size bottle, but when you split it into more equal pieces every piece gets smaller.”**
5. **Teach Pip** → **No — I’ll show you** → select **1/4**.
6. Talk or type the correction: **“They are the same size whole. More equal pieces make each piece smaller. One fourth has more potion than one eighth.”**
7. **Here’s why** → read Pip’s revised notebook → **Let me prove it**.
8. Select **2/6** on the number line (the point equal to 1/3) → **Prove it**.
9. Select the **1/3** Moonberry bottle → **Prove it**.
10. Level 5 appears for 3.8 seconds, or use **Skip celebration**. Choose scarf, notebook, or goggles.
11. **Visit Pip’s room** → discoveries/notebook/constellation → **For grown-ups** → **How Pip learns**.
12. **Reset demo ↺** on the demo returns to Level 4 / 450 seeded XP. A full independent hero run ends at 665 XP; mistakes/hints can change rewards and mastery.
13. Stop with `npm run stop:demo`.

## Procedure B — safe recording

Stop the live launcher, then run:

```powershell
npm run start:safe
```

Use [authored presentation](http://localhost:3176/demo?presentation=1&reset=1&provider=demo). Use typed explanations and the exact clicks above. The server enforces the authored provider, with no model inference; label the recording accordingly. Safe mode retains real math checks, evidence, independent-transfer requirements and persistent rewards. It is not a fake live-AI recording.

At 1920×1080 and 1440×900 the hero teaching stages fit the recording frame. Smaller desktops prioritize the task controls; secondary progression may extend below the fold. The post-quest reward/room screens intentionally scroll.

See [emergency card](DEMO_CHEATSHEET.md), [checklist](DEMO_DAY_CHECKLIST.md), [troubleshooting](TROUBLESHOOTING.md), and [three-minute script](DEMO_SCRIPT.md).
