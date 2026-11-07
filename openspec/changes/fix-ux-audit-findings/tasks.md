# Tasks

Line forecasts count authored changed lines (additions plus deletions, generated files excluded) and
are a planning heuristic, not a cap. Device checks use `safe-adb.sh` on the side-by-side `.uxcheck`
package against the local back; the production app and account on the phone are not touched. Tasks
2.1 to 2.4 change shared `packages/ui` components: each goes in its own small PR with its Widgetbook
story and is flagged for review by the other developer after merge (docs/COLABORACION.md §5).

## 1. [specs]

- [x] 1.1 Add the `ChipRow` line (horizontal scroller of chips with trailing padding and an edge
  fade, used by 02/04) to the component inventory of PRD-ux-spec.md §8, so the new `UiChipRow` of task
  2.2 is in the inventory the screens draw from. Forecast 3 lines. Verify the row is in §8 and
  `openspec validate fix-ux-audit-findings --strict` passes. (specs d3f2812; row `ChipRow` added to the §8 inventory table; `openspec validate fix-ux-audit-findings --strict` valid)

## 2. [front]

### Shared components (`packages/ui`, review by the other developer)

- [x] 2.1 `UiSaveBar`: wrap in `Align(center)` so it has one position everywhere, add
  `leadingSemanticLabel` (default "Calculadora") and a 48 dp hit area for the leading button, and
  update its Widgetbook use cases (default, disabled, split label). Forecast 65 lines. Verify
  `flutter analyze` in `packages/ui` and `widgetbook/`; in Widgetbook the bar is centered at the same
  width in a full-width `Column` and in a `ListView`, next to `design/screens/07`, `20`, `24`, `31`;
  the swipe, tap and disabled behaviors are unchanged; flagged for post-merge review. (front efa14e0; `flutter analyze` clean in `packages/ui`, `widgetbook/` and the app; `UiSaveBar` wraps in `Align(center)` (max width 340 kept) and `leadingSemanticLabel` (default "Calculadora") is added; the leading circle is already 68 dp so the 48 dp hit area needed no extra code; Widgetbook use cases: default, disabled, split label (07, "Dividir pago") and placement in a `Column` and a `ListView`; swipe, tap and disabled code paths untouched; side by side with `design/screens/07, 20, 24, 31` NOT run in this slice (visual device and Widgetbook comparison happen in the later slices); flagged for post-merge review)
- [x] 2.2 New `UiChipRow` (horizontal scroller, 20 dp trailing padding, right-edge fade while more
  chips are out of view), exported from `ui.dart`, with its Widgetbook use cases (fits, overflows),
  
  Forecast 85 lines. Verify `flutter analyze` in `packages/ui` and `widgetbook/`; the Widgetbook case
  with five chips on a 393 dp frame shows the fade and the last chip fully visible at the end of the
  scroll, next to `design/screens/02-plan-del-mes.png`; flagged for post-merge review. (front 25efcc9; `flutter analyze` clean in `packages/ui`, `widgetbook/` and the app; `UiChipRow` (trailing padding 20, right-edge fade while more chips are out of view) exported from `ui.dart`, with use cases `fits` and `overflows (02/04)` (five chips on 393 dp); the visual check of the fade and last chip against `design/screens/02-plan-del-mes.png` NOT run in this slice; flagged for post-merge review)
- [x] 2.3 `UiGoalCard`: glass panel alpha from 90 to about 150 and the subtitle with the text shadow;
  `UiTxRow`: new `titleMaxLines` (default 2). Update both Widgetbook stories (a bright photo case and
  a one-line-title case). Forecast 50 lines. Verify `flutter analyze` in `packages/ui` and
  `widgetbook/`; the goal card story with a bright photo and the long name "Viaje a Bariloche con la
  familia" is readable next to `design/screens/01-inicio.png`, and the existing `TxRow` stories are
  pixel-equal to before; flagged for post-merge review. (front 8e00ae0; `flutter analyze` clean in `packages/ui`, `widgetbook/` and the app; glass panel alpha 90 to 150 and the subtitle with the photo text shadow; `UiTxRow.titleMaxLines` (default 2, so existing rows are unchanged by construction); stories added: GoalCard bright photo with "Viaje a Bariloche con la familia" (a near-white in-memory image, the repo has no photo assets) and TxRow one-line title; side by side with `design/screens/01-inicio.png` NOT run in this slice; flagged for post-merge review)
