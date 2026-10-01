## MODIFIED Requirements

### Requirement: Income screen
Screen 09 Registrar ingreso SHALL be the income mode of 07: the toggle on Ingreso, the amount, the
note under it, the Beneficiario, Cuenta, Fecha y hora and Descripción rows and, under "¿A dónde
va?", two choices: "Listo para asignar" ("Recomendado. Lo repartís después.", chosen by default)
and "Directo a un sobre" ("Para reintegros de un gasto puntual."), which opens 36 to pick the
envelope and then shows its name. The two choices SHALL be visible as soon as the screen opens,
with the keypad hidden; the keypad SHALL open from a tap on the amount or from the calculator
button of the `SaveBar` (which shows and hides it), and expense mode (07) SHALL keep opening with
the keypad. The `SaveBar` SHALL read "Guardar ingreso". Confirming records the income to Ready to
Assign or to the chosen envelope.

#### Scenario: Income to Ready to Assign
- **WHEN** the user enters 850.000 from Estudio Pérez SRL into Banco Nación, keeps "Listo para asignar" and confirms
- **THEN** the income is recorded without an envelope, the toast "Movimiento guardado" shows and Ready to Assign rises by 850.000

#### Scenario: Directly to an envelope
- **WHEN** the user chooses "Directo a un sobre" and picks Farmacia
- **THEN** the card shows Farmacia and confirming raises Farmacia's Available

#### Scenario: Direct to an envelope without choosing
- **WHEN** the user chooses "Directo a un sobre", closes 36 without a pick and confirms
- **THEN** nothing is saved and the form says "Elegí un sobre."

#### Scenario: Choices visible on entry
- **WHEN** the user switches the toggle of 07 to Ingreso
- **THEN** 09 shows "¿A dónde va?" with both choices and no keypad, and tapping the amount or the calculator button opens the keypad

#### Scenario: Expense keeps the keypad
- **WHEN** the user opens 07 in Gasto mode
- **THEN** the keypad is open and the amount can be keyed at once

### Requirement: List movements
`GET /plans/{planId}/transactions` SHALL return the plan's transactions that have not been deleted,
newest first by registration instant (`createdAt`, ties by id) — the transaction recorded last comes
first, whatever date it carries —, paginated with `page` and `pageSize`. `occurredAt` SHALL keep
deciding the month a transaction belongs to, the balances, the recalculation and the date and time
filters; only the order of the list follows registration. It SHALL accept these optional filters,
which combine with AND:

- `accountId`, `payeeId`: only the transactions of that account or that payee;
- `envelopeId`: only the transactions with at least one portion on that envelope;
- `direction` (`expense` or `income`);
- `from` and `to` (dates `YYYY-MM-DD`, both inclusive): only the transactions whose local date in the
  plan's time zone is within the range; `from` after `to` SHALL respond `400`;
- `timeFrom` and `timeTo` (`HH:mm`, both inclusive to the minute): only the transactions whose local
  time of day in the plan's time zone is within the range, on any date; when `timeFrom` is after
  `timeTo` the range crosses midnight (22:00 to 02:00), and either one alone leaves the other end of
  the day open;
- `q` (1 to 60 characters after trimming): only the transactions whose payee name, description or the
  name of any portion's envelope contains `q`, without letter case.

Each item SHALL carry its id, direction, account id and name, amount, `occurredAt`, payee id and name
(when any, including a deleted payee), description (when any), `splits` (each with its envelope id
and name when it has an envelope, and its amount) and creation instant. The response SHALL also carry
a `summary` with `outflowMinor` (the sum of the amounts of the matching expenses) and `inflowMinor`
(the sum of the matching incomes) over every matching transaction, not only the returned page, so
that it always equals the sum of the rows the filters select. A transaction counts in the summary
with its whole amount, also when only one of its portions matches `envelopeId`.

#### Scenario: Newest first
- **WHEN** the plan has a transaction recorded at 19:10 today, then one recorded at 21:45 today and one recorded earlier for Saturday 26
- **THEN** the list returns them by registration, the one recorded at 21:45 first, with `total: 3`

#### Scenario: Backdated movement recorded last
- **WHEN** a member records now a transaction dated three days ago, after others dated today
- **THEN** the list returns it first, its `occurredAt` still three days ago, and the month figures count it in the month of that date

#### Scenario: Pagination
- **WHEN** the plan has 45 transactions and a member requests `page=3&pageSize=20`
- **THEN** the response has `page: 3`, 5 items and `total: 45`

#### Scenario: Only one account
- **WHEN** the list is requested with the id of Mercado Pago
- **THEN** only the transactions recorded on Mercado Pago are returned

#### Scenario: Names survive deletions
- **WHEN** the payee of a past transaction is deleted
- **THEN** the transaction still shows the payee's name, and when its envelope is deleted the split keeps its amount with no envelope

#### Scenario: Date range
- **WHEN** the list is requested with `from=2026-09-01&to=2026-09-30` in a Buenos Aires plan and a transaction occurred at `2026-10-01T02:30:00Z` (30 September, 23:30 local)
- **THEN** that transaction is returned and one dated 1 October local time is not

#### Scenario: Time-of-day range
- **WHEN** the list is requested with `timeFrom=18:00&timeTo=23:59`
- **THEN** a movement at 21:45 and one at 18:10 are returned on any date, and one at 14:32 is not

#### Scenario: Range across midnight
- **WHEN** the list is requested with `timeFrom=22:00&timeTo=02:00`
- **THEN** movements at 23:30 and at 01:15 are returned and one at 12:00 is not

