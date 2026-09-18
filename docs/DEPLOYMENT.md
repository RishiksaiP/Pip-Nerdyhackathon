# Deployment

## Current status

The previous Sites registration was inaccessible from the connected account. Its `.openai` directory was removed at the owner's request. It has not been recreated, and no public deployment is claimed. Local development and both production build targets work without hosting registration.

No database bindings or API key are required for the complete typed demonstration. Progress is anonymous and device-local.

## Vercel / standard Next.js

`vercel.json` selects Next.js and the correct build command. From an authenticated Vercel CLI in this project, publish with:

```sh
npx vercel --prod
```

Or import the Git repository in Vercel; keep the committed build and install settings. No secrets are required for fallback mode. To enable cloud reasoning/transcription, set `ALLOW_CLOUD_FALLBACK=true` and `OPENAI_API_KEY` as server environment variables, or explicitly select `AI_PROVIDER=openai`. A key alone does not enable cloud processing. Set `AI_PROVIDER=demo` for predictable no-service hosting. Optional model overrides are listed in `.env.example`.

Verify the same runtime locally:

```sh
npm ci
npm run build:vercel
npm run start:vercel -- --port 3002
```

In a second macOS/Linux terminal:

```sh
PIP_TEST_URL=http://localhost:3002 npm run test:e2e
```

Or in PowerShell:

```powershell
$env:PIP_TEST_URL = 'http://localhost:3002'
npm run test:e2e
```

## Cloudflare Worker build

```sh
npm run build
npm start -- --port 3001
```

Production artifacts are `dist/server/index.js` (ESM Worker with a default fetch handler), `dist/server/wrangler.json`, and `dist/client/` (browser code, fonts, art and notices). The build audits included JavaScript dependencies and writes inventories to `artifacts/licenses/`.

In a second macOS/Linux terminal:

```sh
PIP_TEST_URL=http://127.0.0.1:3001 npm run test:e2e
```

Or in PowerShell:

```powershell
$env:PIP_TEST_URL = 'http://127.0.0.1:3001'
npm run test:e2e
```

The UI uses standard document links because production testing found a broken RSC prefetch/navigation path in the beta Vinext adapter. Each page reload restores validated browser progress. The learning stages remain interactive without page reloads.

## Runtime limits

AI requests have server and client timeouts. The request limiter is isolate-local, not a durable global quota. Before enabling paid AI for a public child-facing launch, configure durable abuse controls, spending limits and appropriate data/consent handling. No claim of educator or classroom validation is made.

Publication does not submit the hackathon entry or accept contest terms. Keep public access unrestricted for judging when publishing the final entry.

## Local-first hosting boundary

Ollama and whisper.cpp use loopback addresses on the application server. A public Worker cannot reach the visitor’s laptop. Use authored demo mode or explicit cloud configuration on serverless hosts. A separately managed Node host can run local inference on that same host. Do not expose an unauthenticated inference service publicly.
