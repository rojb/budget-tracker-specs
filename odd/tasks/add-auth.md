# add-auth (RRG-44)

## Objective
FR-01: user registration and login; every operation requires a valid session. Screens 18 Acceso,
19 Crear cuenta, 34 Bienvenida. First full-stack change: contract → NestJS → generated client → Flutter.

## Why
Last Phase 0 change; unblocks `add-plans-and-accounts` (RRG-46, nathaliascode) and every feature.

## Decisions
- Contract first: `/auth/register`, `/auth/login`, `/users/me` added to `openapi.yaml` before code.
- Password hashing: argon2id (`argon2` npm). Min length 8. Email unique, stored lowercase.
- Session: single JWT access token (Bearer), 7-day expiry, no refresh token (academic scope, no
  deploy); logout is client-side (delete token). Global JWT guard; `@Public()` opt-out (health, auth).
- Login failure: one generic 401 message (no user enumeration).
- First TypeORM migration: `users` table.
- Front: `packages/api_client` generated from `openapi.yaml` (openapi-generator `dart-dio`, via npx;
  Java available), committed; `flutter_secure_storage` for the token; go_router redirect by session;
  `AuthController` (ChangeNotifier). Screens built only from `packages/ui` components, compared with
  `design/screens/18-*.png`, `19-*.png`, `34-*.png`. Destinations not yet built (01/02, 20, 30) go to
  placeholder routes.
- Dev without back: Prism mock from `openapi.yaml` documented in front README.
- Device check: `adb reverse tcp:3000 tcp:3000`, cleartext HTTP allowed in debug manifest only.
- SDD: capability `auth` spec; one commit per phase; one commit per task.

## Tasks
- [x] T1 Specs repo: specs → design → tasks (delegated writer)
- [x] T2 Contract + back + client + front per tasks (same writer)
- [x] T3 Verify (lint/build/analyze, drift, live API, device flow) + tasks-complete commit
- [ ] T4 Review gate; merge; archive; Linear Done

## Checks
back: lint, build, migration:run, openapi:export + contract drift, curl register/login/me + 401s.
front: analyze x3 (+ api_client), apk build, device flow 18→19→34 and 18→login→home, logout, relaunch
keeps session. TDD: off (no test files rule).

## Progress
- RRG-44 moved to In Progress.
- Specs: a8b81d0 specs, 19c7a63 design, c16def0 tasks, 0bf717c openapi (1.1), d5a1a58 tasks complete, 7946747 verification 4.1. Back: dbb6c39..a81252e (2.1-2.6). Front: 9d21541..3670357 (3.1-3.10 + spacing fix).
- Evidence: curl matrix vs real back (201/409/401 generic/me/health), drift clean, analyze x4, apk; device TFY-LX3 flow 18-19-34, relaunch keeps session, logout, generic error, login; Swagger /docs ok; new ui components in Widgetbook; screen 34 re-check. Parent re-ran analyze/lint/build and confirmed network-error Toast on device (connection refused -> "No pudimos conectar").
- Decisions: built_value client (oneOf Error.message), new packages/ui components UiHeroCard/UiOptionCard/UiFormMessage/UiLinkRow need other-dev review per COLABORACION §5; default API base 10.0.2.2 (emulator) — phone needs --dart-define=API_BASE_URL + adb reverse.
- Merge order: specs first (back CI drift job clones specs main).
