# Changelog

All notable changes to the TEC Domain App Template are documented here.

Format: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
Versioning: [Semantic Versioning](https://semver.org/)

---

## [Unreleased]

### 2026-10-05 — repo review (tec-life)
- **Security:** `next` 15.5.12 → 15.5.27 (critical advisory: request smuggling in
  rewrites, DoS). `npm audit --omit=dev`: 36 → 2 (both need Next 16).
- **Removed dead code and deps:** `src/lib/sdk.ts` (`TecSdk` with an empty gateway
  URL, imported from client code — a Two-SDK-boundary leftover), `lib-client/pi/pi-auth.ts`
  and `lib-client/hooks/usePiAuth.ts` (the app uses `usePiAuth` from `@yasser172/tec-auth`),
  and with them `axios`, `socket.io-client` and `@sentry/nextjs` — none imported anywhere.
- **BFF (`forwardLife`):** sends the session token as the only identity. It used to add
  `x-user-id` from the client-controlled `tec_user` cookie (the gateway discards it) and
  `x-internal-key` (the gateway adds it itself, and it marks the caller as a SERVICE — a
  ServiceActor-gated Life route would have been open to every signed-in user). A signed-in
  user without the `tec_user` cookie is no longer refused. Pinned by `life-gateway.test.ts`.
- **Coverage gate is real:** `@vitest/coverage-v8` installed; CI runs `test:coverage`
  (73% stmts · 64% branches · 63% funcs · 80% lines against the 60/50/60/60 floor).

### Added
- Packaging hygiene: `LICENSE` (MIT), expanded `README`, this CHANGELOG,
  and Dependabot config (`npm` + `github-actions`, weekly).

### Changed
- `tsconfig`: enabled `noUncheckedIndexedAccess` (stricter index access).

## [2.0.0] - 2026-06 — production-ready by default

### Added
- `/api/health` — uniform C-92 health signal (fail-safe, public, never 500s).
- Structured `log` + `reportError` (C-96) — no silent error handlers.
- `PiRuntime` (PAL) + `PiCircuitBreaker` — single choke-point for `window.Pi.*`.
- `lib/flags.ts` — feature flags (`NEXT_PUBLIC_FLAG_*`) from day one.
- Coverage gate (`test:coverage`, 60% floor).

## [1.0.0] - initial

- Portal-ready skeleton: Hub SSO, dual-mode Pi payments (ADR-007), CSRF
  (middleware-only, C-12 §11), unified payment contract (ADR-009), legal pages,
  and CI policy guards (payment-policy + CSRF + lint/typecheck/test/build).
