# Proposal

## Why

Users need an account and a session before they can touch any plan data. This is the first
end-to-end vertical slice (back + front) and the real integration test of `scaffold-backend`,
`scaffold-frontend`, `api-contract-base`, and `ui-foundation` together.

## What Changes

- Backend: `users`/`auth` module — signup, login, password hashing (Argon2/bcrypt), JWT issuance,
  global session guard.
- Frontend: `lib/features/auth` — screens 18 Acceso, 19 Crear cuenta, 34 Bienvenida, built with
  `TextField`/`Button`/`SaveBar` from `packages/ui`.
- `openapi.yaml`: add auth endpoints (signup, login) under the `Bearer` JWT scheme defined by
  `api-contract-base`.

## Capabilities

### New Capabilities

- `auth`: user signup, login, password hashing, JWT session issuance and validation.

### Modified Capabilities

None.

## Impact

- Repos touched: `budget-tracker-back`, `budget-tracker-front`, `budget-tracker-specs`
  (`openapi.yaml`).
- Verification: manual — Swagger UI/Prism for the API, Widgetbook vs. `design/screens/18-*.png`,
  `19-*.png`, `34-*.png` for the UI.

## Metadata

- Owner: nathaliascode
- Repos touched: budget-tracker-back, budget-tracker-front, budget-tracker-specs
- FRs covered: FR-01
- Screens: 18, 19, 34
- Depends on: api-contract-base, ui-foundation, scaffold-backend
- Size: M
- Linear: TBD
