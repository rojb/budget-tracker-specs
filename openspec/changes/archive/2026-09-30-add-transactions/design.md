# Design

## Context

See proposal.md for the why. The repos live side by side (`budget-tracker-back` and
`budget-tracker-front` inside the specs folder; the contract is `../openapi.yaml` from the back).
Already merged and reused here:

- Back: `PlansModule` exports `PlanAccessService` (404 for non-members, 403 by role, constants
  `READ_ROLES`/`WRITE_ROLES`) and the `parseUuid` pipe; `BudgetModule` exports `CalculationService`
  and `AssignmentsService`; `CalculationService` never queries the database, it consumes a
  `PlanLedger` (`balanceMovements`, `assignments`, `spending`) built by
  `EnvelopesService.ledger(plan)`, whose `spending` is an empty array "until add-transactions".
  `AccountsService` derives balances and monthly flows with raw SQL over `account_transfers` and
  lists "add-transactions adds its rows" in three comments (`balances`, `ledgerBalanceMovements`,
  `monthlyFlows`); `PayeesService.transactionCounts` returns an empty map "until add-transactions"
  and `PayeesService.findOrCreate(planId, name)` exists for this change. `envelopes` FKs are ready:
  a deleted envelope must leave its movements as "Sin sobre".
- Front: app-scoped `PlansController`, `AccountsController` and `EnvelopesController`, `ApiGateway`
  with `guardApi`/`ApiFailure`, the account picker (`showAccountPicker`, 37), the date and time
  sheet (`showDateTimeSheet`, 38) and `dayGroupLabel`/`timeLabel` (`features/common`), the route
  `AppRoutes.newTransaction` behind the `NavCluster` "+" (a placeholder), the tab
  `AppRoutes.transactions` (a placeholder), and `packages/ui` with `UiToggle`, `UiKey`,
  `UiAmountCapsule`, `UiSaveBar` (enabled/disabled), `UiTxRow` (Expense/Income, added with
  transfers), `UiFieldRow`, `UiPayeeRow`, `UiAccountRow`, `UiStripeBar`, `UiSectionLabel`,
  `UiCard`, `UiSheet`, `UiTextField`.

Sources: FR-06, FR-07, FR-08, FR-14, FR-18, FR-23 and the money/time-zone NFRs (PRD.md),
PRD-ux-spec.md §5 (states "Nuevo movimiento" and "Movimientos"), §6.1 (rules 1, 5, 9, 10), §7
(Montos, Moneda), §8 (`TxRow`, `AmountCapsule`, `Key`, `SaveBar` incl. Disabled, `Toggle`, the
divider style 2), §9.1 and §9.5 (screens 07, 08, 09, 10, 26, 36, 38, and 37); renders
`design/screens/{07,08,09,10,26,36,37,38}-*.png`; capability specs `budget-calc-engine`,
`accounts`, `envelopes`, `payees`, `api-conventions`, `plans`, `ui-design-system`.

## Goals / Non-Goals

**Goals:**
- `transactions` and `transaction_splits` tables, create and list endpoints, and the engine and
  account integration through the existing extension points.
- Screens 07, 08, 09, 10, 26 and 36, and the FR-18 calculator; 37 and 38 reused as they are.
- Account detail (14) lists transactions with its transfers; payee counts become real; the
  envelope list carries `spentMinor` so 02 stops approximating spending.

**Non-Goals:**
- Editing and deleting transactions, their recalculation notices and the filters and search of 10
  (11, 12, 27, 49) (`add-transaction-editing-and-filters`). Transfers stay their own entity
  (`add-account-transfers`) and are not listed in 10.
- Opening a movement from 10 or 14, the "Ver movimientos" link of 41 and envelope detail (22).
- Test files of any kind (repo rule).

## Screen 10 boundary with add-transaction-editing-and-filters (RRG-50)

10 is shared. This change delivers the **list**; RRG-50 owns the **filters and the row action**:

| Owned by this change (RRG-49) | Owned by RRG-50 |
|---|---|
| Route `/transactions` replaces the placeholder: title "Movimientos", list newest first grouped by day, pagination on scroll, skeleton, empty and error states | Search (lupa) and the filters button with its chips and the "Salió en la franja / Entró" summary |
| `TxRow` content: title, envelope or "N sobres", time, account, signed amount, icons | Tapping a row → 12, edit, delete, recalculation toasts (49) |
| `GET /transactions` with `page`, `pageSize`, `accountId` | The same operation gains `from`/`to`, time range, `payeeId`, `envelopeId`, `direction`, `q` (FR-22) |

