# AI disclosure

## Development

OpenAI Codex assisted product engineering, authored lessons, original Pip SVG/CSS, tests, debugging and documentation. OpenAI image generation created the original observatory/forest artwork; prompts and provenance are in docs/ART_PROMPTS.md. Math diagrams are deterministic application code.

## Actual Windows runtime

- Default: official Qwen3-8B Q4_K_M GGUF through llama.cpp b11026, using RTX 5070 Ti GPU offload. Strict local evaluation, correction, unique inference canary, and transfer-context generation were tested. Cloud OFF.
- Alternative: Ollama 0.34.2 with that official GGUF imported as qwen3:8b; explanation, misconception and correction fixtures passed. This alias is a local import, not a claim that Ollama registry weights were downloaded.
- Optional Qwen3-14B: configured but not installed or benchmarked.
- Speech: faster-whisper 1.2.1 / base.en / CPU int8. A synthetic Windows system-voice recording passed through browser MediaRecorder, WAV conversion, the application endpoint, faster-whisper and strict Qwen evaluation. No real child recording was used. Actual room noise/accent/hardware microphone performance still requires a human mic check.
- Authored demo: conservative deterministic rubric, selected explicitly by Safe Demo. Ordinary non-strict configurations can fall back; strict llama.cpp cannot.
- Optional OpenAI adapters remain server opt-in only; no live cloud verification was performed.

## Boundaries

Models classify expressed concepts and authored misconception codes. They do not set mastery, execute generated code or determine mathematical truth. Schema validation precedes evidence recording. Two independent transfer activities and the deterministic learner model decide mastery.

Transfer scene titles and encouraging lines are selected from an authored allowlist enforced in both the generation schema and runtime validation. This prevents fluent scene text from contradicting the displayed bottle amounts; it is constrained selection, not free-form story generation.

No hidden reasoning is requested/displayed. Provider logs contain request identifiers, timing, model, and schema/fallback status, not raw learner language. Progress uses local browser storage. Speech uses tap-to-talk/tap-to-stop, a 30-second cap, editable transcripts, cancellation on departure and typed fallback. Audio is not retained; the faster-whisper path processes PCM in memory.

The canonical demo includes labelled prior evidence and 450 seeded XP. New learners start at zero. Synthetic development tests are not held-out model accuracy or evidence of learning gains. No classroom study, contest submission or public deployment is claimed. See LICENSE_AUDIT.md.
