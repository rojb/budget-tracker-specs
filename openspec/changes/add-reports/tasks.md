# Tasks

## 1. [specs]

- [ ] 1.1 Update `openapi.yaml`: tag `Reports`; parameters `ReportFrom`, `ReportTo`; schemas `SpendingReport`, `SpendingMonth`, `EnvelopeSpending`, `IncomeExpenseReport`, `IncomeExpenseMonth`, `NetWorthReport`, `NetWorthMonth`; operations `getSpendingReport`, `getIncomeExpenseReport`, `getNetWorthReport`. Verify `npx @redocly/cli lint openapi.yaml` reports no errors. Contract PR needs approval from both developers (docs/COLABORACION.md §4).

## 2. [back]

- [ ] 2.1 Add the `reports` module: range validation and the spending, income-expense and net-worth reports. Verify with curl on the canonical data: default range of six months, September spending 264.550 (Supermercado first, no Alquiler), September income and expenses, September net worth 1.000.000, months without movements at 0, `from > to` / 30 months / bad month → 400, viewer → 200, non-member → 404, no token → 401.
- [ ] 2.2 Update the back README (Spanish) and bump `.contract-ref`. Verify lint, build and drift clean.

## 3. [front]

- [ ] 3.1 `packages/ui`: add `UiBarChart` with its story. Verify `flutter analyze` in `packages/ui` and `widgetbook/` (other dev reviews).
- [ ] 3.2 Regenerate `packages/api_client` (own commit). Verify `flutter analyze` in `packages/api_client`.
- [ ] 3.3 Add the reports repository, controller, screen 17 with its three tabs and the range sheet, and open it from 01; update the front README. Verify `flutter analyze`, `flutter build apk --debug` and compare with `design/screens/17-reportes.png`.

## 4. Verification

- [ ] 4.1 Manual verification checklist. Swagger UI/Prism vs. `openapi.yaml` for `getSpendingReport`, `getIncomeExpenseReport` and `getNetWorthReport` and their errors; drift clean; lint clean; `openspec validate add-reports --strict` passes. Front analyze in app, `packages/ui`, `widgetbook/`, `packages/api_client`; apk debug. Widgetbook vs. `design/screens/17-reportes.png`. App against the real back: 01 → Reportes → Gastos (September) → tap another bar → Ingresos → Patrimonio → range 12 months. No test files anywhere.
