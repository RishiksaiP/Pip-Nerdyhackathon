# Third-party materials and provenance

## Incorporated application dependencies

| Component | Role | License |
|---|---|---|
| React / React DOM / React Server DOM | UI and server rendering | MIT |
| Next.js | App Router conventions and types | MIT |
| Cloudflare Vinext | Vite adapter and Worker renderer | MIT |
| Zod | Input and structured AI validation | MIT |
| Lucide React | Interface icons | ISC |
| Radix UI / shadcn wrappers | Accessible adult-view tabs and progress | MIT |
| Tailwind CSS, clsx, tailwind-merge, class-variance-authority | Styles and class composition | MIT |
| Sites starter | Hosting integration and reusable UI scaffolding | Supplied by the installed OpenAI Sites integration; its included upstream package notices are preserved |

Exact dependency versions and licenses are recorded in `package-lock.json` and `docs/DEPENDENCY_LICENSES.json`. Unused bundled starter libraries remain in the manifest but are tree-shaken out of the application. `public/licenses/THIRD_PARTY_NOTICES.txt` preserves direct package license texts.

## Fonts

- **Chewy**, copyright 2010 Font Diner, Inc DBA Sideshow: Apache-2.0. Self-hosted via `@fontsource/chewy`. Original metadata and license: https://github.com/google/fonts/tree/main/apache/chewy
- **Roboto 2**, Google font project: Apache-2.0 files from the `googlefonts/roboto-2` repository (`src/hinted/Roboto-Regular.ttf`, `Roboto-Medium.ttf`). These are the Apache-licensed legacy files, not newer OFL-licensed Roboto releases. Source: https://github.com/googlefonts/roboto-2
- Original font license texts are served under `public/licenses/`. Font files are unmodified.
- System font fallbacks are not redistributed.

Fredoka and Inter were explored during development but removed because their font license is reciprocal. They are not shipped.

## Original visual and audio work

`public/art/observatory.webp` and `forest.webp` are original OpenAI built-in image-generation outputs created for Pip. Exact prompts are in `docs/ART_PROMPTS.md`. Only format/compression changed after generation. No third-party visual references, characters, commercial artwork, datasets or scraped assets were used.

Pip, the favicon, mathematical SVGs and CSS animations were created as original application code with Codex assistance. Game chimes are synthesized with Web Audio; no sampled music/audio is shipped. Browser voices are provided by the visitor’s operating system. Optional OpenAI synthesized speech is governed by OpenAI API terms.

## Local inference additions

See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for Qwen/Ollama/whisper.cpp provenance and [LICENSE_AUDIT.md](LICENSE_AUDIT.md) for current audit scope. Local weights and executable tools are outside the repository; no new npm dependency or FFmpeg package was added.

## APIs and services

- OpenAI Responses, audio transcription and optional speech APIs: service terms apply; no model weights are distributed. Models and precise scope are disclosed in `AI_USAGE.md`.
- Sites/Cloudflare Workers hosting: service terms apply.
- No Supabase account, analytics SDK or paid database is configured.

## Development tools versus shipped software

TypeScript, Vite, Vitest, Playwright, ESLint, Prettier, Wrangler and the Sites build tools are used for building and testing. The provided toolchain has development-only transitive packages under LGPL/MPL (including libvips, Lightning CSS, image/OG tooling, and axe-core). They are recorded in the full dependency inventory rather than concealed. They are **not incorporated in the published Worker or browser bundles**. No `node_modules`, native library, development tool executable, browser or image-conversion dependency is packaged in the entry's runtime archive.

The Vite `pip-license-audit` hook checks actual modules included in each emitted JavaScript bundle and fails the build for GPL/LGPL/AGPL/SSPL/MPL/OFL/CDDL/EPL components. Measured bundle inventories are in `artifacts/licenses/`. It is a runtime-bundle check, not a legal opinion about all development tools.

The contest terms require third-party disclosure and ban reciprocal components. This project avoids reciprocal materials in the delivered application, and provides the complete toolchain inventory for transparent submission review. Do not state that Nerdy has approved these licenses. Read the controlling terms and `docs/CONTEST.md` before submission.