Consequence: the header shows only the title; the row is not tappable yet. The "+" of the `NavCluster`
keeps opening 07 from every tab.

## API surface

Added to `openapi.yaml` (first `[specs]` task), tag `Transactions`, all under bearer auth:

| Operation | Path | Role | Request | Responses |
|---|---|---|---|---|
| `createTransaction` | `POST /plans/{planId}/transactions` | owner, editor | `CreateTransactionRequest` | `201 Transaction`, `400`, `401`, `403`, `404`, `409` |
| `listTransactions` | `GET /plans/{planId}/transactions?accountId&page&pageSize` | member | — | `200 TransactionPage`, `400`, `401`, `404` |

Modified: `EnvelopeLine` (used by `listEnvelopes`) gains the required `spentMinor` (additive).

Schemas (camelCase, optional fields omitted rather than `null`):
- `TransactionDirection` enum `expense, income`.
- `TransactionSplit { envelopeId?, envelopeName?, amountMinor >= 1 }`: one per portion; an income
  to Ready to Assign has one split without an envelope.
- `Transaction { id, direction, accountId, accountName, amountMinor >= 1, occurredAt, payeeId?,
  payeeName?, description?, splits: TransactionSplit[] (1..), createdAt }`.
- `TransactionPage` = `PageMeta` + `items: Transaction[]`.
- `CreateTransactionRequest { direction, accountId, amountMinor >= 1, occurredAt, payeeId? |
  payeeName? (1..60), description? (0..120), envelopeId?, splits? (2..20 of CreateTransactionSplit
  { envelopeId, amountMinor >= 1 }) }`, `additionalProperties: false`. The exclusive rules
  (`payeeId` xor `payeeName`; an expense has `envelopeId` xor `splits`; an income has no `splits`;
  portions add up to `amountMinor`) cannot be written as closed `oneOf` without breaking the client
  generator, so they are described in the schema text and enforced by the API with `400`.
- Reuses `Uuid`, `Timestamp`, `MoneyMinor`, `PageMeta`, `Page`/`PageSize` parameters and the
  `ValidationFailed`, `Unauthorized`, `Forbidden`, `NotFound` responses. The `409` (archived
  account) is declared inline like `createTransfer`'s.
- No 3.1 `null` types, path parameters declared per operation (the oasdiff/Redocly constraints
  found in `add-plans-and-accounts`).

Transactions are an unbounded collection, so the list uses the pagination envelope of
`api-conventions`. There is no `GET /transactions/{id}` yet: nothing renders a single transaction
before RRG-50.

## Data model

```
transactions(id uuid pk, plan_id fk plans cascade, account_id fk accounts, payee_id fk payees null,
  direction varchar(7) CHECK in ('expense','income'), amount_minor bigint CHECK > 0,
  occurred_at timestamptz, description varchar(120) null, created_by fk users set null,
  created_at timestamptz default now())
transaction_splits(id uuid pk, transaction_id fk transactions cascade,
  envelope_id fk envelopes ON DELETE SET NULL null, amount_minor bigint CHECK > 0, position int)
```

- Indexes: `IDX_transactions_plan_occurred (plan_id, occurred_at DESC, created_at DESC)` for the
  list and the newest-first order, `IDX_transactions_account (account_id)` for balances and the
  per-account list, `IDX_transactions_payee (payee_id)` for the counts,
  `IDX_transaction_splits_transaction (transaction_id)` and `IDX_transaction_splits_envelope
  (envelope_id)` for spending.
- Accounts and payees are never hard-deleted (archive, soft delete), so their FKs take no cascade;
  a plan deletion cascades to transactions and splits.
- An envelope deleted leaves its portions with `envelope_id NULL` ("Sin sobre"), the behaviour
  that `add-envelopes` announced.
- `amount_minor` is `bigint` read through the existing `minorAmountTransformer`. The sum of the
  portions equals `amount_minor` (checked in the service inside the insert transaction; a
  cross-row constraint is not expressible as a `CHECK`).
- Every transaction has at least one split. Income to Ready to Assign is a split without envelope;
  a split without envelope on an expense only arises when its envelope is deleted.

## How the budget engine and the accounts consume transactions

No extension point is invented; the three existing ones are filled. One small read-only provider,
`TransactionLedgerService`, owns the SQL so the sign rules live in one place:

