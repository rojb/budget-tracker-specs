# Proposal

## Why

Complementary scope: a reports screen gives the user visibility into spending patterns and net
worth beyond the month-by-month envelope view. Not required by the professor's guidelines; team
decision (per `ALCANCE.md`).

## What Changes

- Backend: aggregation endpoints (spend by envelope, net-worth evolution, income vs. expenses)
  over a time range.
- Frontend: charts (library to be chosen within this change); screen 17 Reportes.
- `openapi.yaml`: report aggregation endpoints.

## Capabilities

### New Capabilities

- `reports`: aggregated reporting (spend by envelope, net-worth trend, income vs. expenses) over a
  time range.

### Modified Capabilities

None.

## Impact

- Repos touched: `budget-tracker-back`, `budget-tracker-front`, `budget-tracker-specs`.
- Depends on `add-transactions`, `add-envelopes`.
- Verification: manual — Swagger UI/Prism for the API, Widgetbook vs. `design/screens/17-*.png`.

## Metadata

- Owner: nathaliascode
- Repos touched: budget-tracker-back, budget-tracker-front, budget-tracker-specs
- FRs covered: FR-26
- Screens: 17
- Depends on: add-transactions, add-envelopes
- Size: M
- Linear: [RRG-54](https://linear.app/rgonaut/issue/RRG-54)
