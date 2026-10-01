# Design

## Context

See proposal.md for the why. Every figure a report needs is already derivable from the read side
that other changes built: `TransactionLedgerService.spending` (net outflow per envelope and month,
in the plan's time zone, deleted transactions excluded), `AccountsService.ledgerBalanceMovements`
(changes to the sum of active balances per month: opening balances, transactions and transfers)
and the `transactions` table for income and expenses per month. The front has the bar-chart button
of 01 disabled, waiting for this change.

Sources: FR-26; PRD-ux-spec.md §7 (Moneda: symbol + amount in axes, totals and tooltips), §8, §9.5
(17: from 01, range filters in place, tabs change in place); render `design/screens/17-reportes.png`;
canonical dataset (State B: "Gastado en septiembre" 264.550; Supermercado 132.450 · 50 %, Transporte
51.200 · 19 %).

## Goals / Non-Goals

**Goals:**
- Three read-only report endpoints over a month range.
- Screen 17 with the three tabs, a bar chart per tab, month selection and a range picker.

**Non-Goals:**
- Arbitrary date ranges inside a month (reports are per budget month) or exporting.
- A chart library: the chart is one bar series, built as a `packages/ui` widget (see Decisions).
- Test files of any kind.

## API surface

Added to `openapi.yaml`, new tag `Reports` (capability `reports`), all `member`:

| Operation | Path | Query | Responses |
|---|---|---|---|
| `getSpendingReport` | `GET /plans/{planId}/reports/spending` | `from`, `to` | `200 SpendingReport`, `400`, `401`, `404` |
| `getIncomeExpenseReport` | `GET /plans/{planId}/reports/income-expense` | `from`, `to` | `200 IncomeExpenseReport`, `400`, `401`, `404` |
| `getNetWorthReport` | `GET /plans/{planId}/reports/net-worth` | `from`, `to` | `200 NetWorthReport`, `400`, `401`, `404` |

Schemas: `SpendingReport { from, to, months: SpendingMonth[] }`, `SpendingMonth { month,
totalMinor, envelopes: EnvelopeSpending[] }`, `EnvelopeSpending { envelopeId, name, icon,
amountMinor }`; `IncomeExpenseReport { from, to, months: [{ month, incomeMinor, expenseMinor }] }`;
`NetWorthReport { from, to, months: [{ month, balanceMinor }] }`. Parameters `ReportFrom`,
`ReportTo` (query, `MonthKey`).

## Backend design

```
src/reports/ reports.module.ts reports.controller.ts reports.service.ts dto/report*.dto.ts
```

- **Range.** `to` defaults to `currentMonth(plan.timeZone)`, `from` to `to − 5`; `from > to` or
  more than 24 months → `400`. The service builds the month list with `monthRange` and fills
  missing months with zero.
- **Spending.** `TransactionLedgerService.spending` rows inside the range, grouped by month; rows
  ≤ 0 are left out (a month where refunds beat expenses spends nothing); names and icons from the
  plan's envelopes (`EnvelopesService.list`).
- **Income and expenses.** One grouped SQL read over `transactions` (`deleted_at IS NULL`, month by
  `occurred_at AT TIME ZONE plans.time_zone`, `SUM ... FILTER (WHERE direction = ...)`), the same
  month expression the ledger uses. Transfers live in `account_transfers`, so they never count.
- **Net worth.** `ledgerBalanceMovements` summed cumulatively over every month up to `to`, then cut
  to the range, so months before `from` still feed the balance.
- Module imports `PlansModule`, `AccountsModule`, `TransactionLedgerModule`, `EnvelopesModule`; it
  writes nothing and has no migration.

## Frontend design

```
lib/features/reports/reports_repository.dart   # generated Reports API → plain data
lib/features/reports/reports_controller.dart   # range, tab, selected month, the three reports
lib/features/reports/reports_page.dart         # 17
lib/features/reports/range_sheet.dart          # range picker
```

- Route `/home/reports`, a child of the 01 branch, so the `NavCluster` stays with Inicio selected.
  01's bar-chart button pushes it.
- The controller loads the three reports in parallel for the range (default the last 6 months);
  the tab and the selected month only change what is drawn. Bars are the month totals of the tab
  (spent, income, net worth); the selected month's value floats over its bar as a short amount
  ("$ 265k").
- "Gastos": "Dónde se fue" lists the month's envelopes as `UiGoalRow` (name, "$ X · N%", stripes =
  share of the month). "Ingresos": the month's income and expenses as `UiGoalRow`s plus "Te sobraron
  $ X" / "Gastaste $ X más de lo que ingresó". "Patrimonio": the change against the previous month.

## UI components

Existing: `UiIconButton`, `UiToggle` (three labels), `UiCard`, `UiGoalRow`, `UiInfoNote`,
`UiSheet`, `UiChoiceCard`, `UiNavCluster`.

New in `packages/ui` (story, review by the other dev, docs/COLABORACION.md §5):
- **`UiBarChart` (new, organism)**: one bar per month on a white card, rounded bars in `soft`, the
  selected one in chartreuse stripes with a black value pill above it and its label in bold; each
  bar is a tap target with a semantic label ("Septiembre, $ 264.550"). Single series: no legend.

## Decisions

**No chart library.** The only chart is a single bar series styled with the design tokens (soft
bars, chartreuse stripes, ink pill); a library would bring its own styling to override and a
dependency to keep, for less code than the widget itself. Kept in `packages/ui` like every other
component, with its Widgetbook story.

**Three endpoints.** One per question of FR-26, each cheap and independently cacheable; the screen
loads them in parallel.

**Budget months, not dates.** Every other figure of the app is per budget month in the plan's time
zone; reports use the same attribution so "Gastado en septiembre" equals the plan's September.

## Risks / Trade-offs

- [Archived accounts leave net worth] -> net worth follows the plan total, which counts only active
  accounts (FR-03); documented in the spec.
- [Long ranges] -> capped at 24 months; each report is one grouped query plus in-memory sums.

## Migration Plan

None (read-only).
