# Pip — submission copy

## One line

Most math games test whether a child can get the answer. Pip tests whether they understand it well enough to teach it.

## Product

Pip is an AI apprentice a child teaches. Learners build mathematical objects, explain an idea, catch Pip’s misconception, repair it with a counterexample, and prove understanding in two new representations. Their ideas restore Pip’s observatory and become a constellation of connected skills.

The hero Fraction Forest experience targets grades 3–5, with working multiplication and place-value loops. A tutor view converts the session into concrete evidence and a next teaching move. A spaced-review scheduler asks what the learner remembers tomorrow.

## Why AI belongs here

A language model interprets the learner’s own explanation and selects a bounded, authored misconception or clarification. Informal phrasing can count when the idea is sound. The explanation changes Pip’s behavior, rather than merely producing congratulatory dialogue. Mathematical truth, transfer correctness, mastery gates and next missions stay deterministic.

## Technical implementation

React, TypeScript and Next.js conventions, with standard Next and Cloudflare Worker build targets. Local-first provider adapters support Ollama/Qwen3, llama.cpp, preserved OpenAI Responses/audio, and an authored fallback. Strict structured outputs become raw learner evidence. The mastery engine requires independent transfer and minimum conceptual/explanation/correction evidence. Anonymous progress is device-local.

The Windows release was exercised on an RTX 5070 Ti / 16 GB VRAM with 32 GB RAM. Qwen3-8B through llama.cpp and Ollama passed structured local fixtures; faster-whisper/base.en CPU int8 passed a synthetic browser microphone-to-mastery rehearsal. These are development checks, not classroom studies. Cloud AI and the optional 14B profile were not tested.

## Demo

The complete guided route is `/demo`. It labels seeded prior evidence and uses authored reasoning under Auto, making the three-minute judge route reliable without a paid key. The default Windows launcher uses strict llama.cpp/Qwen; the optional --ollama launcher selects the verified alternative. Models, their health, fallback use and measured timings are visible in the Lab. No public URL is claimed until deployment is completed by an authenticated hosting account.

## Scope and limitations

Three worlds, nine lesson definitions including seven fraction activities, fifteen skill nodes (twelve playable through existing activities), eighteen authored misconception records. Some graph nodes share a lesson. Broader item variation, real learner validation, durable cloud abuse controls, and multi-device accounts are future work. No unsupported educational efficacy or full K–5 curriculum claim is made.

## Originality and disclosure

Pip’s character, interactive math art and animations are original code; its two decorative backgrounds are original generated assets. Codex substantially assisted engineering, design, testing and documentation. Qwen and Whisper weights are installed separately, not distributed with the entry. See `AI_DISCLOSURE.md`, `THIRD_PARTY_NOTICES.md`, and `LICENSE_AUDIT.md` for complete boundaries.

Learning by teaching and teachable agents are established research ideas. Pip’s contribution is a cohesive game combining these ideas with direct manipulation, local structured inference, exact math, explicit evidence, independent transfer, and tutor handoff.

**Pip — teach it. Prove it. Master it.**
