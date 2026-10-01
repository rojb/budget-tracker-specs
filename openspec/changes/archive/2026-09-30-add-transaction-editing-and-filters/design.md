# Design

## Context

See proposal.md for the why. The repos live side by side (`budget-tracker-back` and
`budget-tracker-front` inside the specs folder; the contract is `../openapi.yaml` from the back).
Already merged by `add-transactions` and reused here:

- Back: `transactions` and `transaction_splits` (every transaction has at least one split; an
  income to Ready to Assign is a split without envelope; `envelope_id ON DELETE SET NULL`),
  `TransactionsService` (`create`, `list`, the structural rules in `portionsOf`, `requireAccount`,
  `requireEnvelopes`, `resolvePayee`), `TransactionLedgerService` (the only reader of the facts:
  `netByAccount`, `monthlyFlows`, `balanceMovements`, `spending`, `payeeCounts`),
  `PlanAccessService` (`READ_ROLES`, `WRITE_ROLES`, 404 for non-members, 403 by role) and
  `CalculationService`, which never queries the database and consumes a `PlanLedger`.
- Front: `TransactionsController` (app-scoped list), `TransactionsRepository`, `TransactionDraft` (the
  movement being typed), `NewTransactionPage` (07 / 09), `SplitPage` (08), the pickers 26, 36, 37 and
  38, `MovementsPage` (10) with `buildDayGroups` (one card per row), `transactionRow`, `showSaved`,
  `confirmSheet`, `UiToast` (Neutral variant with an action) and `UiJoinedCard` (the "Entró" /
  "Salió" card of 14).

Sources: FR-13, FR-22 (PRD.md; FR-21, the plan-view filters, belongs to RRG-51 and is untouched),
PRD-ux-spec.md §5 (state "Movimientos"), §6.1 (rules 2, 5, 9 and 10: destructive entry, date groups,
selectors, search in place), §8 (Toast: Neutral with "Deshacer"), §9.1 and §9.5 (screens 10, 11, 12,
27 and 49); renders `design/screens/{10,11,12,27,49}-*.png`; capability specs `transactions`,
`budget-calc-engine`, `accounts`, `payees`, `envelopes`, `api-conventions`, `ui-design-system`.

## Goals / Non-Goals

**Goals:**
- Edit any field of a transaction (including its splits and a date in another month), delete it, and
  undo both, with every derived figure equal to recomputing from the stored facts.
- Filter and search the movement list (FR-22), with the "Salió en la franja / Entró" summary of the
  active filter, still paginated per `api-conventions`.
- Screens 12, 27, 11 and 49, and the screen 10 header (search, filters, chips, summary card).

**Non-Goals:**
- The plan-view filters of FR-21 (RRG-51), reports, and a movement-detail screen: 12 is opened from
  the row the client already holds, so there is no `GET /transactions/{id}`.
- A change history or an audit trail: the undo of an edit is the client's snapshot, not a server log.
- Purging logically deleted transactions (they are kept; a retention job is a later concern).
- Test files of any kind (repo rule).

## API surface

Added to and modified in `openapi.yaml` (first `[specs]` task), tag `Transactions`, all under bearer
auth:

| Operation | Path | Role | Request | Responses |
|---|---|---|---|---|
| `listTransactions` (modified) | `GET /plans/{planId}/transactions?accountId&payeeId&envelopeId&direction&from&to&timeFrom&timeTo&q&page&pageSize` | member | — | `200 TransactionPage` (now with `summary`), `400`, `401`, `404` |
| `updateTransaction` | `PUT /plans/{planId}/transactions/{transactionId}` | owner, editor | `CreateTransactionRequest` (reused) | `200 TransactionChange`, `400`, `401`, `403`, `404`, `409` |
| `deleteTransaction` | `DELETE /plans/{planId}/transactions/{transactionId}` | owner, editor | — | `200 AffectedMonths`, `400`, `401`, `403`, `404` |
| `restoreTransaction` | `POST /plans/{planId}/transactions/{transactionId}/restore` | owner, editor | — | `200 TransactionChange`, `400`, `401`, `403`, `404` |

Schemas (camelCase, optional fields omitted rather than `null`, no 3.1 `null` types):
- `TransactionSummary { outflowMinor >= 0, inflowMinor >= 0 }`: Σ of `amountMinor` of the matching
  expenses and incomes. `TransactionPage` gains the required `summary` next to `items`.
