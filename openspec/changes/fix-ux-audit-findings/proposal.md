# Proposal

## Why

The user is starting to use the app against production. A UX audit of 2026-11-06 on a real device
(reports in `odd/ux-audit/`) found friction in the daily loop (logging an expense takes 6 to 7 taps
instead of the 5 of the KR3 target, Inicio shows stale numbers, a move of money gives no feedback) and
visual defects (a clipped save bar, an inconsistent save bar, clipped filter chips, no text scaling
support). None of them is a data bug; all of them make the app uncomfortable to use every day. This
change fixes the findings that need no new product decision. Animations are a separate change
(`add-motion-system`, RRG-85) that builds on these screens.

## What Changes

Flows (audit report `ux-report-flows.md`):

- F-04: when the user picks a payee that has no suggested envelope, the Sobre row of 07 is prefilled
  with the envelope of that payee's latest single-portion expense. The explicit `suggestedEnvelopeId`
  of the payee still wins, and an envelope chosen by hand is never overridden. No API change.
- F-05: Inicio (01) gets pull to refresh, and the app refetches envelopes, accounts and movements when
  it returns to the foreground after a minute or more, so Ready to Assign is not stale.
- F-10: after a move of money (24) the toast says what moved ("Movido $ 10.000 a Salidas") instead of
  a generic "Guardado". No undo (see Open questions).
- F-02: on 46, an over-assignment shows the excess in the danger color, with a sentence that says what
  to do, and the "Listo para asignar" figure of the card follows what is typed. "Listo" still works.
- F-08: the split button of the `SaveBar` is announced as "Dividir pago" (not "Calculadora"). The
  income keypad behavior is unchanged (see Open questions).
- F-06: errors of 07 and 09 use a reserved message slot above the `SaveBar` so the bar does not jump;
  24 keeps its quick amounts in fixed slots so they do not shift after choosing the destination.
- F-07: the status filters of 02/04 count every envelope: a "Sin asignar · N" chip holds the empty
  envelopes that no other chip counted.
- F-03: on 31, "Fecha límite" is marked as required, the preselected amount looks like a suggestion
  until confirmed, and the form pins its `SaveBar`.

Visual (audit report `ux-report-visual.md`):

- V-01: 31 and 23 pin the `SaveBar` above the safe area (`Expanded` list plus a fixed bar) so it is
  never clipped.
- V-02: `UiSaveBar` centers itself with the same margin and bottom inset on every screen.
- V-03: chip rows end with trailing padding and an edge fade (new `UiChipRow`).
- V-04: on 22 "Disponible" is the emphasized figure and the three figures fit large numbers.
- V-05: the `GoalCard` glass panel and its subtitle are legible over any photo.
- V-06: the move row of 22 keeps the height of a `TxRow` (one-line title with ellipsis).
- V-07: the quick amounts of 24 use fixed slots.
- V-08: the lists of the tabs end with a bottom fade above the `NavCluster`.
- V-11: the leading button of the `SaveBar` takes its own accessible name.
- V-12: the bar chart of 17 shows months without data as a baseline tick, not as grey pills.
- Text scaling: fixed-height rows and figures of 01, 22, 24 and 31 survive a text scale of 1.3 and
  2.0 without clipping.

Not changed: the PRD requirements and the API contract (`openapi.yaml`); PRD-ux-spec.md §8 only gains
one inventory line for the new `UiChipRow`. No back-end work. No animation.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `ui-design-system`: adds SaveBar placement and accessible names, chip rows that end visibly,
  goal card legibility over photos, tab lists ending above the nav, and text scaling.
- `transactions`: "New movement screen" (payee fallback envelope, reserved error slot, split button
  name).
- `monthly-assignment`: "Status filters in the plan view" (the "Sin asignar" chip).
- `envelopes`: "New envelope screen" (pinned bar, required date, suggested amount) and "Assign your
  money screen" (over-assign warning).
- `envelope-goals`: "Move money screen" (feedback toast, fixed quick amounts) and "Envelope detail
  screen" (emphasized Disponible, move row height).
- `plans`: adds data freshness (Inicio pull to refresh, refetch on resume).
- `reports`: adds the chart's months without data.

## Impact

- Repos touched: `budget-tracker-specs` (specs only) and `budget-tracker-front` (`packages/ui`,
  `widgetbook/`, `lib/features/`). No `budget-tracker-back` work and no `openapi.yaml` change:
  F-04 reads the existing `listTransactions` filter `payeeId`.
- `packages/ui` changes (`UiSaveBar`, new `UiChipRow`, `UiGoalCard`, `UiBarChart`) are shared
  components: each goes in its own small PR with its Widgetbook story and is reviewed by the other
  developer after merge, per docs/COLABORACION.md §5.
- Out of scope: F-01 registration-day grouping (user decision RRG-57 D8), move rows of a deleted
  envelope (RRG-59 design), auto-learning payee envelopes, undo of a move, every animation (RRG-85),
  and the findings not listed above (F-09, F-11 to F-20, V-09, V-10 beyond 31, V-13 to V-15).
- Depends on: `add-envelope-move-history` (archived), `add-monthly-assignment`, `add-envelope-goals`
  (archived).
- Verification: manual. `flutter analyze` in the app, `packages/ui`, `widgetbook/` and `api_client`,
  Widgetbook against `design/screens/NN-*.png`, and the device through `safe-adb.sh` on the `.uxcheck`
  package against the local back. No test files.
- Size forecast: about 980 authored changed lines of code in total, above the 400-line advisory
  budget per task or slice, so the work is delivered as chained PRs (see design.md).

## Open questions

1. F-04: is "the envelope of the payee's latest expense" an acceptable implicit suggestion, or should
   the payee's `suggestedEnvelopeId` be learned on save (spec change of `payees`, needs an API write)?
2. F-10: is a plain confirmation toast enough, or is undo of a move wanted (needs a new endpoint or a
   reverse move that adds two history rows)?
3. F-08: keep the income keypad hidden on entry (current spec, "Income screen") or open it as in
   expense mode (audit recommendation)?
4. F-07: a new "Sin asignar" chip, or count the empty envelopes inside "Falta"?
5. Text scaling: no cap (scrolling and fitting everywhere) or a cap of 1.3 for the whole app?
6. F-02 copy and header: confirm "Te pasaste $ X. Quitá dinero de algún sobre o seguí y lo ajustás
   después." and the live "Listo para asignar" figure on 46.
7. V-02: the audit asked to drop the end check of the `SaveBar` or make the whole bar tappable; that
   contradicts the swipe-to-confirm spec, so it is kept. Confirm.

## Metadata

- Owner: Ruben
- Repos touched: budget-tracker-specs, budget-tracker-front
- FRs covered: FR-04, FR-05, FR-06, FR-07, FR-08, FR-09, FR-15, FR-16, FR-19, FR-21, FR-23, FR-24, FR-25
- Screens: 01, 02, 03, 04, 07, 09, 10, 13, 14, 17, 20, 22, 23, 24, 31, 46
- Depends on: add-envelope-move-history, add-monthly-assignment, add-envelope-goals
- Size: M
- Linear: [RRG-84](https://linear.app/rgonaut/issue/RRG-84)