- [x] 2.4 `UiBarChart`: `UiBarChartEntry.hasData` (default true) draws a 2 dp baseline tick for a
  month without data and the value goes into the semantic label; Widgetbook use case with four empty
  months. Forecast 75 lines. Verify `flutter analyze` in `packages/ui` and `widgetbook/`; the story
  next to `design/screens/17-reportes.png` shows ticks for empty months and the highlighted bar with
  its value; flagged for post-merge review. (front 7afc101; `flutter analyze` clean in `packages/ui`, `widgetbook/` and the app; `UiBarChartEntry.hasData` (default true) draws a 2 dp baseline tick, the caller's `semanticLabel` carries the value; Widgetbook use case with four empty months; side by side with `design/screens/17-reportes.png` NOT run in this slice; flagged for post-merge review)

### Daily-loop flows (screens)

- [x] 2.5 Adopt the `SaveBar` placement: 31 and 23 get `SafeArea > Column > [Expanded(ListView), bar]`
  with a 16 dp bottom padding (as `new_plan_page.dart`), and the `Center`/padding wrappers around the
  bar in 07, 20 and 24 are removed. Forecast 90 lines. Verify `flutter analyze` in the app; on the
  device 31 opened from "+ Nueva meta" shows the Foto row, "Fecha límite" and the whole `SaveBar`
  above the gesture bar, next to `design/screens/31-nuevo-sobre.png`; 07, 20, 24 and 23 show the bar at
  the same width and position; the other bar screens (03, 08, 09, 12, 28, 29, 41, 42, 53) still look
  right. (front 4fa0d46; `flutter analyze` clean in the app; 31 and 23 are now `SafeArea > Column > [Expanded(ListView), Padding(20,8,20,16) > UiSaveBar]`; the `Center` around the bar in 07 is removed; 20 already used that Padding pattern and 24 had no wrapper around the bar, so neither needed a change; the other bar screens were not touched; device and side-by-side checks NOT run in this slice (no adb: the phone may be in use) and PENDING for the one pass after slice D; the verify items on the device are left open, not observed (pending: 31 from "+ Nueva meta" shows Foto, Fecha límite and the whole bar; 07, 20, 24, 23 same width and position; 03, 08, 09, 12, 28, 29, 41, 42, 53 unchanged))
- [x] 2.6 31 (F-03, V-10): "Fecha límite" reads "Obligatoria" while empty, the preselected amount
  is drawn muted until the user picks or keys one (`amountTouched` in the form state), and the date
  error stays "Elegí una fecha límite.". Forecast 50 lines. Verify `flutter analyze` in the app; on the
  device "+ Nueva meta" shows the muted 50.000 and the required date, saving without a date shows the
  error and creates nothing, a date and a quick amount create the goal. (front cf91b02; `flutter analyze` clean in the app; `GoalDraft.amountTouched` (false for a new goal's preselected amount, true after a pick or key and for a saved goal), the capsule at 50% opacity and no quick chip selected while untouched, "Fecha límite" reads "Obligatoria" while empty, the date error text is unchanged; device and side-by-side checks NOT run in this slice (no adb: the phone may be in use) and PENDING for the one pass after slice D; the verify items on the device are left open, not observed (pending: muted 50.000 and required date on the device, save without a date shows the error and creates nothing, date plus a quick amount creates the goal))
- [x] 2.7 07/09 (F-06, F-08): reserved message slot above the `SaveBar`, and `leadingSemanticLabel`
  "Dividir pago" in Gasto and "Calculadora" in Ingreso. The income keypad behavior is unchanged.
  Forecast 45 lines. Verify `flutter analyze` in the app; on the device saving with amount 0 shows
  "Ingresá un monto mayor a cero." and the bar does not move (compare two screenshots), TalkBack or
  the semantics tree reads "Dividir pago" in Gasto, and 09 still opens with the cards and no keypad,
  next to `design/screens/07-nuevo-movimiento.png` and `09-registrar-ingreso.png`. (front 381a687; `flutter analyze` clean in the app; the error of 07/09 sits in an always-present slot (min 24 dp) above the `SaveBar`, and the bar gets `leadingSemanticLabel` "Dividir pago" in Gasto and "Calculadora" in Ingreso; the income keypad logic is untouched (08 `split_page.dart` still uses the default label, outside this task); device and side-by-side checks NOT run in this slice (no adb: the phone may be in use) and PENDING for the one pass after slice D; the verify items on the device are left open, not observed (pending: two screenshots with amount 0 showing the bar does not move, semantics tree, 09 opens with cards and no keypad))
- [x] 2.8 07 (F-04): `TransactionsController.lastExpenseEnvelopeOf(payeeId)` (lists 5 transactions
  of the payee through the existing endpoint and returns the envelope of the first single-portion
  expense on an envelope that exists), `TransactionDraft.suggestEnvelope`, and the call after the
  payee picker closes when the payee has no usable suggestion and the envelope was not chosen by hand.
  Forecast 60 lines. Verify `flutter analyze` in the app; on the device against the local back: a
  payee whose latest expense was on Supermercado prefills Sobre, a payee with a suggested envelope
  keeps its own, a payee whose 5 newest transactions have no single-portion expense (only split
  expenses or incomes) stays "Elegir" and a split latest expense is skipped in favor of the latest
  single-portion one, an envelope chosen by hand
  survives a new payee pick, and a payee created by typing its name leaves "Elegir"; count the taps
  from "+" to saved (target 5). (front 67a9217; `flutter analyze` clean in the app, `packages/ui` and `widgetbook/`; `TransactionsController.lastExpenseEnvelopeOf` lists 5 transactions of the payee and returns the envelope of the first single-portion expense on an existing envelope (split expenses and incomes are skipped, as design D1 says; coordinator decision: a split latest expense is skipped and the prefill comes from the latest single-portion one), `TransactionDraft.suggestEnvelope` does not set `envelopeByHand`, the call runs only when the picked payee has an id, no usable suggestion and the envelope was not chosen by hand, and a late answer is dropped if the payee changed; device and side-by-side checks NOT run in this slice (no adb: the phone may be in use) and PENDING for the one pass after slice D; the verify items on the device are left open, not observed (pending: the payee cases of the verify text and the tap count, target 5))
- [x] 2.9 Data freshness (F-05): `RefreshIndicator` on `HomePage` (envelopes, accounts, movements),
  and `AppShell` as a `StatefulWidget` with a `WidgetsBindingObserver` that reloads the same three
  controllers on resume after 60 s or more away. Forecast 95 lines. Verify `flutter analyze` in the
  app; on the device change Ready to Assign through the local API (curl as a member), pull down on 01
  and see the new figure; background the app for over a minute, change data through the API, return
  and see 01, 02, 10 and 13 updated; return after 10 s and see no request in the back log; return
  offline and see the old figures stay; the viewed month of 02 is kept. (front e51a5e5; `flutter analyze` clean in the app; `HomePage` wraps its `ListView` in a `RefreshIndicator` (always scrollable) that awaits `envelopes.load()`, `accounts.load()` and `transactions.refresh()`; `AppShell` is a `StatefulWidget` with a `WidgetsBindingObserver` that records `paused`/`hidden` (not `inactive`) and on `resumed` reloads the same three controllers only if the app was away 60 s or more, the router passes the three controllers to the shell and to 01; the controllers already keep their data on a failed reload and `EnvelopesController.load` keeps the viewed month; device and side-by-side checks NOT run in this slice (no adb: the phone may be in use) and PENDING for the one pass after slice D; the verify items on the device are left open, not observed (pending: pull on 01 shows a changed Ready to Assign, a minute in the background reloads 01/02/10/13, 10 s away makes no request, offline keeps the old figures, month of 02 kept))
- [x] 2.10 24 (F-10, V-07, F-06): the toast after a move reads "Movido $ 10.000 a Salidas" with
  "Desde Supermercado" (Success variant) instead of "Guardado", and the quick amounts sit in three
  fixed equal slots, the cover slot reserved from the start. Forecast 55 lines. Verify `flutter
  analyze` in the app; on the device a 10.000 move shows the toast and the chips do not move after
  choosing the destination (two screenshots), the 409 case still says "Ya no hay tanto disponible",
  next to `design/screens/24-mover-dinero.png`. (front c466100; `flutter analyze` clean in the app; the move shows `showSaved` (Success) "Movido $ X a <destino>" with detail "Desde <origen>", names read before the reload, the 409 branch is unchanged; the quick amounts are a `Row` of three `Expanded` slots (cover, 10.000, 20.000; an empty slot of chip height when there is no cover), so choosing the destination moves nothing; a cover amount of 7+ digits is not shrunk (`UiChip` has no scale-down); device and side-by-side checks NOT run in this slice (no adb: the phone may be in use) and PENDING for the one pass after slice D; the verify items on the device are left open, not observed (pending: toast on a 10.000 move, two screenshots of the chips, the 409 message))
- [x] 2.11 46 (F-02): the top card shows what remains to assign and turns `danger` red with a minus
  sign when over; the note turns `danger` red with the warning icon and reads "Te pasaste $ X. Quitá
  dinero de algún sobre o seguí y lo ajustás después."; "Listo" keeps working. Forecast 45 lines.
  Verify `flutter analyze` in the app; on the device typing 180.000 and 400.000 on a 500.000 balance
  shows "−$ 80.000" and the red note, lowering an amount returns both to normal, "Listo" creates the
  plan with a negative Ready to Assign, next to `design/screens/46-asigna-tu-dinero.png`. (front 5722f7e; `flutter analyze` clean in the app; the top card of 46 shows `_remaining` and turns `danger` red with the minus sign (from `formatMoney`) when negative, the note turns `danger` red with the warning icon and reads "Te pasaste $ X. Quitá dinero de algún sobre o seguí y lo ajustás después.", the label and "Listo" are unchanged; device and side-by-side checks NOT run in this slice (no adb: the phone may be in use) and PENDING for the one pass after slice D; the verify items on the device are left open, not observed (pending: 180.000 and 400.000 on a 500.000 balance shows −$ 80.000 and the red note, lowering returns both to normal, "Listo" creates the plan with a negative Ready to Assign))
- [x] 2.12 02/04 (F-07, V-03): `StatusFilter.unassigned` ("Sin asignar · N"), its empty-state
  sentence, and `PlanFilterChips` rendered with `UiChipRow`. Forecast 55 lines. Verify `flutter
  analyze` in the app; on the device with 14 envelopes of which 2 are empty the four state counts add
  up to 14, "Sin asignar · 2" lists the two empty envelopes, the last chip is fully reachable with the
  fade visible, next to `design/screens/02-plan-del-mes.png` and `04-plan-mes-futuro.png`. (front 005bf68; `flutter analyze` clean in the app, `packages/ui` and `widgetbook/`; `StatusFilter.unassigned` matches the Empty variant (no goal, nothing assigned, nothing available), so with "Cubiertos" excluding Empty the four state chips add up to all envelopes, its empty-state sentence is "Todos los sobres tienen dinero o un objetivo este mes.", `PlanFilterChips` renders five chips in `UiChipRow` spanning the full screen width through an `OverflowBox` with a 20 dp leading spacer (the page pads its content by 20 dp); the row clips at the screen edge so the fade lands there, which is not yet seen on a screen; device and side-by-side checks NOT run in this slice (no adb: the phone may be in use) and PENDING for the one pass after slice D; the verify items on the device are left open, not observed (pending: 14 envelopes with 2 empty add up, "Sin asignar · 2" lists them, last chip reachable with the fade, 02 and 04 next to the renders))

### Visual and scaling work (screens)

- [ ] 2.13 22 (V-04, V-06): the figures card with Disponible emphasized (34 sp, `ink`, middle),
  Asignado and Gastado secondary, `FittedBox(scaleDown)` per figure and 12 dp gutters; the move row
  passes `titleMaxLines: 1`. Forecast 65 lines. Verify `flutter analyze` in the app; on the device
  22 of Supermercado shows the new hierarchy and a move to an envelope with a long name keeps the row
  as tall as an expense row, next to `design/screens/22-detalle-de-sobre.png`.
- [ ] 2.14 Tab lists (V-08): move `FadedScroll` to `lib/features/common/`, wrap the lists of 01, 02,
  10, 13 and 17 and raise their bottom padding to 32 dp. Forecast 40 lines. Verify `flutter analyze`
  in the app; on the device the last row of each list scrolls fully above the fade and the nav, next to
  `design/screens/10-movimientos.png`, `13-cuentas.png` and `14-detalle-de-cuenta.png`.
- [ ] 2.15 17 (V-12): `ReportsController` marks months without movements and the page passes
  `hasData`. Forecast 30 lines. Verify `flutter analyze` in the app; on the device 17 with a six-month
  range shows ticks for the empty months and bars for the others, tapping a bar still selects it, next
  to `design/screens/17-reportes.png`.
- [ ] 2.16 Text scaling sweep: `UiFieldRow` and `UiChip` use a minimum height instead of a fixed one
  (this touches two shared `packages/ui` components, flagged for post-merge review), plus the
  figures that could overflow in 01, 24 and 31; Widgetbook use cases for 22, 24 and 31 at text
  scales 1.3 and 2.0. Forecast 70 lines. Verify `flutter analyze` in the app, `packages/ui` and
  `widgetbook/`; in Widgetbook the three screens at 1.3 and 2.0 show no clipped text or overflow
  stripe and a reachable `SaveBar`; at scale 1.0 they are pixel-equal to before.

## 3. Verification

- [ ] 3.1 Manual verification checklist. `openspec validate fix-ux-audit-findings --strict`; `flutter
  analyze` in the app, `packages/ui`, `widgetbook/` and `api_client`; no endpoint is added or changed,
  so no Swagger UI, Prism or `openapi.yaml` check applies and `.contract-ref` does not move; Widgetbook
  against `design/screens/NN-*.png` for each screen touched: 01-inicio, 02-plan-del-mes, 03-asignar-
  dinero, 04-plan-mes-futuro, 07-nuevo-movimiento, 09-registrar-ingreso, 10-movimientos,
  13-cuentas, 14-detalle-de-cuenta, 17-reportes, 20-nuevo-plan, 22-detalle-de-sobre, 23-editar-sobre,
  24-mover-dinero, 31-nuevo-sobre and 46-asigna-tu-dinero; on the device through `safe-adb.sh` on the
  `.uxcheck` package against the local back, the daily loop end to end ("+", amount, payee, saved, in
  5 taps with a known payee), a move with its toast, an over-assigned onboarding, a stale Inicio
  refreshed, and the filters adding up; no test files anywhere.

## Forecast

| Group | Tasks | Authored changed lines |
|---|---|---|
| Inventory line in PRD-ux-spec.md | 1.1 | 3 |
| Shared components (`packages/ui`) | 2.1 to 2.4 | 275 |
| Daily-loop flows | 2.5 to 2.12 | 495 |
| Visual and scaling work | 2.13 to 2.16 | 205 |
| Total | 17 tasks | 978 |

Suggested chained PRs (each under or near the 400-line budget): `packages/ui` 275 (2.1 to 2.4),
flows A 245 (2.5 to 2.8), flows B 250 (2.9 to 2.12), visual 205 (2.13 to 2.16). Task 2.16 touches two
shared components and is flagged for review like 2.1 to 2.4. The specs repo adds only task 1.1 and the
archive commit.
