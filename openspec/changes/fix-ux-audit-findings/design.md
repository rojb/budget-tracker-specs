# Design

## Context

See proposal.md for the why. Every cause below was checked in `budget-tracker-front` (main) before
writing it; the audit reports looked at part of the screens, and three of its claims did not hold:

- V-05 says the goal card has no scrim. It has one (`UiGoalCard`, gradient `ink` 0 to 185 alpha from
  40% down); what fails is the glass panel (`ink` at 90 alpha, about 35%), too light for white text on
  a bright photo.
- V-08 says content is cut by a white band. The shell uses `bottomNavigationBar`, so lists already end
  above the nav; the defect is the hard edge, not hidden rows.
- V-02 says the end check of the `SaveBar` is a ghost control. It is the target of the swipe
  (PRD-ux-spec §8), so it stays.

Sources: `odd/ux-audit/ux-report-flows.md` and `ux-report-visual.md`; PRD-ux-spec.md §6, §6.1, §8,
§9; specs `transactions`, `envelopes`, `envelope-goals`, `monthly-assignment`, `ui-design-system`,
`plans`, `reports`; docs/COLABORACION.md §3 and §5.

## Goals / Non-Goals

**Goals:**
- Remove the taps and surprises of the daily loop without changing a rule of the product.
- Make the visual defects of the audit go away with the smallest changes to shared components.
- Keep the change reviewable: shared `packages/ui` work first and separate.

**Non-Goals:**
- Any API, database or `openapi.yaml` change; any back-end work.
- Animations (RRG-85), registration-day grouping (RRG-57 D8), move rows of deleted envelopes (RRG-59),
  learning payee envelopes, undo of a move, time zone display (F-09), the findings not named in the
  proposal.
- Test files of any kind.

## Endpoints

None added or modified. F-04 uses the existing `listTransactions`
(`GET /plans/{planId}/transactions`, `openapi.yaml`) with its `payeeId` filter and a small
`pageSize`, newest first, which the api_client already exposes. F-05 and F-10 reuse
`listEnvelopes`, `listAccounts`, `listTransactions` and `moveMoney` as they are.

## UI components

From `packages/ui` (PRD-ux-spec §8), used as they are: `UiCard`, `UiFieldRow`, `UiChip`,
`UiAmountCapsule`, `UiFormMessage`, `UiJoinedCard`, `UiTxRow`, `UiEnvelopeRow`, `UiToast`
(`showUiToast`/`showSaved` in `lib/features/common/feedback.dart`).

Modified in `packages/ui` (each is a shared component: its own small PR, with its Widgetbook story,
reviewed after merge by the other developer, COLABORACION §5):

| Component | Change | Why |
|---|---|---|
| `UiSaveBar` | Centers itself (`Align`), new `leadingSemanticLabel` (default "Calculadora"), 48 dp hit area for the leading button | V-02, V-11, F-08 |
| `UiGoalCard` | Glass panel alpha 90 to about 150, subtitle with the text shadow of the other texts | V-05 |
| `UiTxRow` | New `titleMaxLines` (default 2, so no screen changes); the move row of 22 passes 1 | V-06 |
| `UiBarChart` | Month without data (`UiBarChartEntry.hasData`) draws a baseline tick, not a 12 dp pill; semantic label carries the value | V-12 |

New in `packages/ui` (needs PRD-ux-spec §8 inventory line "ChipRow", flagged for review):

| Component | Purpose |
|---|---|
| `UiChipRow` | Horizontal scroller for `UiChip`s with 20 dp trailing padding and a right-edge fade while more chips are out of view. Used by `PlanFilterChips` today; any later chip row |

Not in `packages/ui`, by design: the 22 figures card (a page-local widget in
`envelope_detail_page.dart`, as today), the 24 quick amounts and the message slot of 07/09, because
they are screen compositions; `FadedScroll` moves from `features/envelopes/` to `features/common/`
and is reused (it is already the fade of 35 and 46).

## Decisions

### D1. F-04: prefill from the payee's latest expense, client side
The Sobre row of 07 is empty after picking a payee because `suggestedEnvelopeId` is only set by hand
(payees spec) and nothing learns it. Options: (a) fall back to the envelope of the payee's latest
expense, read with the existing list endpoint; (b) write `suggestedEnvelopeId` when a transaction is
saved (changes the payees spec and writes to a record the user did not edit); (c) show the plan's most
used envelope.

