# Proposal

## Why

This is the main "assign money to envelopes" flow and the primary consumer-facing surface of the
calc engine: the main plan view, future-month assignment, and month close.

## What Changes

- Backend: assignment endpoint (`POST` to `Assignment` per envelope/month, including future
  months); aggregated month-view endpoint (calls `CalculationService` from
  `add-budget-calc-engine`).
- Frontend: `lib/features/plan`, "Listo para asignar" card, status filter chips (FR-21); screens
  02 Plan del mes (main view), 03 Asignar dinero, 53 Asignar · monto propio, 04 Plan · mes futuro,
  25 Cierre de mes.
- `openapi.yaml`: assignment and month-view endpoints.

## Capabilities

### New Capabilities

- `monthly-assignment`: assign money to envelopes per month (including future months), aggregated
  month view, month close, envelope status filters.

### Modified Capabilities

None.

## Impact

- Repos touched: `budget-tracker-back`, `budget-tracker-front`, `budget-tracker-specs`.
- Depends on `add-envelopes`, `add-transactions`, `add-budget-calc-engine`.
- Verification: manual — Swagger UI/Prism for the API, Widgetbook vs. `design/screens/02-*.png`,
  `03-*.png`, `53-*.png`, `04-*.png`, `25-*.png`.

## Metadata

- Owner: nathaliascode
- Repos touched: budget-tracker-back, budget-tracker-front, budget-tracker-specs
- FRs covered: FR-09, FR-10, FR-15, FR-16, FR-21 (plus FR-11/FR-12 UI, month close)
- Screens: 02, 03, 53, 04, 25
- Depends on: add-envelopes, add-transactions, add-budget-calc-engine
- Size: L
- Linear: TBD