```
TransactionLedgerService            (module TransactionLedgerModule, imports only TypeORM)
  netByAccount(planId)              -> Map<accountId, signed sum>      income +, expense −
  monthlyFlows(accountId, month)    -> { inflow, outflow }             in the plan time zone
  balanceMovements(planId, tz, activeAccountIds) -> LedgerAmount[]     one row per month and sign
  spending(planId, tz)              -> EnvelopeAmount[]                expense portion +, income portion −
  payeeCounts(planId)               -> Map<payeeId, count>
```

- `AccountsService.balances` adds `netByAccount` to the opening balance plus transfers;
  `ledgerBalanceMovements` appends `balanceMovements` of the active accounts; `monthlyFlows` adds
  the transaction inflow and outflow to the transfers'. (Edits in `nathaliascode`'s module, limited
  to the three marked places.)
- `EnvelopesService.ledger` replaces `spending: []` by `await ledger.spending(...)`. A portion
  without envelope is skipped in SQL (`envelope_id IS NOT NULL`), so it affects no `Spent` but its
  amount is already in the account balance, exactly the engine rule added in this change.
- `PayeesService.transactionCounts` becomes a `GROUP BY payee_id` through `payeeCounts`.
- The month of each row is computed in SQL by `to_char(occurred_at AT TIME ZONE plans.time_zone,
  'YYYY-MM')`, the same expression `monthlyFlows` already uses for transfers, so the attribution
  rule is identical in JavaScript (`monthOfInstant`) and SQL. Grouping in SQL means the engine
  receives one row per envelope and month instead of one per transaction.
- `CalculationService` and `PlanLedger` are untouched. `EnvelopeLine` needs `spentMinor`, which the
  engine already computes (`EnvelopeMonthState.spentMinor`); `EnvelopesService.list` only maps it.
- Module graph without cycles: `TransactionLedgerModule` (no dependencies) is imported by
  `AccountsModule`, `PayeesModule`, `EnvelopesModule` and `TransactionsModule`;
  `TransactionsModule` imports `PlansModule` and `PayeesModule` (for `findOrCreate`) and uses
  `TypeOrmModule.forFeature` for the `Account` and `Envelope` repositories, the way `PayeesModule`
  does for envelopes.

## Backend design

```
src/transactions/
  transactions.module.ts  transactions.controller.ts  transactions.service.ts
  transaction-ledger.module.ts  transaction-ledger.service.ts
  entities/{transaction,transaction-split}.entity.ts
  dto/{transaction,create-transaction}.dto.ts
src/database/migrations/<ts>-CreateTransactions.ts
```

- **Create.** `TransactionsService.create(planId, userId, dto)`: structural rules first (exclusive
  fields, portions add up, `400`), then one query per reference (account `404`/`409`, envelopes in
  one `IN` query `404`, payee `404` when it is deleted or foreign), then `payeeName` through
  `PayeesService.findOrCreate`, then the insert of the transaction and its splits in one
  `dataSource.transaction`. The payee is created before the transaction so a payee created on first
  use exists even if the client retries; `findOrCreate` is idempotent by name.
- **List.** One query for the page (`ORDER BY occurred_at DESC, created_at DESC, id DESC`, joined to
  the account and the payee, including deleted payees, for the names), one for the splits of those
  ids joined to envelopes for their names. `total` from `getManyAndCount`.
- **Authorization.** The controller calls `PlanAccessService.require(planId, user.id, READ_ROLES |
  WRITE_ROLES)` first, like `payees` and `envelopes`.
- **Validation.** DTOs: `@IsEnum`, `@IsUUID`, `@IsInt @Min(1) @Max(MAX_SAFE_INTEGER)`,
  `@IsDateString({ strict: true })` plus a check that the string carries an offset (the contract
  says so and `transfers` share the gap), `@ValidateNested` for splits with `@ArrayMinSize(2)` and
  `@ArrayMaxSize(20)`, names trimmed. The global pipe rejects unknown properties.
- **Swagger.** Every DTO with `@ApiProperty`; `operationId`s equal the contract's; drift stays
  clean. `.contract-ref` is bumped in the `[back]` task that documents the module, to the specs
  commit that holds the new paths.

## Generated client

Regenerated from the updated `openapi.yaml` with the pinned `dart-dio` generator (`-i` pointed at
`../openapi.yaml`, the pin untouched), then `dart run build_runner build`, `test/` and `doc/`
removed, own commit, as in the previous changes.

## Frontend design

