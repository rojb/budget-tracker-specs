# Tasks

## 1. [specs]

- [ ] 1.1 Update `openapi.yaml`: tag `Months`; parameter `Month`; schemas `MonthSummary`, `AssignMoneyRequest`, `AssignMoneyResult`, `CloseLine`, `MonthClose`; operations `getMonthSummary`, `assignToEnvelope`, `getMonthClose`, `confirmMonthClose`. Verify `npx @redocly/cli lint openapi.yaml` reports no errors. Contract PR needs approval from both developers (docs/COLABORACION.md §4).

## 2. [back]

- [ ] 2.1 Add the `budget_months.closed_at` migration and entity column, and extend `MonthClose`/`closeMonth` with the next month's balance, available and future-assigned figures. Verify migration run/revert/run and `npm run calc:kr1`.
- [ ] 2.2 Add the `months` module: `MonthsService`/`MonthsController` with the summary, assign (delta through `shiftAssignments`), close and confirm (409 before the month ends, idempotent). Verify with curl on the canonical data: summary of 2026-09 (1.000.000 / 931.800 / 20.000 / 48.200, 1 overspent), 6.200 to Transporte → Available 0 and RTA 42.000, 20.000 to Regalos for a future month, amount 0 or 10.5 → 400, bad month → 400, foreign envelope → 404, viewer → 403, close of the previous month (carried, deducted, check figures), confirm → `confirmed` true and same figures, confirm the current month → 409.
- [ ] 2.3 Update the back README (Spanish) and bump `.contract-ref`. Verify lint, build and drift clean.

## 3. [front]

- [ ] 3.1 `packages/ui`: `UiChip` leading icon, `UiInfoNote` action, new `UiAssignCard`, `UiCloseRow`, `UiBalanceCheck` and the icon `calendarClock`, with stories. Verify `flutter analyze` in `packages/ui` and `widgetbook/` (other dev reviews).
- [ ] 3.2 Regenerate `packages/api_client` (own commit). Verify `flutter analyze` in `packages/api_client`.
- [ ] 3.3 Add the months repository and `MonthController`, the viewed month in `EnvelopesController`, and wire 02/04: month switch, status filter chips, future month notice and rows. Verify `flutter analyze` and compare with `design/screens/02-plan-del-mes.png` and `04-plan-mes-futuro.png`.
- [ ] 3.4 Add 03/53 Asignar dinero (carousel, month and quick chips, calculator, SaveBar) and wire it from the "+" of 01/02/04 and "Asignar a esta meta" of 05. Verify `flutter analyze` and compare with `design/screens/03-asignar-dinero.png` and `53-asignar-monto-propio.png`.
- [ ] 3.5 Add 25 Cierre de mes and its automatic opening; update the front README. Verify `flutter analyze`, `flutter build apk --debug` and compare with `design/screens/25-cierre-de-mes.png`.

## 4. Verification

- [ ] 4.1 Manual verification checklist. Swagger UI/Prism vs. `openapi.yaml` for `getMonthSummary`, `assignToEnvelope`, `getMonthClose` and `confirmMonthClose` and their errors; drift clean; lint clean; `openspec validate add-monthly-assignment --strict` passes. Back lint/build/migration, `npm run calc:kr1`. Front analyze in app, `packages/ui`, `widgetbook/`, `packages/api_client`; apk debug. Widgetbook vs. `design/screens/02-*.png`, `03-*.png`, `53-*.png`, `04-*.png`, `25-*.png`. App against the real back: 25 opens for the previous month → Empezar → 02 → filters → › to a future month (04) → "+" → 03 → Nov, Regalos, 20.000 → 04 shows it → Hoy → "+" → 53 with 15.000 → 02 shows the new figures. No test files anywhere.
