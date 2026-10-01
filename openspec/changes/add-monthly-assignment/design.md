# Design

## Context

See proposal.md for the why. The engine (`add-budget-calc-engine`) already derives every month
(`CalculationService.calculateMonth`) and the close of a month (`closeMonth`), and stores
assignments through `AssignmentsService` (`setAssignment`, `setAssignments`, `shiftAssignments`).
`EnvelopesService` (Ruben, `add-envelopes`) builds the plan's `PlanLedger` and the month lines
(`list`, `EnvelopeLineDto.build`) and exports itself for this change. The front already has 02 Plan
del mes in `lib/features/envelopes/plan_page.dart` with the month switch disabled, the `JoinedCard`
"+" muted and no filters; the "+" of 01 and "Asignar a esta meta" of 05 are muted too, all waiting
for this change.

Sources: FR-09, FR-10, FR-11, FR-12, FR-15, FR-16, FR-18, FR-21; PRD-ux-spec.md §5 (states), §6.1,
§8 (`Chip`, `AmountCapsule`, `SaveBar`, `Key`, `EnvelopeRow`, `Toast`), §9.3 (02/04 `JoinedCard`,
25 trigger), §9.5 (02, 03, 04, 25); renders `design/screens/{02,03,04,25,53}-*.png`; canonical
dataset (State B and C).

## Goals / Non-Goals

**Goals:**
- Assign money to an envelope in any month, a month summary, the month close and its confirmation.
- Month navigation, status filters and the future month view in 02/04; screens 03, 53 and 25.
- Wire the muted entry points to 03 (01 "+", 02/04 "+", 05 "Asignar a esta meta").

**Non-Goals:**
- Persisting any derived figure: a close confirmation records only that it was seen (FR-11).
- Editing an assignment to an exact value from 02 (03 adds or takes back an amount; 46 keeps the
  bulk set). Moving money between envelopes stays in 24.
- Test files of any kind.

## API surface

Added to `openapi.yaml` under a new tag `Months` (capability `monthly-assignment`):

| Operation | Path | Role | Request | Responses |
|---|---|---|---|---|
| `getMonthSummary` | `GET /plans/{planId}/months/{month}` | member | — | `200 MonthSummary`, `400`, `401`, `404` |
| `assignToEnvelope` | `POST /plans/{planId}/months/{month}/assignments` | owner, editor | `AssignMoneyRequest` | `200 AssignMoneyResult`, `400`, `401`, `403`, `404` |
| `getMonthClose` | `GET /plans/{planId}/months/{month}/close` | member | — | `200 MonthClose`, `400`, `401`, `404` |
| `confirmMonthClose` | `POST /plans/{planId}/months/{month}/close` | owner, editor | — | `200 MonthClose`, `400`, `401`, `403`, `404`, `409` |

Schemas:
- `MonthSummary { month, currentMonth, isFuture, balanceMinor, availableMinor,
  futureAssignedMinor, readyToAssignMinor, assignedMinor, envelopeCount, overspentCount,
  underfundedCount, fundedCount }`.
- `AssignMoneyRequest { envelopeId, amountMinor }` (integer, not 0); `AssignMoneyResult { month,
  readyToAssignMinor, line: EnvelopeLine }`.
- `MonthClose { fromMonth, toMonth, carried: CloseLine[], deducted: CloseLine[],
  totalDeductedMinor, readyToAssignFromMinor, readyToAssignToMinor, balanceMinor, availableMinor,
  futureAssignedMinor, confirmed }`, `CloseLine { envelopeId, name, amountMinor }` (deducted amounts
  positive). `balanceMinor`, `availableMinor` and `futureAssignedMinor` are the next month's, so
  `balance − available − futureAssigned = readyToAssignTo` is the "Todo cuadra" check of 25.
- Parameter `Month` (path, `YYYY-MM`). `409` on confirm = the month has not ended.

## Backend design

```
src/months/ months.module.ts months.controller.ts months.service.ts dto/month*.dto.ts
src/budget/ calculation.types.ts (MonthClose + next month figures)
            calculation.service.ts (closeMonth fills them)
            entities/budget-month.entity.ts (+ closedAt)
src/database/migrations/<ts>-AddBudgetMonthClosedAt.ts
```

- **Own module `months`.** Depends on `PlansModule` (access), `BudgetModule` and `EnvelopesModule`
  (ledger and lines). It never writes envelope tables; Ruben's modules stay untouched.
- **Assign.** Validates `amountMinor ≠ 0` and that the envelope belongs to the plan (via the month
  list), then `AssignmentsService.shiftAssignments(plan, month, [{envelopeId, delta}])`: the
  database adds the delta in one statement, so two concurrent assignments never lose each other.
  The result re-reads `EnvelopesService.list(plan, month)` and returns that envelope's line.
- **Summary.** `EnvelopesService.list` for the lines and states plus `calculateMonth` on the same
  ledger for balance, available and future figures; counts come from the line states.
- **Close.** `closeMonth(ledger, month)` extended with the next month's balance, available and
  future-assigned figures (the walk already computes them). Names come from the month list.
  `confirmed` = `budget_months.closed_at` is set for the plan and `month`.