```
lib/features/transactions/
  transactions_repository.dart  # generated TransactionsApi → TransactionData, guardApi
  transactions_controller.dart  # app-scoped: first page, loadMore, refresh, per-account helper
  amount_expression.dart        # FR-18: pure Dart evaluator and display
  transaction_draft.dart        # ChangeNotifier of the movement being typed (07 / 09 / 08)
  new_transaction_page.dart     # 07 and 09 (one page, two modes)
  split_page.dart               # 08
  envelope_picker.dart          # 36: showEnvelopePicker(...)
  payee_picker.dart             # 26: showPayeePicker(...)
  movements_page.dart           # 10
  transaction_rows.dart         # TransactionData → UiTxRow props, shared with 14
lib/features/common/day_groups.dart   # groups dated items by dayGroupLabel, used by 10 and 14
```

- **Routes.** `AppRoutes.newTransaction` (`/transactions/new`, root navigator, hides the tab bar)
  builds `NewTransactionPage` (07, or 09 by the toggle), and a child `split` route
  (`/transactions/new/split`) builds `SplitPage` (08) with the `TransactionDraft` passed as `extra`.
  The tab `/transactions` builds `MovementsPage` and loses its "placeholder" comment.
- **State.** `TransactionsController` is app-scoped (like `EnvelopesController`): it reloads when the
  active plan changes and after every successful create, keeping `items`, `page`, `total`,
  `loadMore()` (next page while more exist) and `refresh()`. After a create the page also calls
  `EnvelopesController.load()` and `AccountsController.load()`, because the figures come from the
  API. `TransactionDraft` holds direction, `AmountExpression`, payee (id or typed name), envelope
  (or none for Ready to Assign), splits, account id, `occurredAt` and description; 07 and 08 listen
  to the same instance, so going back from 08 keeps everything.
- **07 / 09.** `UiToggle` Gasto/Ingreso with the close `UiIconButton`, `UiAmountCapsule` (symbol
  of the plan currency), the expression caption (13, `ink-muted`) when the expression has an
  operator, a `UiCard` of `UiFieldRow`s (Beneficiario, Sobre (expense only), Cuenta, Fecha y hora,
  Descripción), `UiCalculatorPad` and `UiSaveBar`. Expense: the pad is always visible and the
  `SaveBar` leading icon is the split icon (→ 08). Income: the "¿A dónde va?" block of two
  `UiChoiceCard`s replaces the Sobre row, and the `SaveBar` leading icon is the calculator, which
  shows or hides the pad (shown while the amount is 0). Description opens `showTextEditSheet`
  (max 120). Errors show in a `UiFormMessage` above the SaveBar ("Ingresá un monto mayor a cero.",
  "Elegí un sobre.", "Revisá la operación."); a `403` shows `showForbidden`, a network failure
  `showConnectionProblem`. Success: `showSaved('Movimiento guardado')` and `context.pop()`.
  Payee and account defaults: no payee; first active account. No active account replaces the body
  with `UiInfoNote` + `UiButton` "Agregar cuenta" (→ `AppRoutes.newAccount`), like 29.
- **08.** Back and close `UiIconButton`s, title (36), subtitle "<payee> · <date> · <total>"
  (caption), `UiSplitProgress` (stripe bar of the distributed share, "Repartido $ X" and "Restan
  $ Y"), one `UiSplitRow` per part (its amount pill opens `showAmountSheet`; tapping the name picks
  another envelope through 36; a long press or the semantics action removes the part), a last
  `UiSplitRow.pending` "Elegí un sobre" with the remainder (it adds a part with that amount),
  the error `UiFormMessage` "Las partes deben sumar el total: faltan $ X." and `UiSaveBar` Disabled
  with "Faltan $ X" / "Sobran $ X" until two or more parts with an envelope each add up exactly,
  then "Guardar gasto". Envelopes already used in another part are hidden from 36. The
  initial state is the envelope chosen in 07 (if any) with the whole amount plus the pending row.
- **36.** `showEnvelopePicker` → `UiSheet` "Elegí un sobre", `UiTextField` search, then per group a
  `UiSectionLabel` and `UiEnvelopePickRow`s in one `UiCard`; "SIN GRUPO" last; an optional first row
  "Listo para asignar" (income). Data comes from `EnvelopesController.lines` (Available of the
  current month), so it needs no request. Returns the selection through a small sealed result
  (envelope, ready to assign).
- **26.** `showPayeePicker` → `UiSheet` "Elegí un beneficiario", search, `UiPayeeRow` selectable
  (initials avatar, name, "Sugerido: <envelope>", check/radio) and the `Crear "<text>"` row. It
  loads the first 100 active payees (`PayeesRepository.list`, as 15 does) and filters in place.
  Returns an existing payee, a new name, or "none" (tapping the selected payee). The suggested
  envelope applies to the draft when the movement is an expense and the envelope was not picked
  by hand.
