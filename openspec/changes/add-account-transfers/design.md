# Design

## Context

See proposal.md for the why. The `accounts` module (`add-plans-and-accounts`) derives balances in
`AccountsService.balances` and monthly flows in `monthlyFlows`, both waiting for movements, and
feeds the engine through `ledgerBalanceMovements`. The `transactions` module (`add-transactions`,
Ruben) does not exist yet. The front has 13/14, the 37 picker, `showAmountSheet` and a "Transferir"
button in 14 pointing at a placeholder.

Sources: FR-28, FR-13 (movements can be undone), PRD-ux-spec.md §6.1 (rule 5 date grouping), §7
Moneda (29), §9.3 (37, 38), §9.5 (14 → 29 → 37/38); renders `design/screens/{14,29,37,38}-*.png`;
canonical dataset (Mercado Pago $ 121.200 · 12 %).

## Goals / Non-Goals

**Goals:**
- `account_transfers` table owned by the `accounts` module, create/list/delete endpoints, and the
  transfers folded into balances, monthly flows and the engine ledger.
- Screens 29 and 38, and transfers listed in 14.

**Non-Goals:**
- Editing a transfer (delete and create again covers FR-13 for this Could-have).
- Mixing transfers into the general movements list 10 and its filters: `add-transactions` unions
  them when it builds 10 (the list endpoint is ready for that).
- Test files of any kind.

## API surface

Added to `openapi.yaml`, tag `Accounts` (transfers belong to the `accounts` capability):

| Operation | Path | Role | Request | Responses |
|---|---|---|---|---|
| `listTransfers` | `GET /plans/{planId}/transfers?accountId&page&pageSize` | member | — | `200 TransferPage`, `400`, `401`, `404` |
| `createTransfer` | `POST /plans/{planId}/transfers` | owner, editor | `CreateTransferRequest` | `201 Transfer`, `400`, `401`, `403`, `404`, `409` |
| `deleteTransfer` | `DELETE /plans/{planId}/transfers/{transferId}` | owner, editor | — | `204`, `400`, `401`, `403`, `404` |

Schemas: `Transfer { id, fromAccountId, toAccountId, amountMinor (>0), occurredAt, createdAt }`,
`TransferPage = PageMeta + items`, `CreateTransferRequest { fromAccountId, toAccountId,
amountMinor (minimum 1), occurredAt }`. `409` = an account is archived. Path parameters per
operation.

## Backend design

```
src/accounts/ transfers.controller.ts transfers.service.ts
              entities/account-transfer.entity.ts dto/transfer*.dto.ts
src/database/migrations/<ts>-CreateAccountTransfers.ts
```

- **Table.** `account_transfers(id, plan_id fk plans cascade, from_account_id fk accounts,
  to_account_id fk accounts, amount_minor bigint CHECK > 0, occurred_at timestamptz, created_by fk
  users set null, created_at)` with `CHECK (from_account_id <> to_account_id)` and indexes on both
  account columns. Accounts are never deleted, so the account FKs are plain (no cascade needed).
- **Why not a transaction row.** A transfer has no envelope, payee or direction and must never
  touch envelope activity; a separate table keeps that invariant structural and avoids writing
  into Ruben's future `transactions` schema. `add-transactions` can show both in 10 by union.
- **Balances.** `AccountsService.balances` = opening + Σ incoming − Σ outgoing transfers (one
  grouped query), plus transactions when `add-transactions` extends it. `monthlyFlows(account,
  month)` sums transfers whose `occurred_at` falls in the month in the plan's time zone
  (`AT TIME ZONE plans.time_zone`). `ledgerBalanceMovements` adds, per transfer, `+amount` for an
  active destination and `−amount` for an active origin, in the transfer's month.
- **Validation.** The service loads both accounts with `planId` (404 when missing), rejects
  archived ones with `409 "Account is archived"`, and equal ids with `400`.

## Frontend design

```
lib/features/accounts/transfers_repository.dart   # generated transfers API
lib/features/accounts/transfer_page.dart          # 29 (+ its controller)
lib/features/common/date_time_sheet.dart          # 38 showDateTimeSheet(...)
lib/features/common/dates.dart                    # "Hoy, 14:32", "Hoy · martes 29" labels
```

- 29 is pushed on the root navigator from 14 (`/accounts/:id/transfer`), origin prefilled,
  destination the first other active account; both open `showAccountPicker` with the other side
  excluded. After saving: `AccountsController.load()`, toast, pop.
- 14 loads `GET /transfers?accountId=` and renders the rows grouped by local day; tapping a row
  opens a confirmation sheet and deletes it.
- 38 is built here as a shared sheet because 29 is its first consumer; `add-transactions` reuses it
  for 07/09/12/11 (flagged to Ruben).

## UI components

Existing: `UiAccountRow` (+ `UiCard`), `UiAmountCapsule`, `UiFieldRow`, `UiSaveBar`, `UiSheet`,
`UiIconButton`, `UiButton`, `UiToast`, `UiInfoNote`.

New in `packages/ui` (stories, review by the other dev, §5):
- **`UiTxRow` (new, molecule)**: icon circle, title, subtitle, amount (`−` for outflows) and an
  optional caption; Expense and Income variants (income in the lavender capsule, §7 Moneda). Built
  here for transfers in 14; `add-transactions` uses it for every movement.
- **`UiCalendarMonth` (new, organism)**: month label with ‹ ›, weekday initials L–D, day cells
  (selected lavender, today bold), used by 38.
- **`UiStepper` (new, atom)**: a number between up/down chevrons (hour, minute) for 38.
- **`UiIcons`**: `arrowDown`, `clock`, `chevronUp`.

## Decisions

**Own table in `accounts`.** See "Why not a transaction row". Trade-off: 10 needs a union later.

**No edit endpoint.** A transfer has four fields; delete-and-recreate is cheaper to build and to
explain, and FR-28 is a Could-have.

**38 and TxRow here.** First consumers; building them now avoids placeholders in a finished
screen. Ruben reviews and reuses them.

## Risks / Trade-offs

- [Ruben's `transactions` also wants transfers in 10] -> documented union; ids are distinct UUIDs.
- [Time zone math in SQL] -> `occurred_at AT TIME ZONE p.time_zone` with the plan joined, matching
  `monthOfInstant` in the engine.

## Migration Plan

`npm run migration:run` creates `account_transfers`. Rollback: `npm run migration:revert`.
