# Proposal

## Why

Recording income and expenses is the app's core daily action. This change bundles FR-18
(calculator, Should) with the Must transaction requirements because they share the same
screen/component (`AmountCapsule` + `Key`).

## What Changes

- Backend: `Transaction`, `TransactionSplit` entities. Create endpoint with split validation (the
  sum of shares must equal the total amount); income can target `ReadyToAssign` or a specific
  envelope.
- Frontend: `TxRow`, the `Toggle` (Gasto/Ingreso) already defined in `ui-foundation`, a reusable
  selection sheet for screens 26/36/37; screens 07 Nuevo movimiento, 36 Elegir sobre, 38 Fecha y
  hora, 26 Elegir beneficiario, 08 Dividir pago, 09 Registrar ingreso, 10 Movimientos.
- `openapi.yaml`: transaction endpoints.

## Capabilities

### New Capabilities

- `transactions`: transaction create (expense/income), split payments, calculator input on the
  amount field.

### Modified Capabilities

None.

## Impact

- Repos touched: `budget-tracker-back`, `budget-tracker-front`, `budget-tracker-specs`.
- Depends on `add-envelopes`, `add-payees`, `add-budget-calc-engine`.
- Unblocks `add-transaction-editing-and-filters`, `add-monthly-assignment`, `add-envelope-goals`,
  `add-reports`.
- Verification: manual — Swagger UI/Prism for the API, Widgetbook vs. `design/screens/07-*.png`,
  `36-*.png`, `38-*.png`, `26-*.png`, `08-*.png`, `09-*.png`, `10-*.png`.

## Metadata

- Owner: Ruben
- Repos touched: budget-tracker-back, budget-tracker-front, budget-tracker-specs
- FRs covered: FR-06, FR-07, FR-08, FR-14, FR-18
- Screens: 07, 36, 38, 26, 08, 09, 10
- Depends on: add-envelopes, add-payees, add-budget-calc-engine
- Size: L
- Linear: TBD
