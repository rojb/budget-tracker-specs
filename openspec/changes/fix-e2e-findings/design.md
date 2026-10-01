# Design

## Context

See proposal.md for the why. The defects were found on a device against the real back; each root
cause below comes from reading the code. The back already implements everything except the order of
the lists (D8); the rest is in `budget-tracker-front`. Several areas belong to nathaliascode
(plans, sharing, accounts), so every change stays local to the existing widget and follows its
style.

Sources: FR-08, FR-27, FR-04, FR-02, FR-03, FR-13, FR-28, FR-16; PRD-ux-spec.md §6.1 (conventions,
rule 5 date grouping), §8 (components), §9.1 rule for 02, §9.5 rows 02, 06, 09, 10, 14, 16, 27, 51;
renders `design/screens/{02,06,09,10,14,16,27,51}-*.png`.

## Goals / Non-Goals

**Goals:**
- Fix D1 to D6 and D8 with the smallest change in each area, matching the renders.
- Order lists by registration (D8) without changing month attribution or any figure.

**Non-Goals:**
- Pull-to-refresh in 16: neither §6.1 nor §9.5 define it for 16 (the Plan and Movimientos tabs
  have it).
- Push notifications or websockets for membership changes.
- A new `packages/ui` component, a new endpoint or a schema change.
- Test files of any kind.

## API surface

No endpoint is added and no schema changes. `openapi.yaml` only gets updated descriptions of the
ordering, because `Transaction` and `Transfer` already carry `createdAt`:

| Operation | Path | Change |
|---|---|---|
| `listTransactions` | `GET /plans/{planId}/transactions` | description: newest first by `createdAt` (ties by id) |
| `listTransfers` | `GET /plans/{planId}/transfers` | description: newest first by `createdAt` (ties by id) |
| `getEnvelopeDetail` | `GET /plans/{planId}/envelopes/{envelopeId}/detail` | description of `activity`: newest first by `createdAt` |

The back `.contract-ref` moves to the commit of that change; the drift check compares paths and
schemas, which do not change.

## Decisions by defect

### D1 Members stale in 16 (plans, sharing)

Root cause: `PlansController.load()` runs only when the session starts and after the owner's own
actions in 16 (`_manage`, `_leave`). Nothing reloads the plans when 16 is shown, so a member who
joins from another phone never appears until the app restarts. `PlansPage` is a `StatelessWidget`
and has no lifecycle.

Fix:
- `PlansController.refresh()`: like `load()` but silent. It never changes `status` and, on an
  `ApiFailure`, keeps the list that is already there. This matters because `load()` sets `failed`
  and the router redirects to the splash on that status (`router.dart`), which a background refresh
  must never cause.
- `PlansPage` becomes a `StatefulWidget` with a `WidgetsBindingObserver`: it calls `refresh()` in
  `initState`, on `AppLifecycleState.resumed`, and every 10 s with a `Timer.periodic` that is
  cancelled in `dispose`. The timer is the answer to "while the screen is open" (there is no push
  channel); 10 s is cheap (one small `GET /plans`) and the page is not a hot screen.
- After the owner's own actions the existing `plans.load()` calls stay; they already reload.
- No pull-to-refresh (non-goal above). "After accept" in the invitee's phone is already covered by
  the join flow, which reloads the plans before opening the Plan tab.

Alternative considered: reload only on open and resume. Rejected because the owner who stays on 16
waiting for the invited person would still see a stale list, which is the observed defect.

### D3 Income destination hidden (transactions)

Root cause: `new_transaction_page.dart` keeps `_incomePad = true` and the toggle sets
`_incomePad = draft.amount.isEmpty` when switching to income. The destination cards are only built
when `!_padVisible` (to keep the `SaveBar` on screen), so an income opens on the keypad with the
cards hidden, and "directly to an envelope" is undiscoverable. Render 09 shows the cards visible,
the keypad hidden and the amount already set.

Decision: income opens with the keypad hidden (`_incomePad = false` on switching to income), so
the cards are visible on entry, as in render 09. The keypad opens from a tap on the amount capsule
(already wired) or from the calculator button of the `SaveBar` (already wired), and while it is
open the cards stay hidden so the `SaveBar` remains on screen (existing behavior). With nothing
typed, the caption line under the capsule says "Tocá el monto para escribirlo" so the empty state
is not a dead end. Expense (07) keeps its keypad open by default per render 07: `_padVisible` is
still `true` for expenses regardless of `_incomePad`, and the toggle keeps the amount typed.

Alternative considered: keep the keypad open and let the cards scroll below it. Rejected: it hides
the `SaveBar` and the cards below the fold, which is today's problem again.

### D4 Missing "Nuevo grupo" / "Editar grupos" in 02 (envelopes)

Root cause: `plan_page.dart` renders the group sections and stops; the row that §9.1 asks for after
the last group was never added, so groups could only be reached from the `layers` button.

