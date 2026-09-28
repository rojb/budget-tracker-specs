# Proposal

## Why

Payees must be a manageable entity (not free text) so transactions can reference them
consistently and later support autocomplete (Should, FR-23) without losing history when a payee
is removed.

## What Changes

- Backend: `Payee` entity. CRUD with soft delete that preserves the payee on past transactions.
- Frontend: `PayeeRow` (with chevron); screens 15 Beneficiarios, 41 Beneficiario, 47 Eliminar
  beneficiario.
- `openapi.yaml`: payee endpoints.

## Capabilities

### New Capabilities

- `payees`: payee CRUD, soft delete preserving historical transaction references.

### Modified Capabilities

None.

## Impact

- Repos touched: `budget-tracker-back`, `budget-tracker-front`, `budget-tracker-specs`.
- Unblocks `add-transactions` (payee selection on the transaction form).
- Verification: manual — Swagger UI/Prism for the API, Widgetbook vs. `design/screens/15-*.png`,
  `41-*.png`, `47-*.png`.

## Metadata

- Owner: nathaliascode
- Repos touched: budget-tracker-back, budget-tracker-front, budget-tracker-specs
- FRs covered: FR-05
- Screens: 15, 41, 47
- Depends on: add-plans-and-accounts
- Size: S
- Linear: TBD