- **37 / 38.** `showAccountPicker` and `showDateTimeSheet` are called as they are.
- **10.** `MovementsPage`: title "Movimientos" (36), `DayGroups` of `UiTxRow`s in one `UiCard` per
  day (the `dayGroupLabel` headers), pull to refresh, `loadMore` when the scroll nears the end,
  three skeleton rows while the first page loads, "Todavía no hay movimientos" and a retry. Row
  mapping (`transaction_rows.dart`): title payee name, else description, else "Sin beneficiario";
  subtitle "<envelope name> · <HH:mm>", "<N> sobres · <HH:mm>" or "Listo para asignar · <HH:mm>"
  (for an income without envelope) or "Sin sobre · <HH:mm>"; `caption` the account name; amount
  `−$ X` or `+$ X` through `formatMoney`; icon from the envelope (`uiEnvelopeIcon`), `split` for
  a split, `arrowDownLeft` for an income to Ready to Assign, `tag` when the envelope is gone.
- **14.** `AccountDetailPage` loads `TransactionsRepository.forAccount` next to its transfers and
  merges both by `occurredAt` (newest first) under the shared day groups; transaction rows use the
  same mapping without the account caption (an edit of nathaliascode's screen, limited to its
  movement list).
- **02.** `EnvelopeLineData` reads `spentMinor` from the API instead of `assigned − available`, so
  "<spent> de <assigned>" is correct with carryover and income.
- **Amounts.** Entry goes through `AmountExpression`, display through `formatMoney` and
  `formatAmountValue`; dates sent as `occurredAt.toUtc()`.

### Calculator (FR-18)

`AmountExpression` is pure Dart, no floats, no dependency on Flutter:

- State: a list of tokens (operand strings made of digits and at most one decimal comma, and the
  operators `+ − × ÷`). Keys: digit, decimal comma (ignored when the operand already has one),
  operator (replaces a trailing operator; ignored on an empty expression except a leading `−`
  is refused: a result must be positive), delete (removes the last character).
- Evaluation: each operand becomes an exact rational (`BigInt` numerator over a power of ten);
  `×` and `÷` bind tighter than `+` and `−`; the result is rounded half up to the currency's minor
  units when read as `minor`. A trailing operator is ignored for the preview. Division by zero or
  an empty expression yields no value. A result `<= 0` is not savable.
- Display: the capsule shows the result (or the operand being typed while there is no operator);
  the caption shows the expression with `formatAmountValue`-style thousands separators,
  operators spaced ("12.300 + 6.150"). The decimal comma is accepted in every plan currency so
  `1,5 × 2` works in pesos; a result is always integer minor units.
- The `SaveBar` calculator button of 09 and the always-visible pad of 07 use the same instance.

## UI components

Existing, used as is: `UiToggle`, `UiAmountCapsule`, `UiKey`, `UiSaveBar` (incl. disabled),
`UiTxRow`, `UiFieldRow`, `UiCard`, `UiSheet`/`showUiSheet`, `UiTextField`, `UiIconButton`,
`UiSectionLabel`, `UiStripeBar`, `UiInfoNote`, `UiFormMessage`, `UiButton`, `UiToast`,
`UiAccountRow` (37), `UiCalendarMonth` and `UiStepper` (38).

New or modified in `packages/ui`, each with Widgetbook stories and flagged for the other dev's
review (docs/COLABORACION.md §5), landed as small separate commits:
- **`UiCalculatorPad` (new, organism)**: the 4 x 4 pad of 07 (digits, decimal comma, `÷ × − +`
  lavender operators, delete) built from `UiKey`, reporting `onKey(String)` and `onDelete`; the
  decimal key can be disabled. Purely presentational (the expression lives in the app).
- **`UiEnvelopePickRow` (new, molecule)**: envelope row of 36: 44 dp icon circle (red tint when
  overspent), name, group name, amount with the caption "Disponible" / "Sobregirado" (red, `−`) /
  "Sin asignar", radio or lavender check.
- **`UiSplitRow` (new, molecule)**: part card of 08: icon circle, name, "$ X disponible" and the
  lavender amount pill; a `pending` variant with the plus icon, "Elegí un sobre" and a red-tinted
  pill with the remainder.
