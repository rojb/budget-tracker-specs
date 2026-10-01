# reports Specification

## Purpose
Reports of a plan over a range of months: spending by envelope, income against expenses and the
evolution of net worth (FR-26), shown in screen 17 Reportes.

## Requirements

### Requirement: Report range
Every report endpoint SHALL accept optional `from` and `to` budget months (`YYYY-MM`) and return one
entry per month of the range, oldest first, including months without movements. Without `to` the
range SHALL end in the current month of the plan's time zone; without `from` it SHALL start five
months before `to`. A `from` after `to`, a range longer than 24 months or a malformed month SHALL
be rejected with `400`.

#### Scenario: Default range
- **WHEN** the current month is 2026-09 and a report is requested without a range
- **THEN** it covers 2026-04 to 2026-09, six entries

#### Scenario: Invalid range
- **WHEN** `from` is 2026-09 and `to` is 2026-04, or the range spans 30 months
- **THEN** the API responds `400`

### Requirement: Spending by envelope
`GET /plans/{planId}/reports/spending` SHALL return, for each month of the range, the money spent
from each envelope (expense portions minus income sent to that envelope, in the plan's time zone),
listing only envelopes with spending above zero, largest first, with the envelope's name and icon,
and the month total as their sum. Deleted transactions and transfers SHALL NOT count.

#### Scenario: September with the canonical data
- **WHEN** the spending report of 2026-09 is requested
- **THEN** the month total is 264.550, Supermercado 132.450 is first and Transporte 51.200 second, and Alquiler is not listed

### Requirement: Income and expenses
`GET /plans/{planId}/reports/income-expense` SHALL return, for each month of the range, the sum of
income transactions and the sum of expense transactions of the plan (any account, deleted
transactions excluded). Transfers between accounts SHALL NOT count as either.

#### Scenario: A month with a salary
- **WHEN** a plan has an income of 850.000 and expenses of 264.550 in 2026-09
- **THEN** 2026-09 reads income 850.000 and expenses 264.550

### Requirement: Net worth evolution
`GET /plans/{planId}/reports/net-worth` SHALL return, for each month of the range, the sum of the
balances of the plan's active accounts at the end of that month: opening balances, transactions
and the active side of transfers up to that month.

#### Scenario: Canonical net worth
- **WHEN** the net worth report of 2026-09 is requested with the canonical data
- **THEN** 2026-09 reads 1.000.000

### Requirement: Reports authorization
Every member of the plan SHALL be able to read the reports. A caller who is not a member SHALL
receive `404`, and a request without a valid token `401`.

#### Scenario: Viewer reads reports
- **WHEN** a viewer requests the spending report
- **THEN** the API responds `200`

### Requirement: Reports screen
Screen 17 Reportes SHALL open from the bar-chart button of 01 and show "Reportes", a calendar button
for the range, the tabs "Gastos", "Ingresos" and "Patrimonio", the selected month's figure with its
label, a bar chart with one bar per month of the range where the selected month is highlighted with
its value, and a detail card. Tapping a bar SHALL select that month.

#### Scenario: Spending of September
- **WHEN** the user opens 17 with September selected on "Gastos"
- **THEN** it shows "$ 264.550", "Gastado en septiembre", six bars from April to September with September highlighted, and "Dónde se fue" with Supermercado "$ 132.450 · 50%" and Transporte "$ 51.200 · 19%"

#### Scenario: Pick another month
- **WHEN** the user taps the August bar
- **THEN** the figure, its label and the detail card show August

#### Scenario: Income tab
- **WHEN** the user taps "Ingresos"
- **THEN** the figure is the month's income ("Ingresó en septiembre"), the bars show income and the card compares income with expenses and says what was left or what was spent beyond income

#### Scenario: Net worth tab
- **WHEN** the user taps "Patrimonio"
- **THEN** the figure is the net worth at the end of the month ("Patrimonio a fin de septiembre"), the bars show its evolution and the card says how much it changed against the previous month

### Requirement: Report range picker
The calendar button SHALL open a sheet with the ranges "Últimos 3 meses", "Últimos 6 meses" and
"Últimos 12 meses", all ending in the current month, with the chosen one marked. Choosing one SHALL
reload the reports in place and select the last month of the range.

#### Scenario: Twelve months
- **WHEN** the user picks "Últimos 12 meses"
- **THEN** the chart shows twelve bars ending in the current month

### Requirement: Empty reports
When the selected month has no spending, the "Gastos" detail card SHALL say "No hubo gastos en
<month>." instead of an empty list.

#### Scenario: Month without movements
- **WHEN** the selected month has no expenses
- **THEN** the figure is "$ 0" and the card says there were no expenses that month
