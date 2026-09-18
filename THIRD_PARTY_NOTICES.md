# Third-party notices

Exact npm versions/licenses: [dependency inventory](docs/DEPENDENCY_LICENSES.json), [package lock](package-lock.json), and [included license texts](public/licenses/THIRD_PARTY_NOTICES.txt). Original asset and font provenance remains in [THIRD_PARTY.md](THIRD_PARTY.md).

| Component | Role | License / source | Distribution boundary |
|---|---|---|---|
| Qwen3-8B | Local explanation model | Apache-2.0; [Qwen model card](https://huggingface.co/Qwen/Qwen3-8B) | User-installed weights outside repository |
| Qwen3-14B | Optional quality model | Apache-2.0; [Qwen model card](https://huggingface.co/Qwen/Qwen3-14B) | Supported configuration only; not downloaded |
| Ollama | Local inference server | MIT; [source/license](https://github.com/ollama/ollama/blob/main/LICENSE) | Separately installed tool, not in app bundle |
| llama.cpp | Optional compatible inference server | MIT; [source/license](https://github.com/ggml-org/llama.cpp/blob/master/LICENSE) | No executable/weights shipped |
| whisper.cpp | Local transcription | MIT; [source/license](https://github.com/ggml-org/whisper.cpp/blob/master/LICENSE) | Separately installed CLI |
| Whisper base.en | Transcription weights | MIT; [Whisper](https://github.com/openai/whisper/blob/main/LICENSE), [converted models](https://huggingface.co/ggerganov/whisper.cpp) | User-installed, outside repository |
| Python | Small loopback adapter runtime | PSF; [license](https://docs.python.org/3/license.html) | System interpreter, not redistributed |
| faster-whisper 1.2.1 / CTranslate2 4.8.2 | Current Windows speech inference | MIT, installed package metadata; [project](https://github.com/SYSTRAN/faster-whisper) | External user Python environment |
| PyAV 18.1.0 | faster-whisper dependency | BSD-3-Clause wrapper; bundled FFmpeg libraries have separate reciprocal licensing | Not included in the application bundle; see LICENSE_AUDIT.md |
| Chewy / Roboto 2 | Self-hosted fonts | Apache-2.0; original license files under `public/licenses` | Unmodified font assets shipped |
| Lucide | Icons | ISC | Notice preserved |
| React, Next, Zod, Vinext and UI tooling | Application | MIT; exact details in inventory | Runtime license audit checks emitted modules |

The two decorative backgrounds are original OpenAI image-generation outputs. Pip, diagrams, chimes, and animations are original code created with Codex assistance. No sampled music or scraped images are shipped.

OpenAI APIs and hosting platforms are services governed by their own terms, not redistributed models. Browser speech voices belong to the operating system/browser.