- `AffectedMonths { affectedMonths: MonthKey[] }`.
- `TransactionChange` = `AffectedMonths` + `transaction: Transaction`.
- New path parameter `TransactionId` (UUID) next to `PlanId`; `PUT` reuses `CreateTransactionRequest`
  unchanged, so the exclusive-field rules of creation apply (and are documented once).
- List parameters: `payeeId`, `envelopeId` (`Uuid`), `direction` (`TransactionDirection`), `from` and
  `to` (`string`, `format: date`), `timeFrom` and `timeTo` (`string`, pattern `^([01]\d|2[0-3]):[0-5]\d$`),
  `q` (`string`, 1..60). Invalid combinations (`from` after `to`, blank `q`) are `400`.

The proposal named `PATCH`; the design uses `PUT` (see Decisions).

## Undo and restore approach

The two undos have different shapes, and each restores the exact prior state:

1. **Delete → logical delete + `restore`.** A new nullable column `transactions.deleted_at`
   (`timestamptz`) marks the deletion. Every reader of the facts ignores rows with a `deleted_at`, so
   the budget is that of a plan that never had the transaction; `restore` clears the column. Nothing
   else of the row (id, `created_at`, payee, account, date, description, splits) is touched, so the
   restored transaction is byte-identical and returns to its place in the list, where the tie-break by
   creation instant matters. Re-creating it with `POST` would give it a new id and `created_at`, would
   fail with `409` if its account was archived in the meantime and with `404` if its payee was deleted,
   and could not recreate a portion whose envelope was deleted; the soft delete has none of those
   problems and also needs no client-held copy of the data.
2. **Edit → `PUT` of the client's snapshot.** The client keeps the `Transaction` it opened (the list
   already returned it) and "Deshacer" sends it back through the same `PUT`. The API keeps no history.
   This is exact because `PUT` replaces all editable fields atomically and never changes `id` or
   `created_at`, so after the undo the row equals the one before the edit; and because the existence
   rules for the account (active) and payee (active) apply only when they change, the undo cannot be
   refused for a reference the edit itself did not touch. The only way it fails is a reference that
   disappears between the edit and the undo (seconds apart); then the toast reports it and the edit
   stands.

Alternatives rejected: a server-side version table (more schema and a restore endpoint for a four-second
window), and `PATCH` with merge semantics (it cannot clear a payee, a description or an envelope
without `null` types, which this contract avoids; undoing an edit that *set* a payee would not be
possible).

## Recalculation guarantee

`budget-calc-engine` ("Derived values are never persisted") already makes this hold, and it was
checked in the code: `Assigned`, `Spent`, `Carryover`, `Available` and `ReadyToAssign` are computed by
`CalculationService` per request from a `PlanLedger` built by `EnvelopesService.ledger` out of
`TransactionLedgerService`, which runs SQL aggregates on every call; account balances come from
`AccountsService.balances` the same way. There is no cache, memoization or stored aggregate in the back
(`budget_months` holds months and assignments only), so **nothing needs to be invalidated**: an edit,
delete or restore only has to change the rows, and the next read of every month, balance and Ready to
Assign is the recomputation. What changes in the back is limited to: the facts' queries ignore deleted
rows (`AND t.deleted_at IS NULL` in the five methods of `TransactionLedgerService` and in the list),
and the writes happen in one database transaction so a reader never sees half an edit.

The only caches are in the client (`EnvelopesController`, `AccountsController`,
`TransactionsController`, the home figures): every successful edit, delete or restore, including the
undo, reloads them, as creation already does.

### Which months the toast names

