# Proposal

## Why

Plans and accounts are the core entities every other feature hangs off of: a plan owns its
currency (immutable, FR-40) and members, and accounts hold the balances that feed
`ReadyToAssign`. This is the entry point for the whole plan/account domain.

## What Changes

- Backend: `Plan`, `PlanMember`, `Account` entities. CRUD endpoints for plans (with immutable
  currency selector, FR-40) and accounts (with archive/restore, never hard delete).
- Frontend: `PlanRow`, `AccountRow`, and the 3-option currency-selector card in `packages/ui`;
  screens 16 Planes y miembros, 20 Nuevo plan, 33 Plan en dólares, 06 Plan vacío, 13 Cuentas, 14
  Detalle de cuenta, 28 Nueva cuenta, 42 Editar cuenta, 48 Archivar cuenta, 51 Cuentas archivadas,
  37 Elegir cuenta.
- `openapi.yaml`: plan and account endpoints.

## Capabilities

### New Capabilities

- `plans`: plan creation, currency selection (immutable after creation), membership list.
- `accounts`: account CRUD, archive/restore (no hard delete).

### Modified Capabilities

None.

## Impact

- Repos touched: `budget-tracker-back`, `budget-tracker-front`, `budget-tracker-specs`.
- Unblocks `add-envelopes` (needs the `Plan` entity — coordinate the merge before
  `add-envelopes` starts, see `docs/ROADMAP.md` §2/§5), `add-payees`, `add-plan-sharing`,
  `add-account-transfers`.
- Verification: manual — Swagger UI/Prism for the API, Widgetbook vs. `design/screens/16-*.png`,
  `20-*.png`, `33-*.png`, `06-*.png`, `13-*.png`, `14-*.png`, `28-*.png`, `42-*.png`, `48-*.png`,
  `51-*.png`, `37-*.png`.

## Metadata

- Owner: nathaliascode
- Repos touched: budget-tracker-back, budget-tracker-front, budget-tracker-specs
- FRs covered: FR-02, FR-03, FR-40
- Screens: 16, 20, 33, 06, 13, 14, 28, 42, 48, 51, 37
- Depends on: add-auth, api-contract-base
- Size: L
- Linear: TBD