Chosen (a), the audit's option 1 and the only one that changes no rule. After `showPayeePicker`
returns a `PayeeChosen` with an `id` and no usable suggestion, and the user has not chosen an envelope
by hand, `NewTransactionPage` asks `TransactionsController.lastExpenseEnvelopeOf(payeeId)`. It lists
`pageSize: 5` for that payee, newest first, and returns the envelope of the first expense that has one
portion on an envelope that still exists in `EnvelopesController`; split expenses and incomes are
skipped. The answer is applied through a new `TransactionDraft.suggestEnvelope(id)` that sets
`envelopeId` without setting `envelopeByHand`, so a later pick of another payee can still replace it
and a hand pick always wins. The call is `await`ed after the picker closes; if it fails or is slow,
the row stays "Elegir" (it never blocks saving). The editor 12 is not touched (`suggestionExists:
false` stays).

Cost: one extra small request when picking a payee without a suggestion. Trade-off: a payee used in
different envelopes is prefilled with the latest one, which is a guess; the row stays editable.

### D2. F-05: refresh in the shell, not per page
Inicio has no `RefreshIndicator`; pages hold their own controllers, so a per-page lifecycle observer
would be repeated four times. `AppShell` becomes a `StatefulWidget` with a `WidgetsBindingObserver`
that records when the app goes to the background and, on `resumed`, calls `envelopes.load()`,
`accounts.load()` and `transactions.refresh()` if it was away 60 s or more. The controllers already
keep the previous data while loading and flag `failed` only when nothing was loaded, so a failed
reload keeps the figures. `HomePage` wraps its `ListView` in a `RefreshIndicator` whose `onRefresh`
awaits the same three loads (it needs `AccountsController` and `TransactionsController`, injected
like `envelopes`). `EnvelopesController.load` keeps `_viewedMonth`, so a refresh does not move the
plan view. Tab switching does not refetch (not asked by the scope, and it would hit the API on every
tap).

### D3. F-10: a specific toast, no undo
The 24 flow already calls `showSaved(context, 'Guardado')`. It becomes `showUiToast` with the Success
variant, title "Movido $ 10.000 a Salidas" and detail "Desde Supermercado". PRD-ux-spec §8 reserves
the Neutral toast with "Deshacer" for revertible actions, but the API has no undo for a move, and
moving back by a second `moveMoney` adds two more history rows (RRG-59). Undo is left as an open
question; the toast does not promise it.

### D4. F-08: label only; the income keypad stays hidden
The audit asks to open the keypad in Ingreso. The `transactions` spec ("Income screen") says the
opposite on purpose: the "¿A dónde va?" cards are visible on entry and the keypad opens from the
amount or the calculator button, because with the pad open the cards push the `SaveBar` off screen.
That is a user decision recorded in the spec, so it is kept. What is fixed is the accessible name:
`UiSaveBar` gets `leadingSemanticLabel`; 07 passes "Dividir pago" in Gasto and "Calculadora" in
Ingreso. The caption "Tocá el monto para escribirlo" stays.

### D5. F-06: reserved message slot, no shifting
In 07/09 the `UiFormMessage` is added and removed between the keypad and the `SaveBar`, which moves
the bar by about 60 px. The message goes into a `SizedBox` of the message height (min 24 dp, grows
for two lines) always present above the bar. The same idea applies to the `UiChip`s of 24: the chip
set depends on `_cover`, which only exists once a destination is chosen, so the row jumps. The chips
go in a `Row` of `Expanded` slots (three slots: cover, 10.000, 20.000; the cover slot shows an empty
placeholder of the same size until it exists). 18, 19 and 30 have the same pattern but are outside
the scope (only 07, 09 and 24 were in the listed findings).

### D6. F-07: a fifth chip holds the empty envelopes
`matchesFilter` has four row variants and three state chips, so `empty` belongs to none
(`goal_texts.dart` `rowVariant`). Options: (a) a "Sin asignar · N" chip with its own filter; (b)
count empty inside "Falta". Chosen (a): "Falta" means underfunded (a goal needs money), and an
envelope with no goal and nothing assigned is not that. `StatusFilter` gains `unassigned` and
`emptyFilterText` its sentence ("Todos los sobres tienen dinero o un objetivo este mes."). The five
chips scroll in the new `UiChipRow`; shortening labels was rejected to keep the PRD copy.

