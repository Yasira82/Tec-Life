# TEC Life

**System of Record (Personal)** for the TEC Federated Platform — the memory of a TEC identity.
Life holds what a Pioneer declares about their own economic life: **goals, skills, preferences,
activity, trajectory and intent** (charter: `tec-knowledge-base/knowledge-base/C-106`).

Live on Pi Mainnet at **https://life.tecosystem.app** · Pi App ID `life-app-c468e9eb5bf115fa` · app slug `life`.

## What it does

| Screen | What a Pioneer can do | Where the truth lives |
|---|---|---|
| **Home** | See the goal closest to done, log π against it, see recent activity | `tec-identity-service` (life module) |
| **Goals** | Add a goal with an optional π target, log progress, mark done, delete | strong consistency — self-declared |
| **Skills** | Keep a skills ladder: Learning → Practising → Proficient → Expert (never a score) | self-declared; an inferred row has a place but is never written by the client |
| **Activity** | Read their own recent TEC events, grouped by day | presented from `tec-analytics-service`; Life stores none of it |
| **Pace** | A projection of goal pace — refused until there is enough data (two days of progress) | computed server-side |
| **Settings → Privacy** | Grant or withdraw consent per data category; delete all Life data | absence is a no; the purge is audited |

Life Pro (unlimited goals + insights) is paid in Pi through the shared payment flow (ADR-007 / ADR-009).

## Architecture in one paragraph

Next.js 15 App Router. The browser only ever talks to this app's **BFF** (`/api/bff/*`), which
forwards to the API Gateway with the session token as the only identity (`src/lib/bff/lifeGateway.ts`).
Sessions are Hub SSO cookies (`tec_access_token`, `tec_csrf`, `tec_user`) set on a 200 HTML landing
(C-123); the app can also sign itself in from a standalone Pi visit (`src/lib/pi/self-sign-in.ts`).
CSRF is enforced in `middleware.ts` only. Pi SDK calls go through `src/lib/pi/PiRuntime.ts`.

```
src/app/app/            the signed-in app: page.tsx (shell) + components/ (Home, Goals, Skills, Activity, Pace, Settings, LifePro)
src/app/api/bff/life/   goals · skills · preferences · activity · trajectory · consent · intent · data
src/app/api/auth/       sso-callback (landing) · pi-login (self sign-in) · refresh · me
src/app/pi-test         on-device diagnostics: this tab's Pi sign-in and campaign arrival
src/lib-client/life/    useLife.ts (the hooks) · focus.ts
src/lib/i18n/           12 locales, one key set
```

## Run it

```bash
npm install
cp .env.example .env.local      # API_GATEWAY_URL · INTERNAL_SECRET · SSO_SECRET · NEXT_PUBLIC_PI_APP_ID …
npm run dev
```

## Gates (what CI runs)

```bash
npm run typecheck        # tsc --noEmit — 0 errors
npm run lint             # eslint — 0 errors
npm run test:coverage    # vitest + the 60% floor in vitest.config.ts
npm run build
npm run test:e2e         # Playwright: landing + the Life screens against a mocked BFF (e2e/)
```

## Rules that bite (see `CLAUDE.md` for the full list)

- Identity comes from the session, never from a request body or query (P6).
- Never validate CSRF inside a route handler — middleware only.
- Never write `granted: false` consent rows; absence **is** the denial.
- Never persist intent signals; the 30-minute Redis TTL is the privacy guarantee.
- Never show a projection the backend marked unprojectable, and never fill the gap with a number.

## Knowledge base

`yasira82/tec-knowledge-base` → `C-02` (current state) · `C-106` (this app's charter) · `C-123` (session & cookie law) · `C-12` (dual-mode payment).
