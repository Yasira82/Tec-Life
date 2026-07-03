# TEC Life — Claude Code Instructions

> ⚡ **SESSION START:** اقرأ `knowledge-base/C-02___CURRENT_STATE_.md` + **app charter
> `knowledge-base/C-106___LIFE_INSTITUTIONAL_CHARTER.md`** من `yasira82/tec-knowledge-base`.

## What This App Is

**System of Record (Personal)** for the TEC Federated Platform — Life models each
user's personal economic context: **goals, skills, activity timeline, preferences,
trajectory, and intent**. It is the *memory* of the TEC identity — without Life, TEC AI
has no personal context, Connection has no relationship baseline, and Ecommerce has no
personalization signal (C-106).

Built from `tec-template-base` (Next.js 15 frontend). Personal data is **sovereign** —
self-declared, private, and never consumed by another app without explicit consent.

**Current Phase: Phase 0 — customized from template.** Identity/domain/slug/legal +
themed home shell done. Login (C-123 landing) + the first feature slice (Goals &
Preferences) are the next steps. Not yet deployed.

---

## Pi App Identity

| Field | Value |
|-------|-------|
| **App** | TEC Life |
| **Domain** | `https://life.tecosystem.app` |
| **Pi App ID** | `life-app-c468e9eb5bf115fa` ✅ Registered · Vercel `NEXT_PUBLIC_PI_APP_ID` |
| **APP_SOURCE slug** | `life` (payment-service resolves `PI_API_KEY_LIFE`) |
| **PI_SANDBOX** | `false` (Mainnet) |

---

## Life-Specific Rules (C-106)

### Data ownership boundary
Life **OWNS**: goals, skills (self-declared + activity-inferred), activity timeline,
preferences, trajectory, intent signals. Life does **NOT OWN**: payment truth
(`tec-payment-service`), asset ownership (`tec-asset-service`), identity
(`tec-auth-service`), the relationship graph (Connection, C-107), or recommendations
(TEC AI, C-104). Read those as **ID-only references** — never re-derive or mutate them.

### Consistency model
- **Self-declared** data (goals, preferences) = **strong** consistency — the user controls it.
- **Activity-inferred** data (from the event stream) = **eventual** consistency.
- Intent signals = Redis with TTL (recalculated on context load).

### Privacy / sovereignty (C-106 §5)
- Life data is sovereign — the user controls what any other app (esp. TEC AI) may see.
- Explicit consent per data category before AI consumption.
- Right to delete: purge Life data while keeping payment records (owned by payment-service — Life cannot delete those).
- Identity anchor = `tec_user.piUsername` (permanent Pi identity) — Life data survives identity migration.

### Isolation (P6)
A user sees ONLY their own Life data — derive identity from the `tec_user` session cookie
server-side, **never** from a query param or request body. No session → no data (fail closed).

**Reference of record:** `yasira82/tec-knowledge-base` — `C-106___LIFE_INSTITUTIONAL_CHARTER.md`
(charter) + `C-12_Dual_Mode_Payment.md` (payment anti-regression) + `C-123` (session/cookies).

---

## Stack

- Next.js 15 App Router + TypeScript strict · React 18
- `@yasser172/tec-ui` (design system) · `@yasser172/tec-auth` · `@yasser172/tec-sdk`
- Vitest (unit) + Playwright (e2e) · Deployment: Vercel

---

## Architecture Rules (non-negotiable)

### CSRF — middleware ONLY (P2 single source of truth)
CSRF is enforced in **`middleware.ts`** and **nowhere else**: a request is trusted
if the double-submit token matches **OR** it is first-party (Origin host === Host /
`*.tecosystem.app`).
- ❌ **NEVER** add a CSRF check inside a route handler (`csrfCookie !== csrfHeader`
  → 403). It 403's legit Mode-2 payments in Pi Browser (drops `sameSite=None`
  cookies). The CI `payment-policy` job fails the build if you do. (KB C-12 §11)
- ✅ A route may *forward* `x-csrf-token` to a downstream call; it must never *validate* it.

### ADR-007 — Dual-mode payment (Pi foreign session)
Every buy handler MUST guard before touching `window.Pi`:
```typescript
const isHubNavigation = () =>
  document.referrer.toLowerCase().includes('hub.tecosystem.app');
if (isHubNavigation() || !(window as any).Pi || !piReady) {
  redirectToHubPayment(...);   // Mode 1: Hub modal → /hub?pay=1&...
  return;
}
// Mode 2: standalone — createPaymentRecord() then createU2APayment() (src/lib/pi-payment.ts)
```

### ADR-009 — Unified payment contract
`amount` is a **number**; gateway path is **`/api/payment/*`** (singular); the only
inter-service header is **`x-internal-key`** + `INTERNAL_SECRET`. Don't re-declare
payment Zod locally — shapes live in `@yasser172/tec-sdk`.

### Two-SDK boundary
```
Client components → src/lib-client/*  (browser state, Pi hooks)
API routes (BFF)  → @yasser172/tec-sdk via /api/bff/*  (server-only)
```

### Auth / cookies (LOCKED)
SSO via Hub cookies `tec_access_token`, `tec_csrf`, `tec_user`. Never localStorage.
Identity is derived from the `tec_user` cookie server-side — **never from the request body**.

---

## What's included