### D7. F-02 and F-03: the screens that already hold the data
46 computes `remaining` already; the top card shows `_total` (the Ready to Assign before typing).
The card shows `remaining` instead and takes the `danger` color when negative; the note takes the
`danger` color and the longer sentence. The button stays "Listo" (spec). 31 moves the `UiSaveBar` out
of the `ListView` into `SafeArea > Column > [Expanded(ListView), bar]`, the pattern of
`new_plan_page.dart`, and so does `envelope_edit_page.dart` (23). `GoalFields` marks "Fecha límite"
"Obligatoria" while empty and draws the default amount muted until the user touches it (`GoalDraft`
already knows the kind and the amount; a `bool amountTouched` is the only new state). "+ Nueva meta"
keeps opening with "Con fecha" (spec scenario).

### D8. V-02: placement, not interaction
`UiSaveBar` keeps its 340 dp maximum and its swipe/tap behavior, and wraps its content in `Align(
alignment: center)` so a `ListView` or a `Column` places it the same way. The per-page `Center`
wrappers (07) and padding wrappers (20) are removed so the position comes from one place. Pinned
forms (31, 23, 20, 24, 07) add `SafeArea` plus a bottom padding of 16 dp. The audit's "make the
whole bar tappable, drop the second check" is not done: PRD-ux-spec §8 defines the swipe handle and
its end check.

### D9. Text scaling without a cap
Fixed heights are the risk. The repo has no `textScaler` handling. Changes: the three figures of 22
become `Expanded` columns with `FittedBox(scaleDown)`; `UiFieldRow` (fixed at 48 dp today) and `UiChip` use a minimum height;
the `UiSaveBar` label already ellipsizes; amounts in `UiJoinedCard` already scale. The app does not
clamp the scale (a cap would defeat the setting for the users who need it). Verification: Widgetbook
stories for 22, 24 and 31 at scales 1.3 and 2.0 (a `MediaQuery` wrapper in the use case, no device
setting is changed).

### D10. V-04, V-06, V-07, V-08, V-12 in short
- V-04: the card of 22 becomes `Disponible` 34 sp ink in the middle, `Asignado` and `Gastado` 24 sp
  with `inkMuted` on `Gastado` kept; 12 dp gutters; all in `FittedBox`.
- V-06: `UiTxRow` title allows 2 lines today (`maxLines: 2`), which is what makes the move row taller;
  `envelopeMoveRow` passes `titleMaxLines: 1`.
- V-07: see D5.
- V-08: `FadedScroll` wraps the `ListView` of 01, 02, 10, 13 and 17; bottom padding of the lists is
  raised to 32 dp so the last row clears the fade.
- V-12: `UiBarChartEntry` gains `hasData` (default true); `ReportsController` marks months with no
  movement. A no-data entry draws a 2 dp tick on the baseline.

## Delivery

The forecast is about 980 authored changed lines (tasks.md has the table), above the 400-line budget.
Strategy: chained PRs of `feature-branch-chain` or `stacked-to-main` (the user chooses; ask-on-risk).
Proposed slices, in dependency order:

1. `packages/ui` (tasks 2.1 to 2.4, about 275 lines, with stories). Reviewed by the other developer
   after merge.
2. Daily-loop flows A (tasks 2.5 to 2.8, about 245 lines) and B (tasks 2.9 to 2.12, about 250).
3. Visual and scaling work (tasks 2.13 to 2.16, about 205 lines; 2.16 also touches `UiFieldRow` and
   `UiChip`, so it is flagged for the same review).

Code repos get one commit per task with `(RRG-84, task N.N)`.

## Risks / Trade-offs

- The F-04 fallback is a guess shown as a prefill. It is visible in the Sobre row and editable;
  it is never sent unless the user saves.
- Resume refresh reloads three controllers at once; on a slow connection that is three requests when
  the app opens. Mitigated by the 60 s threshold and by keeping the old figures during the load.
- `UiSaveBar` placement touches every screen that shows it (07, 08, 09, 12, 20, 23, 24, 28, 29, 31,
  41, 42, 03, 53). Each needs a look on the device or in Widgetbook after task 1.1; the new
  `Align` is a no-op where the bar was already centered at 340.
- A fifth chip departs from PRD-ux-spec §9.3, which removed the status chips from 02 as low value,
  while the `monthly-assignment` spec and the app already have four. The drift is pre-existing and is
  decided in the Open questions of the proposal.

## Verification

Manual and per task. `flutter analyze` in the app, `packages/ui`, `widgetbook/` and `api_client`;
Widgetbook against `design/screens/NN-*.png` for the shared components and the pinned forms; on the
device (`safe-adb.sh`, `.uxcheck` package, local back) the flows F-04, F-05, F-10, F-02, F-06, F-07
and the screens 31, 22, 24, 17, 01. No test files.
