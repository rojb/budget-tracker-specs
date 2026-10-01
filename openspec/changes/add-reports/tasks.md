# Tasks

## 1. [specs]

- [x] 1.1 Update `openapi.yaml`: tag `Reports`; parameters `ReportFrom`, `ReportTo`; schemas `SpendingReport`, `SpendingMonth`, `EnvelopeSpending`, `IncomeExpenseReport`, `IncomeExpenseMonth`, `NetWorthReport`, `NetWorthMonth`; operations `getSpendingReport`, `getIncomeExpenseReport`, `getNetWorthReport`. Verify `npx @redocly/cli lint openapi.yaml` reports no errors. Contract PR needs approval from both developers (docs/COLABORACION.md §4). (specs 4ccc33c; lint 0 errors, the same 3 warnings as main; two-dev PR approval pending, at merge)

## 2. [back]

- [x] 2.1 Add the `reports` module: range validation and the spending, income-expense and net-worth reports. Verify with curl on the canonical data: default range of six months, September spending 264.550 (Supermercado first, no Alquiler), September income and expenses, September net worth 1.000.000, months without movements at 0, `from > to` / 30 months / bad month → 400, viewer → 200, non-member → 404, no token → 401. (back 4acb297; 16/16 cases OK with 2026-10 as the current month: default 2026-05..2026-10, September 264.550 with Supermercado 132.450 and Transporte 51.200 first and no Alquiler, empty months at 0, September income 894.550 and expenses 264.550, net worth August 0 / September 1.000.000 / October 1.000.000 and a one-month range still counts earlier movements, from > to / 30 months / 2026-13 / unknown query → 400, 24 months 200, viewer 200, non-member 404, no token 401)
- [x] 2.2 Update the back README (Spanish) and bump `.contract-ref`. Verify lint, build and drift clean. (back cbf893f; `.contract-ref` → 4ccc33c; lint and build clean; drift exit 0)

## 3. [front]

- [x] 3.1 `packages/ui`: add `UiBarChart` with its story. Verify `flutter analyze` in `packages/ui` and `widgetbook/` (other dev reviews). (front 24113f5, fix 55c282e after the 12-month check; analyze clean in both; review by Ruben pending)
- [x] 3.2 Regenerate `packages/api_client` (own commit). Verify `flutter analyze` in `packages/api_client`. (front c056160; `ReportsApi` and 7 models; analyze clean)
- [x] 3.3 Add the reports repository, controller, screen 17 with its three tabs and the range sheet, and open it from 01; update the front README. Verify `flutter analyze`, `flutter build apk --debug` and compare with `design/screens/17-reportes.png`. (front 67bd21e; 01 → 17; September on Gastos matches the render: $ 264.550, "Gastado en septiembre", six bars May–October with September striped and "$ 265k", Supermercado "$ 132.450 · 50%", Transporte "$ 51.200 · 19%"; October shows "No hubo gastos en octubre."; Ingresos $ 894.550 against $ 264.550; Patrimonio $ 1.000.000 "Subió $ 1.000.000 respecto de agosto"; 12 months shows twelve readable labels; apk debug built)

## 4. Verification

- [x] 4.1 Manual verification checklist. Swagger UI/Prism vs. `openapi.yaml` for `getSpendingReport`, `getIncomeExpenseReport` and `getNetWorthReport` and their errors; drift clean; lint clean; `openspec validate add-reports --strict` passes. Front analyze in app, `packages/ui`, `widgetbook/`, `packages/api_client`; apk debug. Widgetbook vs. `design/screens/17-reportes.png`. App against the real back: 01 → Reportes → Gastos (September) → tap another bar → Ingresos → Patrimonio → range 12 months. No test files anywhere. (Verified 2026-10-01 against the real API on a local database with the canonical September data: request matrix of 2.1, drift exit 0, lint/build; analyze ×4 clean; apk debug built; local web build driven headless at 390×844: 01 → Reportes → Gastos → September bar → Ingresos → Patrimonio → range 12 months. No test files. Pending: BarChart review by Ruben, two-dev contract approval, on-device check)
