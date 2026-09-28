# Proposal

## Why

Past transactions must stay editable at any time with full recalculation (a closed month can
still be corrected), and the movement list needs to be filterable — the reason the professor
required capturing the hour on every transaction.

## What Changes

- Backend: `PATCH`/`DELETE` transaction endpoints with full recalculation (balances,
  `Available`, `Carryover`, `ReadyToAssign` for every affected month); `GET` with filters (date,
  time, payee, envelope, account, direction).
- Frontend: Neutral toast "Recalculado · Deshacer"; screens 12 Editar movimiento, 49 Movimientos
  · recalculado, 27 Eliminar movimiento, 11 Filtrar movimientos.
- `openapi.yaml`: updated transaction endpoints (edit/delete/filtered list).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `transactions`: adds edit/delete with full recalculation and list filtering. Requires the
  `transactions` capability spec from `add-transactions` to exist first.

## Impact

- Repos touched: `budget-tracker-back`, `budget-tracker-front`, `budget-tracker-specs`.
- Depends on `add-transactions`.
- Verification: manual — Swagger UI/Prism for the API, Widgetbook vs. `design/screens/12-*.png`,
  `49-*.png`, `27-*.png`, `11-*.png`.

## Metadata

- Owner: Ruben
- Repos touched: budget-tracker-back, budget-tracker-front, budget-tracker-specs
- FRs covered: FR-13, FR-22
- Screens: 12, 49, 27, 11
- Depends on: add-transactions
- Size: M
- Linear: TBD