- **`UiSplitProgress` (new, molecule)**: the stripe bar with "Repartido $ X" and "Restan $ Y" of 08.
- **`UiChoiceCard` (new, molecule)**: the two "¿A dónde va?" options of 09: icon circle, title,
  description and a dark check circle (selected, lavender card) or an empty radio (white card).
- **`UiPayeeRow` (modified)**: `selectable` variant for 26 (lavender avatar, selectable check or
  radio instead of the chevron); the list variant is unchanged.
- **`UiIcons` (modified)** adds `split`, `inbox` and `arrowDownLeft`.

`UiTxRow` (new in the roadmap, present since `add-account-transfers`) needs no change. The keypad
is `UiCalculatorPad`, not a screen-local widget, so the packages/ui boundary (no API client, only
callbacks) holds.

## Decisions

**Every transaction has splits, even a single one.** One model serves a simple expense, a split
expense, an income to an envelope and an income to Ready to Assign (a split without envelope), so
the engine's `spending` and the `Sin sobre` rule are one query, and `envelope_id ON DELETE SET
NULL` gives the spec'd behaviour for free. The alternative, an `envelope_id` column on
`transactions` plus a splits table only for splits, needs two code paths for every figure and a
migration when a transaction later gains its first split (RRG-50 edit).

**Create accepts `envelopeId` or `splits`, not always `splits`.** The simple flow (07, 09) sends
one field; only 08 builds an array. Clients that do not split never build a one-element array; the
response is uniform anyway (`splits`).

**`payeeName` creates the payee in the same call.** FR-23 and the payees spec ("Se crean solos la
primera vez que los usás en un movimiento") want a payee to exist after its first use without an
extra round trip from the picker. `PayeesService.findOrCreate` already returns the active payee of
that name ignoring case, so a retry or a race cannot duplicate it.

**Income to Ready to Assign is "no envelope".** No separate flag: 09's first option is the absence
of an envelope, which is what the engine already treats as not activity (`budget-calc-engine`,
Envelope activity).

**One `TransactionLedgerService` for every fact read.** The alternative (each module querying the
`transactions` table) repeats the sign and month rules in four places. It is a leaf module, so
`AccountsModule`, `PayeesModule` and `EnvelopesModule` can import it without a cycle.

**`spentMinor` joins `EnvelopeLine`.** Approximating spent as `assigned − available` was documented
as temporary in `add-envelopes` and is wrong with carryover or income to an envelope. The engine
already returns `spentMinor`; the field is additive so the pinned drift check for older clients
stays compatible.

**Transfers are not listed in 10.** The renders show none in 10, `add-account-transfers` keeps them
in 14, and `listTransactions` returns transactions only; merging two collections under one
pagination would need a union endpoint RRG-50's filters would then have to extend.

**Amount editing stays on the page, not in a sheet.** `showAmountSheet` (a digit-only pad that
fills minor units from the right) remains for 29, 46 and the part pills of 08; 07 and 09 use the
expression pad of the design, which the sheet cannot express.

**Split only for expenses, at least two portions, duplicates allowed in the API.** The UX only
offers "Dividir" on expenses; the client hides envelopes already used in another part, but the API
does not forbid two portions on one envelope because the sum rule is what protects the books.

**Future dates are accepted.** The UX spec has no rule against them (the date sheet can navigate
forward) and the engine attributes them to their own month.

## Risks / Trade-offs

- [Filling the three marked places of `AccountsService` touches nathaliascode's module] -> the
  edits are the ones her comments ask for, each a one-line call into the leaf provider; called out
  in the handoff note.
- [Cross-module consistency between `netByAccount` and `balanceMovements`] -> both derive from the
  same table and sign rule inside one service.
- [The pad, four new molecules and one modified one land in `packages/ui`] -> separate commits per
  component family with stories, reviewable independently.
- [`listPayees` returns the first 100 payees, so the picker cannot reach the 101st] -> the same
  limit as 15; a server-side `q` search in the picker is the follow-up if a plan grows past it.
- [`additionalProperties: false` requests plus exclusive fields that are not in the schema]
  -> documented in the schema descriptions and covered by `400` responses in the verification.
- [A crash between creating the payee and the transaction leaves an unused payee] -> harmless (it
  appears with 0 movements) and reused by the retry.

## Migration Plan

`npm run migration:run` creates `transactions` and `transaction_splits` with their indexes.
Rollback: `npm run migration:revert` drops both tables; nothing else references them. Front:
regenerated client plus additive routes; the placeholders at `/transactions` and
`/transactions/new` are replaced.