- **Confirm.** `409` unless `month < currentMonth(plan.timeZone)`. Upserts the `budget_months` row
  (`INSERT … ON CONFLICT DO NOTHING`) and sets `closed_at = now()` when it is null, so repeating is
  harmless. No figure is stored.
- **Migration.** `ALTER TABLE budget_months ADD closed_at timestamptz NULL`; revert drops it.

## Frontend design

```
lib/features/plan/months_repository.dart   # generated Months API → plain data
lib/features/plan/month_controller.dart    # viewed month, summary, filter, close check
lib/features/plan/plan_filters.dart        # status chips + filtering of the lines
lib/features/plan/future_month_notice.dart # 04 notice
lib/features/plan/assign_page.dart         # 03 + 53 (one page, two states)
lib/features/plan/month_close_page.dart    # 25
lib/features/envelopes/envelopes_controller.dart  # load(month)
lib/features/envelopes/plan_page.dart             # wires the above into 02/04
```

- **Viewed month.** `EnvelopesController` gains `showMonth(String month)`; `load()` keeps the
  viewed month, so 22/24/31 see the same month as 02. `MonthController` loads the summary of that
  month (`currentMonth`, `isFuture`, counts) and owns the selected status filter.
- **02/04.** The month switch calls `showMonth(±1)`. With `isFuture` the page renders the 04 notice,
  "<assigned> asignado" headers and rows with the assigned amount; otherwise the usual 02 rows.
  The filter chips filter `linesOf(group)` by the API's `state` ("Cubiertos" = `funded` with money
  assigned or available).
- **03/53.** Route `/plan/assign?month=&envelopeId=`, pushed on the root navigator. The envelope
  carousel is a `PageView` of cards; the quick chips are the chosen envelope's need (−Available when
  overspent, `goalStatus.missingMinor` when underfunded), 10.000, 20.000 and 50.000. Tapping the
  capsule or the calculator switches to 53, which reuses `amount_expression.dart` (FR-18) with the
  `UiCalculatorPad`. Confirm → `POST …/assignments`, `EnvelopesController.load()`, toast, pop.
- **25.** After the Plan tab loads the current month, `MonthController` asks for the close of the
  previous month; when it is not confirmed and has carried or deducted lines (and the caller can
  write), it pushes `/plan/close/:month`. "Empezar <mes>" confirms, shows "Mes de <mes> abierto"
  and pops; the close button pops without confirming.

## UI components

Existing: `UiMonthSwitch`, `UiJoinedCard`, `UiGroupHeader`, `UiEnvelopeRow`, `UiChip`,
`UiAmountCapsule`, `UiSaveBar`, `UiCalculatorPad`, `UiKey`, `UiPageDots`, `UiIconButton`,
`UiButton`, `UiCard`, `UiInfoNote`, `UiToast`.

Changes in `packages/ui` (stories, review by the other dev, docs/COLABORACION.md §5):
- **`UiChip` (modified)**: optional leading `icon` for the filter chips ("Sobregirados" with
  `warning`, "Falta" with `clock`, "Cubiertos" with `check`).
- **`UiInfoNote` (modified)**: optional trailing action (`actionLabel`, `onAction`), a black pill,
  for the 04 notice ("Hoy").
- **`UiAssignCard` (new, molecule)**: the carousel card of 03: icon circle, percent, name,
  "<available> disponible" and a caption; lavender when selected, white otherwise.
- **`UiCloseRow` (new, molecule)**: a line of 25: envelope name and its outcome, on one line, or
  stacked and red for a deduction.
- **`UiBalanceCheck` (new, molecule)**: the "Todo cuadra" card of 25: title, the equation, the
  chartreuse check and the formula caption.
- **`UiIcons`**: `calendarClock`.

## Decisions

**Adding, not setting.** 03 and 53 say "Asignar $ X" to an envelope that already has money, and
"quedaría en" adds the amount to the Available: the operation is a delta. The engine's facts stay
one row per envelope and month (`shiftAssignments`), so FR-11 is untouched.

**Close confirmation as a flag.** FR-12 is already derived; 25 needs only to know whether the user
has seen it. A nullable `closed_at` on the existing `budget_months` row is the smallest fact that
answers that, and it is plan-wide (any editor starting the month starts it for everyone).

**Separate `months` module.** The endpoints read the envelope module's lines but belong to the
monthly capability; keeping them out of `envelopes` respects module ownership (docs/ROADMAP.md §3).

**Summary instead of widening `EnvelopeList`.** `currentMonth`, `isFuture` and the counts live in a
new response, so Ruben's `listEnvelopes` contract does not change.

## Risks / Trade-offs

- [Two calls per month view (list + summary)] -> both are cheap derivations (< 100 ms, PRD §7);
  they load in parallel.
- [25 for viewers] -> a viewer cannot confirm, so 25 is not opened for them (it would open on every
  visit).
- [Future months show the current Ready to Assign] -> the engine already does it (FR-10); the 04
  notice explains it.

## Migration Plan

`npm run migration:run` adds `budget_months.closed_at`. Rollback: `npm run migration:revert`.
