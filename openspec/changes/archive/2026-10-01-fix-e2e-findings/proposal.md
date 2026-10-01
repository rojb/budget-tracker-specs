# Proposal

## Why

The full end-to-end device test of 2026-10-01 (50 of the 53 screens, real back, Android device)
found six defects against the behavior and the renders already specified, and one stakeholder
requirement from the team chat of 29/9, "registrar ingreso directamente a un sobre", that the API
implements (FR-08) but the UI hides:

- D1 (major) 16 Planes y miembros: the member list and "Compartido · N miembros" stay stale after
  someone joins the plan; only restarting the app shows the new member (FR-27, FR-02).
- D3 (major) 09 Registrar ingreso: the "¿A dónde va?" choice cards are hidden while the calculator
  pad is open, and the pad opens by default, so an income sent directly to an envelope cannot be
  discovered (FR-08).
- D4 (minor) 02 Plan del mes: the "Nuevo grupo" / "Editar grupos" row after the last group is
  missing (FR-04, PRD-ux-spec.md §9.1 rule for 02).
- D2 (minor) 06 Plan vacío: the search button is missing (PRD-ux-spec.md §9.5, FR-16).
- D5 (cosmetic) 51 Cuentas archivadas: the "Ver movimientos" link is missing (FR-03,
  PRD-ux-spec.md §9.5).
- D6 (cosmetic) text truncated in the 27 sheet (the date) and in 14 (the transfer title), FR-13 and
  FR-28.
- D8 (stakeholder clarification) "las últimas transacciones siempre al principio" means the order
  of registration, not of the movement's own date: a movement dated three days ago and recorded
  now must come first, under "Hoy". Today 10, 14 and 22 order and group by `occurredAt`, so a
  backdated movement is buried among older days (FR-13, FR-28).

## What Changes

- Frontend (D1 to D6): screen 16 reloads the plans on open, on resume and while it stays open; 09 opens
  with the destination cards visible and the keypad hidden; 02 gets the "Nuevo grupo" / "Editar
  grupos" row; 06 gets the search; 51 gets "Ver movimientos"; the `UiTxRow` subtitle may wrap and
  the transfer row of 14 gets a shorter title.
- D8: the transaction list, the transfer list and the envelope activity are ordered by
  registration instant (`createdAt`, then id) in the backend; 10, 14 and 22 group by registration
  day and show the movement's own date in the row subtitle when it differs. Month attribution,
  balances, recalculation and date filters keep using `occurredAt`.
- `openapi.yaml`: only the ordering descriptions change (the schemas already carry `createdAt`);
  the backend `.contract-ref` is bumped and the API client needs no regeneration.
- Specs: the behaviors that were implicit are stated explicitly in the `plan-sharing`,
  `transactions`, `envelopes`, `envelope-goals`, `plans` and `accounts` capabilities.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `plan-sharing`: the members shown in 16 reflect the server state when the screen is shown.
- `transactions`: the income screen shows the destination choices on entry and the keypad on demand;
  the list and screen 10 follow registration order (D8).
- `envelope-goals`: the activity of an envelope (API and screen 22) follows registration order.
- `envelopes`: 02 offers "Nuevo grupo" / "Editar grupos" after the last group.
- `plans`: 06 offers the search button.
- `accounts`: 51 offers "Ver movimientos" per archived account; the transfer list and 14 follow
  registration order (D8).

## Impact

- Repos touched: `budget-tracker-specs`, `budget-tracker-back`, `budget-tracker-front`.
- Touches areas owned by nathaliascode (plans, sharing, accounts) with minimal changes, by decision
  of the owner of this change.
- Depends on `add-plans-and-accounts`, `add-plan-sharing`, `add-envelopes`, `add-transactions`,
  `add-transaction-editing-and-filters` and `add-account-transfers` (all archived).
- Verification: manual, on the device against `design/screens/NN-*.png` (02, 06, 09, 14, 16, 27,
  51) and the real back; Widgetbook analyze for `packages/ui`.

## Metadata

- Owner: Ruben
- Repos touched: budget-tracker-specs, budget-tracker-back, budget-tracker-front
- FRs covered: FR-08, FR-27, FR-04, FR-02, FR-03, FR-13, FR-28, FR-16
- Screens: 02, 06, 09, 10, 14, 16, 22, 27, 51
- Depends on: add-plans-and-accounts, add-plan-sharing, add-envelopes, add-transactions, add-transaction-editing-and-filters, add-account-transfers
- Size: M
- Linear: [RRG-57](https://linear.app/rgonaut/issue/RRG-57)