The back returns `affectedMonths` (the plan time zone is known there and the client holds no time-zone
database): the month keys, ascending, from the earliest month the transaction touched, before or after
the change (the `occurredAt` of the old and of the new state, attributed in the plan's time zone), to
the later of the current month and the latest month it touched. Every month in between is affected
because a positive Available carries forward into each following month and Ready to Assign is plan
wide; future months mirror the current one (`budget-calc-engine`), so they are not listed. A change in
the current month names only that month. The client turns the keys into text: one month "Septiembre
actualizado.", two or three "Agosto y septiembre actualizados." / "Julio, agosto y septiembre
actualizados.", four or more "Mayo a septiembre actualizados.". The closed-month banner of 12 and the
note of 27 name the same months before the change is made, so they are computed by the client with the
same rule from the transaction's month and the current month in the device's local time, the zone the
rest of the app already uses for day groups; they are a preview, and the server's `affectedMonths` is
the authority for the toast.

## Backend design

```
src/transactions/
  transactions.controller.ts   (+ PUT, DELETE, POST restore)
  transactions.service.ts      (+ update, remove, restore, filters, summary, affectedMonths)
  dto/transaction.dto.ts       (+ summary, TransactionChange, AffectedMonths, filter query)
  entities/transaction.entity.ts (+ deletedAt)
  transaction-ledger.service.ts  (+ deleted_at filter)
src/database/migrations/<ts>-AddTransactionDeletedAt.ts
```

- **Migration.** `ALTER TABLE transactions ADD COLUMN deleted_at timestamptz NULL`; down drops it.
  No new index: the list's `IDX_transactions_plan_occurred` still narrows by plan and the extra
  predicate filters the rows it returns.
- **Update.** `update(planId, id, dto)`: load the transaction by id and plan with `deleted_at IS NULL`
  (`404`); structural rules through the existing `portionsOf`; the account is validated only when it
  differs from the current one and the payee (`payeeId`) only when it differs, `payeeName` through
  `PayeesService.findOrCreate` as on creation; envelopes through `requireEnvelopes`. Then one
  `dataSource.transaction`: update the row, delete its splits and insert the new ones with `position`
  from 0. The old and new `occurredAt` feed `affectedMonths`. `id` and `created_at` are never written.
- **Delete / restore.** Set / clear `deleted_at` on a row of the plan with the opposite state (`404`
  otherwise); both return `affectedMonths` of the row's own month.
- **Authorization.** The controller calls `PlanAccessService.require(planId, user.id, WRITE_ROLES)`
  first for the three writes (`403` viewer, `404` non-member), then the service looks the row up by
  `id` and `planId` together, so a transaction of another plan is `404`.
- **Filters.** `list` adds predicates to its query builder, joined to the plan for `time_zone`, with
  the local timestamp `t.occurred_at AT TIME ZONE p.time_zone`: `from`/`to` compare its date, the time
  range compares `to_char(local, 'HH24:MI')` (lexicographic comparison of fixed-width strings; a
  range with `timeFrom` after `timeTo` becomes `>= timeFrom OR <= timeTo`), `payeeId`/`accountId`/
  `direction` are equalities, `envelopeId` is `EXISTS (SELECT 1 FROM transaction_splits ...)`, and
  `q` is `ILIKE` over the payee name, the description and `EXISTS` over the envelope names of the
  splits, with `%`, `_` and `\` escaped. `total` stays `getManyAndCount`.
- **Summary.** A second query over the same predicates (`SUM(amount_minor) FILTER (WHERE direction =
  ...)`), run for every list call, so `summary` always equals the sum of the rows the filter selects,
  independent of the page. A transaction with a split on the filtered envelope counts with its whole
  amount, consistent with the row that is shown.
- **Swagger.** Every DTO with `@ApiProperty`; `operationId`s equal the contract's (`updateTransaction`,
  `deleteTransaction`, `restoreTransaction`); drift stays clean. `.contract-ref` is bumped in the
  `[back]` task that documents the endpoints, to the specs commit that holds the new paths.

## Generated client

Regenerated from the updated `openapi.yaml` with the pinned `dart-dio` generator (`-i` pointed at
`../openapi.yaml`, the pin untouched), then `dart run build_runner build`, `test/` and `doc/`
removed, own commit, as in the previous changes.

## Frontend design

```
lib/features/transactions/
  transaction_filter.dart       # immutable filter (dates, time range, payee, envelope, account, direction, q)
  filter_sheet.dart             # 11: showFilterSheet(...) -> TransactionFilter?
  edit_transaction_page.dart    # 12 (reuses TransactionDraft and the 07 field row / pad / pickers)
  delete_transaction_sheet.dart # 27: confirmation with the movement and the months
  transaction_change.dart       # result of 12 / 27 and the toast + undo of 49
  movements_page.dart           # 10: header with search and filters, chips, summary card
  transactions_controller.dart  # + filter, summary, update / remove / restore
  transactions_repository.dart  # + filters, summary, update / delete / restore
  transaction_draft.dart        # + fromTransaction, snapshot helpers
  split_page.dart               # + confirm callback so 08 can finish an edit
lib/features/common/months.dart # month names for the toast
```

- **Routes.** `AppRoutes.editTransaction(id)` = `/transactions/:transactionId/edit` on the root
  navigator (no tab bar), receiving the `TransactionData` as `extra` (10 and 14 hold it). It pops with a
  `TransactionChange` result (`edited` with the previous snapshot, or `deleted`). 27 and 11 are bottom
  sheets (no route). 08 reuses `splitTransaction` with the edit draft.
- **49 is not a route.** It is 10 (or 14) with the toast: the caller of the edit page awaits the result
  and, if there is one, shows `showUiToast` (Neutral, "Recalculado" or "Movimiento eliminado", the months
  detail, "Deshacer", `bottomOffset` above the `NavCluster`, 4 s) with its own context, then the
  controllers reload. "Deshacer" calls `TransactionsController.update(snapshot)` or `restore(id)`,
  reloads envelopes, accounts and the list, and the toast is replaced by none.
- **12.** `TransactionDraft.fromTransaction` loads the amount (typed digits of the minor amount, so the
  expression engine and the pad work), the direction, payee (id and name), account, `occurredAt`,
  description, and either `envelopeId` or the `splits`. The page keeps the original `TransactionData` for
  the "Antes $ X" line and the undo snapshot. Layout: back and red trash `UiIconButton` (→ 27), title
  36, the lavender `UiInfoNote` (history icon) "Es de <mes>, un mes cerrado" only when the movement's
  month is before the current one, `UiAmountCapsule`, "Antes $ X" (caption) while the amount differs,
  one `UiCard` of `UiFieldRow`s (Beneficiario → 26, Sobre → 36 or "<N> sobres" → 08, Cuenta → 37, Fecha y
  hora → 38, Descripción), `UiCalculatorPad` toggled by the `SaveBar` calculator icon, and `UiSaveBar`
  "Guardar cambios". The save sends `PUT` through the same error mapping as `saveTransaction`. The
  direction is not editable in 12 (no toggle in the design); the contract allows it for other clients.
  Splits: 08 is opened with the draft; its `SaveBar` finishes the edit instead of creating (a
  `onConfirm` callback), keeping its exact-sum rules. A portion whose envelope was deleted ("Sin
  sobre") has no envelope and must be given one in 08 before saving.
- **27.** `showDeleteTransactionSheet` → `UiSheet` "¿Eliminar este movimiento?" with the movement as a
  `UiTxRow`, the lavender `UiInfoNote` "Se recalcularán <meses>." / "Los saldos y Listo para asignar se
  actualizan al confirmar." and Cancelar / Eliminar (`confirmSheet`'s buttons, solid danger). Eliminar
  calls `DELETE` and pops 12 with the `deleted` result.
- **10 header.** Title 36 with two `UiIconButton`s: search (soft white; tapping swaps the title row for a
  `UiTextField` with an `x` that collapses it, §6.1 rule 10) and filters (lavender when a filter is
  active, → 11). Under them a `Wrap` of removable `UiFilterChip`s (dates "1 – 30 sep", time
  "18:00 – 23:59", payee, envelope, account, direction), then, only while a filter or search is active,
  the `UiJoinedCard` with `summary.outflowMinor` "Salió en la franja" and `summary.inflowMinor` "Entró"
  (`secondaryIsAmount`). Rows get `onTap` → 12. The search text applies after a 350 ms pause and restarts
  at page 1; filters live in `TransactionsController`, so 14's `forAccount` (its own repository call) is
  not affected. States: "Todavía no hay movimientos" without filters, "No hay movimientos con estos
  filtros" with a "Limpiar filtros" button when a filter selects nothing.
- **11.** `showFilterSheet` → `UiSheet` "Filtrar" (close 48): "Fechas" with two `UiPickerField`s (Desde /
  Hasta, a calendar-only variant of the 38 sheet: `showDateSheet`), "Franja horaria" with the four
  `UiChip`s and two time `UiPickerField`s (a time-only variant of 38 with the hour and minute
  `UiStepper`s: `showTimeSheet`), "Tipo" as a three-segment `UiToggle` (Todos, Gastos, Ingresos), three
  `UiFilterRow`s (Beneficiario → 26, Sobre → 36, Cuenta → 37) and a footer with "Limpiar" and the
  chartreuse "Ver N movimientos". N comes from `TransactionsRepository.list(filter, pageSize: 1).total`,
  requested (debounced) when a choice changes. Closing or tapping the button returns the filter to 10;
  closing without a change keeps the previous one. The pickers 26, 36 and 37 are the existing ones; 26
  and 36 need an "all" option, so they gain an optional leading "Todos"/"Todas" row.
- **14.** `AccountDetailPage` gives its transaction rows an `onTap` that opens 12 and, on a result, shows
  the same toast and reloads its list (an edit of nathaliascode's screen limited to the tap and reload).
- **Money, dates and months.** Amounts through `formatMoney`; dates sent as `occurredAt.toUtc()`; the
  month names ("agosto") come from `months.dart`; the date filters are sent as local `YYYY-MM-DD` and
  `HH:mm` strings, which the server interprets in the plan's time zone.

## UI components

Existing, used as is: `UiAmountCapsule`, `UiCalculatorPad`, `UiSaveBar`, `UiFieldRow`, `UiCard`,
`UiSheet`/`showUiSheet`, `UiTxRow`, `UiIconButton` (incl. the danger variant), `UiInfoNote` (lavender),
`UiButton` (white, danger, primary), `UiChip`, `UiJoinedCard`, `UiTextField`, `UiToast` and
`showUiToast`, `UiStepper`, `UiCalendarMonth`, `UiFormMessage`, and the pickers 26, 36, 37, 38.

New or modified in `packages/ui`, each with Widgetbook stories and flagged for the other dev's review
(docs/COLABORACION.md §5), landed as small separate commits:
- **`UiFilterChip` (new, molecule)**: the removable chip of 10 (leading icon, label, `x`), 34 dp,
  white, pill.
- **`UiPickerField` (new, molecule)**: the Desde / Hasta input of 11: small muted label over the
  value, trailing calendar or clock icon, white pill.
- **`UiFilterRow` (new, molecule)**: Beneficiario / Sobre / Cuenta row of 11: leading icon, label,
  muted value ("Todos") and a chevron-down, white pill.
- **`UiToggle` (modified)**: accepts two or three segments (the assertion becomes 2..3) for "Tipo";
  the two-segment use is unchanged.
- **`UiIcons` (modified)** adds `sliders`, `calendar` and `store`.

No other component changes: the summary card is `UiJoinedCard`, the closed-month note and the
destructive confirmation reuse `UiInfoNote` and the confirm layout, and the toast is `UiToast`'s
Neutral variant.

## Decisions

**`PUT` (replace) instead of `PATCH` for edits.** The proposal wrote `PATCH`. A merge patch cannot
express "no payee", "no description" or "Ready to Assign" without `null` types or flags, and it would
make the client's undo (send the old state back) depend on which fields were present. `PUT` with the
creation body reuses every validation and the form's `build()`, has one meaning ("this is the state"),
and makes the undo a replay. `proposal.md` is updated accordingly.

**Soft delete + `restore` for the delete undo.** Exact (same id, `created_at`, splits), no data held
by the client, immune to the account or payee changing in between. Cost: one nullable column and a
`deleted_at IS NULL` predicate in six queries, kept in one place (`TransactionLedgerService` and the
list).

**`affectedMonths` computed by the server.** The plan's time zone and "today" are the server's
knowledge; the toast must name what really recalculated, and the contract gives it to every client.

**Summary in the list response, not a second endpoint.** One round trip, always consistent with the
filter and the page; the cost is one aggregate query per list call (also for 14, which ignores it).

**Filters accept local dates and times in the plan's time zone, not instants.** The UX (a date range
"1 – 30 sep", "Noche 18:00 – 23:59") is expressed in local time, the engine attributes months in the
same zone, and a time-of-day range has no instant representation. A range with `timeFrom` after
`timeTo` crosses midnight so "Noche" can be extended past 00:00.

**A transaction counts with its whole amount in the summary when only a portion matches an envelope
filter.** The list shows the whole transaction; a summary that disagreed with the visible rows would
be harder to trust than one that explains itself.

**Direction is editable in the API, not in 12.** The design shows no toggle in 12; keeping the API
general lets the contract match the data model without adding UI the design does not have.

**Editing does not re-validate unchanged references.** An archived account or a deleted payee must not
make the rest of a transaction uneditable, nor make an undo fail.

## Risks / Trade-offs

- [A reader of the facts forgets the `deleted_at` filter] -> all reads go through
  `TransactionLedgerService` and the list; the verification matrix deletes and restores and compares
  every figure with the "never created" and "before" values.
- [`PUT` races with another editor] -> last write wins, as for payees and accounts; the figures are
  recomputed, so no inconsistency is possible, only a lost field edit.
- [The time-of-day filter cannot use an index] -> acceptable for the per-plan volume; the plan filter
  narrows first.
- [The undo of an edit fails if a reference vanished in between] -> reported by the toast; the edit
  stands and the user can fix it by hand.
- [`UiToggle` changes for the three segments of "Tipo"] -> two-segment callers are unchanged; stories
  for both.
- [14 gets an `onTap` and a reload] -> limited to the tap, the toast and the reload of its list.

## Migration Plan

`npm run migration:run` adds `transactions.deleted_at`; `npm run migration:revert` drops it (any
logically deleted transaction would then reappear, so revert is only for development). Front:
regenerated client plus additive routes and sheets.