#### Scenario: Payee, envelope and direction
- **WHEN** the list is requested with the payee Farmacity, then with the envelope Farmacia, then with `direction=income`
- **THEN** each response holds only the transactions of that payee, those with a portion on Farmacia (a split of Farmacia and Supermercado included) and the incomes

#### Scenario: Filters combine
- **WHEN** the list is requested with `envelopeId` of Comida afuera, `direction=expense` and `timeFrom=18:00`
- **THEN** only the expenses on Comida afuera at 18:00 or later are returned

#### Scenario: Text search
- **WHEN** the list is requested with `q=far`
- **THEN** the transactions of the payee "Farmacity" and those on the envelope "Farmacia" or described "farmacia de turno" are returned, without letter case

#### Scenario: Summary of the filter
- **WHEN** the filtered rows are expenses of 9.800 and 24.300 and an income of 3.500
- **THEN** the summary is `outflowMinor` 34.100 and `inflowMinor` 3.500, also when the page holds only some of them

#### Scenario: Summary of an empty result
- **WHEN** no transaction matches the filters
- **THEN** `items` is empty, `total` is 0 and the summary is 0 and 0

#### Scenario: Invalid filter
- **WHEN** `from` is after `to`, a date or time has another format, `direction` is unknown or `q` is blank
- **THEN** the API responds `400`

#### Scenario: Deleted transactions are not listed
- **WHEN** a transaction was deleted
- **THEN** it is not returned, does not count in `total` or in the summary

### Requirement: Movements screen
Screen 10 Movimientos SHALL open from the Movimientos tab and list the plan's transactions
newest first by registration, grouped by the day they were registered ("Hoy · martes 29", "Ayer ·
lunes 28", then "Sábado 26"), each as a `TxRow`: the payee name (or the description when there is
no payee, or "Sin beneficiario"), the subtitle "<envelope> · <time>" ("<N> sobres · <time>" for a
split, "Listo para asignar · <time>" for an income without envelope), the account name under the
amount, the amount with `−` for an expense and a lavender capsule with `+` for an income, and the
icon of the envelope (a split icon for a split, an income arrow for every income). When the day of
the movement's own date differs from the day it was registered, the time in the subtitle SHALL be
preceded by that date ("Supermercado · dom 27, 09:12"); otherwise the subtitle is unchanged. A title
or subtitle that does not fit on one line SHALL continue on a second line and the row SHALL grow,
instead of cutting the date or the time with an ellipsis. Its header SHALL show, next to the title, a
search `IconButton` that reveals a text field in place (collapsed again by an `x`) and filters the
list by `q` as the user types, and a filters `IconButton` that opens screen 11, lavender while a
filter is active. Each active filter SHALL show as a removable chip under the header (a date range
"1 – 30 sep", a time range "18:00 – 23:59", and one chip per payee, envelope, account and direction).
While any filter or search is active a summary card SHALL show "Salió en la franja" with the total
that left and "Entró" with the total that came in, taken from the `summary` of the response. Tapping
a row SHALL open screen 12 for that movement. More rows SHALL load as the list is scrolled. With no
transactions it SHALL show "Todavía no hay movimientos"; with filters that select nothing, "No hay
movimientos con estos filtros" and a "Limpiar filtros" action; while loading, at least three
skeleton rows; on failure, a retry.

#### Scenario: Grouped by day
- **WHEN** the plan has movements registered today, yesterday and on Saturday 26
- **THEN** 10 shows them under "Hoy · martes 29", "Ayer · lunes 28" and "Sábado 26", the last registered first

#### Scenario: Backdated movement under today
- **WHEN** the user records today an expense dated three days ago (Sunday 27, 09:12) on Supermercado
- **THEN** 10 lists it first under "Hoy · martes 29" with the subtitle "Supermercado · dom 27, 09:12"

#### Scenario: Split row
- **WHEN** a 24.300 expense at Farmacity is split across two envelopes at 18:10
- **THEN** its row reads "Farmacity", "2 sobres · 18:10" and "−$ 24.300"

#### Scenario: Income row
- **WHEN** an income of 3.500 into Farmacia at 19:10 on Banco Nación was recorded
- **THEN** its row shows the income arrow icon, "+$ 3.500" in a lavender capsule and "Banco Nación" under it

#### Scenario: Long subtitle
- **WHEN** an income without envelope has a long subtitle that does not fit beside its amount
- **THEN** the subtitle continues on a second line and the date and time stay readable

#### Scenario: Empty plan
- **WHEN** the plan has no transactions
- **THEN** 10 shows "Todavía no hay movimientos"

#### Scenario: Scrolling loads more
- **WHEN** the plan has more transactions than one page and the user scrolls to the end
- **THEN** the next page is loaded and appended without repeating rows

#### Scenario: Active filters
- **WHEN** a date range 1–30 September and a time range 18:00–23:59 are applied
- **THEN** 10 shows the chips "1 – 30 sep" and "18:00 – 23:59", the filters button is lavender and the summary card shows "Salió en la franja" and "Entró" with the totals of those rows

#### Scenario: Remove a chip
- **WHEN** the user taps the `x` of the time-range chip
- **THEN** that filter is removed, the list and the summary reload with the rest and the other chip stays

#### Scenario: Search in place
- **WHEN** the user taps the search button and types "rap"
- **THEN** a field appears in the header, only the movements that match "rap" remain and the summary card shows their totals

#### Scenario: Filters without results
- **WHEN** the filters select no movement
- **THEN** 10 shows "No hay movimientos con estos filtros" and "Limpiar filtros", which removes every filter

#### Scenario: Open a movement
- **WHEN** the user taps a row
- **THEN** screen 12 opens with that movement