```
middleware.ts                              CSRF (double-submit OR Origin) + page guard
src/app/api/auth/sso-callback/route.ts     Hub SSO landing (open-redirect-safe)
src/app/api/auth/refresh/route.ts          token refresh
src/app/api/bff/payment/{create,approve,complete,resolve-incomplete}/route.ts
src/app/api/bff/items/route.ts             example domain route (copy this pattern)
src/app/api/health/route.ts                health endpoint (C-92/C-96) — fail-safe, public, never 500s
src/lib/pi-payment.ts                      createPaymentRecord + createU2APayment
src/lib/pi/PiRuntime.ts                    PAL — single choke-point for window.Pi.* (R1)
src/lib/pi/PiCircuitBreaker.ts             CLOSED→OPEN→HALF_OPEN (3 fails → 60s)
src/lib/flags.ts                           feature flags (NEXT_PUBLIC_FLAG_*) + useFlag
src/lib/observability/logger.ts            structured JSON logger (log.info/warn/error) — no silent failures (C-96)
src/lib/observability/reportError.ts       Sentry-ready error reporter (single swap-point)
src/app/privacy/page.tsx · terms/page.tsx  Pi Portal legal pages
src/styles/tec-design-tokens.css           import in app/layout.tsx
.github/workflows/ci.yml                   payment-policy + CSRF guard + lint/typecheck/test/build
```

**v2 (production-ready by default):** every new app ships
- `/api/health` — uniform C-92 signal (platform health runtime + observability scrape + SLO/runtime-evidence loop);
- structured `log` + `reportError` — use `log.error`/`reportError` in catch blocks (a silent error handler is an invisible failure, C-96; `reportError` is the one place to wire Sentry per app);
- `PiRuntime` (PAL) + `PiCircuitBreaker` — never call `window.Pi.*` directly; go through PiRuntime so an SDK change is a one-file fix (R1) and flapping is contained;
- `flags.ts` — feature flags from day one (`NEXT_PUBLIC_FLAG_<NAME>`);
- coverage gate — `npm run test:coverage` (add devDep `@vitest/coverage-v8`; 60% floor, raise as the app grows).

---

## Setup status + Roadmap (C-106 §11)

```
Phase 0 — customized from template:
  ✅ package.json name = tec-life · APP_SOURCE = 'life'
  ✅ sso-callback ALLOWED_AUDIENCES → life.tecosystem.app + tec-life.vercel.app
  ✅ privacy + terms → TEC Life / life.tecosystem.app
  ✅ NEW-A: no NEXT_PUBLIC_API_GATEWAY_URL / Railway host in the client bundle
  ✅ layout Pi init is hub-entry-aware (C-12 §3 / ADR-007 foreign-session skip)
  ✅ /app themed as the Life home shell (Goals · Preferences · Activity cards)

Next (before live):
  ✅ C-123 login: SSO landing migrated to the 200 HTML landing + verified entry
     (/api/auth/me) + `none/secure/Partitioned` cookies + hub-entry flag (LAW 2/3, §3).
  ✅ Pi App ID registered: life-app-c468e9eb5bf115fa · Vercel vars set (API_GATEWAY_URL ·
     INTERNAL_SECRET · SSO_SECRET · NEXT_PUBLIC_PI_APP_ID · PI_SANDBOX=false).
  □ Deploy: tec-identity-service (life_goals/life_preferences via db push) → then Vercel.
  □ Runtime-verify login inside Pi Browser + a Goals/Preferences round-trip.
  ✅ FEATURE slice 1 — Goals & Preferences (self-declared, strong consistency):
     Life store in tec-identity-service (LifeGoal + LifePreference, @Controller
     'identity/life') behind /api/bff/life/* → /api/identity/life/*. Interactive
     Goals (add/done/delete) + Preferences (focus, language) in /app. Owner = session
     identity (never a param). Needs: tec-identity-service deployed + wired.
  □ FEATURE slice 2 — Activity timeline (eventual, from payment.*/order.* events)
```

> Payment scaffold (`src/lib/pi-payment.ts`, ADR-007 guard) is kept for compliance +
> optionality. Life monetization is expected to be subscription-via-Hub (like Analytics);
> if a direct buy is added it MUST keep the `isHubNavigation()` guard.

---

## What NOT To Do

- Do NOT validate CSRF in a route handler — middleware only (CI blocks it)
- Do NOT send `amount` as a string, or use `/payments` / `x-service-secret`
- Do NOT skip the ADR-007 `isHubNavigation()` guard before `window.Pi`
- Do NOT store tokens in localStorage; do NOT derive identity from the body
- Do NOT add `NEXT_PUBLIC_*` for internal service URLs or `INTERNAL_SECRET`
- Do NOT use an open `redirect` param without the same-origin guard (open redirect)

---

## Commit Convention

```
feat(scope):  new feature      fix(payment): payment flow fix (test carefully)
fix(scope):   bug fix          chore(scope): build/config
```

---

## Skills

Available via plugin — invoke automatically when the situation matches:

| Situation | Skill |
|-----------|-------|
| Writing new feature or fixing a bug → use TDD | `/tdd` |
| Bug, regression, or unexpected behavior | `/diagnose` |
| Writing or modifying tests | `/test-guard` |
| Writing or modifying BFF routes, payment handlers, or API contracts | `/clean-code-guard` |
| Updating docs, CLAUDE.md, or knowledge-base entries | `/docs-guard` |
| Planning a new feature or architectural decision | `/grill-with-docs` |
| Breaking down a roadmap item into GitHub Issues | `/to-issues` |
| Session is getting long or context is filling up | `/handoff` |
| Adding pre-commit hooks to this repo | `/setup-pre-commit` |