Fix: after the sections, when no search or status filter narrows the list, a `Row` of two
`UiButton` (`white` variant, as 16 does for "Nuevo plan" / "Unirme con código"): "Nuevo grupo"
(plus icon) and "Editar grupos" (layers icon), both pushing `AppRoutes.groups` (32, whose "Nuevo
grupo" field creates in place).

### D2 06 without search (plans)

Root cause: `empty_plan_page.dart` only has the `layers` button in its header; 02 has the lupa
(`_searching`, `UiTextField`) and 06 never got it.

Fix: same pattern as 02: a search `UiIconButton` that toggles a `UiTextField` "Buscar sobre" under
the month switch. With no envelopes there is nothing to filter, so while the field has text the
"Primeros pasos" card is replaced by a card "Ningún sobre coincide con "<text>"." (the empty text
02 already uses). Closing the search clears it.

### D5 51 without "Ver movimientos" (accounts)

Root cause: `archived_accounts_page.dart` draws only `UiAccountRow` with the "Restaurar" chip.

Fix: under each account row, inside the same `UiCard`, a "Ver movimientos" text link with a
chevron (as the render). It sets the account filter on `TransactionsController`
(`filter.withAccount(id, name)`) and goes to 10 (`AppRoutes.transactions`, a shell tab, so
`context.go`). 10 refreshes on open and shows the account chip, removable.

### D6 Truncated texts (ui, accounts)

Root cause: `UiTxRow` fixes the row at 72 px with `maxLines: 1` and an ellipsis on the title and
the subtitle. An income without envelope ("Listo para asignar · Hoy, 17:02") next to its lavender
amount capsule, and the title "Transferencia a Banco Nación" in 14, do not fit, so the day or the
account name is cut ("Hoy, 1…", "Transferencia a Banco …").

Fix, in `packages/ui` `UiTxRow` only (one component, a small PR for the other developer to
review per docs/COLABORACION.md §5): title and subtitle `maxLines: 2`, and the fixed `height: 72`
becomes `minHeight: 72`, so a row that fits keeps exactly the render's height and a long one grows
instead of cutting. No new component, no new token.

### D8 Order by registration (back, transactions, accounts, envelope-goals)

Root cause: `TransactionsService.list` orders by `occurredAt DESC, createdAt DESC, id DESC`,
`TransfersService.list` by `occurredAt DESC, createdAt DESC`, and the envelope detail asks the
transactions list for its activity, so it inherits the order. 14 merges both lists in the client
and sorts by `occurredAt`, and `buildDayGroups` groups by the day of `occurredAt`. A movement
dated three days ago and recorded now therefore lands among old days instead of first under "Hoy".

Fix:
- Back: `orderBy('transaction.createdAt', 'DESC')` then `id DESC` in the transactions list;
  `createdAt DESC` then `id DESC` in the transfers list. Filters, `summary`, month attribution,
  balances, recalculation and the date and time ranges keep using `occurredAt`: only `ORDER BY`
  changes, so no figure moves. No migration: the existing `(plan_id, occurred_at DESC, created_at
  DESC)` index no longer serves the order, but a plan's transaction volume is small and an index on
  `created_at` is a separate optimization if it ever shows up.
- Front: `TransactionData` and `TransferData` carry `createdAt` (already in the generated client).
  `buildDayGroups` takes the instant to group by, and 10, 14 and 22 pass `createdAt`; 14 sorts the
  merged list by `createdAt`. The day is computed in the device's local time zone, as every other
  date in the app.
- Row subtitle: `transactionRow` and the transfer row of 14 prefix the movement's own date ("dom
  27, 09:12", `dayMonthShort`-style label with weekday) only when the day of `occurredAt` differs
  from the day of `createdAt`; otherwise the subtitle is unchanged. One card per row stays.

Alternative considered: keep `occurredAt` order and add a "registered" badge. Rejected: the
stakeholder wants the last recorded movement first, not a different label.

## UI components

All from `packages/ui`: `UiButton`, `UiIconButton`, `UiTextField`, `UiCard`, `UiChoiceCard`,
`UiAmountCapsule`, `UiCalculatorPad`, `UiSaveBar`, `UiPlanRow`, `UiMemberRow`, `UiAccountRow`,
`UiChip`, `UiInfoNote`, `UiTxRow`. The only modified one is `UiTxRow` (D6: line limit and minimum
height); no new component. It is catalogued in Widgetbook already and the story keeps working.

## Risks / Trade-offs

- A 10 s timer in 16 costs one request per tick while the screen is open: accepted, it stops when
  the screen closes or the app is backgrounded (the resume hook refreshes on return).
- Order by registration means editing a movement's date does not move it in the list (its
  `createdAt` never changes). That is the intended meaning of "last recorded first".
- `UiTxRow` rows can now be taller than 72 px when text is long; lists already scroll.
- The 06 search has nothing to filter by definition; it exists because the render and §9.5 have the
  lupa, and the empty answer keeps it coherent.
