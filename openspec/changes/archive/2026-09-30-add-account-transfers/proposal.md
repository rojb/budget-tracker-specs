# Proposal

## Why

Complementary scope: moving money between two accounts of the same plan (e.g., cash to bank)
without it counting as envelope spend. Not required by the professor's guidelines; team decision
(per `ALCANCE.md`).

## What Changes

- Backend: special envelope-less transaction between two accounts of the same plan.
- Frontend: reuses `TxRow`/`AmountCapsule`; screen 29 Transferencia.
- `openapi.yaml`: transfer endpoint.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `accounts`: adds a transfer operation between two accounts of the same plan. Requires the
  `accounts` capability spec from `add-plans-and-accounts` to exist first.

## Impact

- Repos touched: `budget-tracker-back`, `budget-tracker-front`, `budget-tracker-specs`.
- Depends on `add-plans-and-accounts`.
- Verification: manual — Swagger UI/Prism for the API, Widgetbook vs. `design/screens/29-*.png`.

## Metadata

- Owner: nathaliascode
- Repos touched: budget-tracker-back, budget-tracker-front, budget-tracker-specs
- FRs covered: FR-28
- Screens: 29
- Depends on: add-plans-and-accounts
- Size: S
- Linear: [RRG-55](https://linear.app/rgonaut/issue/RRG-55)
