# transactions Specification

## Purpose
TBD - created by archiving change add-transactions. Update Purpose after archive.

## Requirements

### Requirement: Create a transaction
An owner or editor SHALL be able to record an expense or an income with `POST
/plans/{planId}/transactions`, sending `direction` (`expense` or `income`), `accountId`,
`amountMinor` (a positive integer in the plan currency's minor units), `occurredAt` (instant with
offset) and optionally `payeeId` or `payeeName`, `description` (up to 120 characters after trimming)
and the destination: `envelopeId` or, for an expense only, `splits`. An expense SHALL name its
envelope with `envelopeId` or divide the amount with `splits`; an income MAY name an `envelopeId`,
and without one it goes to Ready to Assign. The response SHALL be `201` with the transaction, which
carries its portions in `splits` (one portion for a simple expense or income).

#### Scenario: Canonical expense
- **WHEN** Sofía records an expense of 18.450 at Coto on Supermercado, from Banco Nación, today at 14:32, described "Compra semanal"
- **THEN** the API responds `201` with `direction: expense`, `amountMinor: 18450` and one split of 18.450 on Supermercado

#### Scenario: Income to Ready to Assign
- **WHEN** Sofía records an income of 850.000 from "Estudio Pérez SRL" into Banco Nación without an envelope
- **THEN** the API responds `201` with `direction: income` and one split of 850.000 without an envelope

#### Scenario: Income to an envelope
- **WHEN** Sofía records an income of 3.500 into Farmacia with `envelopeId` of Farmacia
- **THEN** the API responds `201` and the split names Farmacia

#### Scenario: Invalid amount or direction
- **WHEN** a member sends an amount of 0, −5 or 10.5, or a direction other than `expense` or `income`
- **THEN** the API responds `400` with a validation error and records nothing

#### Scenario: Expense without a destination
- **WHEN** a member records an expense with neither `envelopeId` nor `splits`
- **THEN** the API responds `400` and records nothing

#### Scenario: Envelope and splits together
- **WHEN** a member sends both `envelopeId` and `splits`, or sends `splits` on an income
- **THEN** the API responds `400` and records nothing

### Requirement: Split payments
An expense MAY be divided with `splits`: at least two portions, each with an `envelopeId` and a
positive integer `amountMinor`. The portions SHALL add up exactly to the transaction's
`amountMinor`; otherwise the API SHALL respond `400` and record nothing. Each portion SHALL count as
activity of its own envelope.

#### Scenario: Canonical split
- **WHEN** a member records an expense of 24.300 at Farmacity split into Farmacia 15.800, Supermercado 6.000 and Comida afuera 2.500
- **THEN** the API responds `201` with three splits that add up to 24.300

#### Scenario: Sum off by one
- **WHEN** the portions add up to 24.299 against an amount of 24.300
- **THEN** the API responds `400` and records nothing

#### Scenario: Single portion
- **WHEN** a member sends `splits` with one portion
- **THEN** the API responds `400`

#### Scenario: Envelope of another plan in a portion
- **WHEN** one portion names an envelope of another plan
- **THEN** the API responds `404` and records nothing

### Requirement: Account, payee and envelope references
Every transaction SHALL have an account of the same plan, which MUST be active (`404` for an account
of another plan, `409` for an archived one). A payee is optional and SHALL be given either as
`payeeId` (an active payee of the plan, `404` otherwise) or as `payeeName` (1 to 60 characters
after trimming): the active payee with that name, compared without letter case, is reused, and if
there is none a payee with that name is created. Sending both SHALL respond `400`. Every envelope
named, in `envelopeId` or in a portion, SHALL belong to the plan (`404` otherwise).

#### Scenario: New payee on first use
- **WHEN** a member records an expense with `payeeName` "Verdulería" and the plan has no such payee
- **THEN** the transaction is recorded, the payee "Verdulería" now exists and its `transactionCount` is 1

#### Scenario: Existing payee by name
- **WHEN** a member sends `payeeName` "coto" and the plan has the active payee "Coto"
- **THEN** the transaction references "Coto" and no second payee is created

#### Scenario: Both payee fields
- **WHEN** a member sends `payeeId` and `payeeName` together
- **THEN** the API responds `400`

#### Scenario: Deleted payee
- **WHEN** a member sends the `payeeId` of a deleted payee
- **THEN** the API responds `404` and records nothing

#### Scenario: Archived account
- **WHEN** a member records a transaction on an archived account
- **THEN** the API responds `409` and records nothing

#### Scenario: Account of another plan
- **WHEN** a member sends an `accountId` of another plan
- **THEN** the API responds `404` and records nothing

#### Scenario: Payee count
- **WHEN** two transactions reference "Coto"
- **THEN** the payee's `transactionCount` is 2

### Requirement: Date, time and budget month
A transaction's `occurredAt` SHALL be stored with its time and used to order movements, newest
first, and to attribute it to a budget month by the plan's time zone (capability
`budget-calc-engine`). Dates in the past, the present or the future SHALL be accepted.

#### Scenario: Late on the last day of the month
- **WHEN** a plan in `America/Argentina/Buenos_Aires` records an expense with `occurredAt` `2026-10-01T02:30:00Z` (30 September, 23:30 local)
- **THEN** the expense counts in the activity of 2026-09, not of 2026-10

#### Scenario: Offset input
- **WHEN** a member sends `occurredAt` `2026-09-30T09:00:00-03:00`
- **THEN** the transaction is returned with the same instant, in ISO-8601 with offset

#### Scenario: Missing offset
- **WHEN** a member sends `occurredAt` `2026-09-30T09:00:00` without an offset
- **THEN** the API responds `400`

### Requirement: Effect on envelopes and Ready to Assign
Transactions SHALL be facts of the budget engine: the account balance of every active account, the
activity of each envelope and the Ready to Assign SHALL reflect the transactions that have not been
deleted on the next read, with nothing stored (capability `budget-calc-engine`). An expense SHALL
lower its account's balance and raise the activity of the envelope of each portion; an income SHALL
raise its account's balance and, when it names an envelope, raise that envelope's Available. Editing
or deleting a transaction SHALL change those figures exactly as if the transaction had always been
recorded in its new form, or never recorded.

#### Scenario: Expense on an envelope
- **WHEN** Supermercado has 47.550 available, Banco Nación 842.300 and Ready to Assign is 48.200, and a 18.450 expense is recorded on Supermercado from Banco Nación
- **THEN** Supermercado's Available is 29.100, Banco Nación's balance is 823.850 and Ready to Assign stays 48.200

#### Scenario: Split expense
- **WHEN** a 24.300 expense is split between Farmacia and Supermercado
- **THEN** each envelope's Available falls by its portion and Ready to Assign stays the same

#### Scenario: Income to Ready to Assign
- **WHEN** an income of 850.000 is recorded without an envelope
- **THEN** Ready to Assign rises by 850.000 and no envelope's Available changes

#### Scenario: Income to an envelope
- **WHEN** an income of 3.500 is recorded into Farmacia
- **THEN** Farmacia's Available rises by 3.500 and Ready to Assign does not change

#### Scenario: Deleted transaction
- **WHEN** a recorded 18.450 expense on Supermercado from Banco Nación is deleted
- **THEN** Supermercado's Available and Banco Nación's balance return to what they were before it was recorded

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

### Requirement: Transaction authorization
Every transaction endpoint SHALL require the caller to be a member of the plan. Members of any
role SHALL read the list; `owner` and `editor` SHALL record, edit, delete and restore transactions;
a `viewer` SHALL receive `403` when doing any of those. A user who is not a member, a plan that does
not exist, or a transaction of another plan SHALL receive `404` with the standard error shape.

#### Scenario: Viewer records
- **WHEN** a viewer records an expense
- **THEN** the API responds `403` and records nothing

#### Scenario: Viewer reads
- **WHEN** a viewer lists the transactions
- **THEN** the API responds `200`

#### Scenario: Non-member
- **WHEN** a user who is not a member lists or records transactions of the plan
- **THEN** the API responds `404`

#### Scenario: Viewer edits or deletes
- **WHEN** a viewer edits, deletes or restores a transaction
- **THEN** the API responds `403` and nothing changes

#### Scenario: Non-member edits or deletes
- **WHEN** a user who is not a member of the plan edits, deletes or restores one of its transactions
- **THEN** the API responds `404` and nothing changes

#### Scenario: Transaction of another plan
- **WHEN** an editor of plan A edits or deletes, through plan A's path, the id of a transaction of plan B
- **THEN** the API responds `404` and nothing changes

### Requirement: Transactions follow their plan, account, envelope and payee
Transactions SHALL be removed with their plan. An account SHALL never be deleted, so its
transactions stay in its history, archived or not. Deleting an envelope SHALL NOT delete any
transaction: the portions that used it keep their amount and have no envelope ("Sin sobre"), which
counts as activity of no envelope. Deleting a payee SHALL NOT change past transactions. Transfers
between accounts SHALL remain a separate fact (capability `accounts`) and SHALL NOT be recorded as
transactions. A deleted transaction SHALL NOT count in a payee's `transactionCount`.

#### Scenario: Plan deleted
- **WHEN** the owner deletes a plan that has transactions
- **THEN** they are removed together with it

#### Scenario: Envelope deleted
- **WHEN** Supermercado is deleted after receiving three expenses
- **THEN** the three transactions still exist, their portions have no envelope and the account balances are unchanged

#### Scenario: Transfers are not transactions
- **WHEN** a transfer between two accounts is recorded
- **THEN** it does not appear in the transaction list and does not change any envelope's activity

#### Scenario: Payee count after a delete
- **WHEN** "Coto" has 3 transactions and one is deleted
- **THEN** its `transactionCount` is 2, and 3 again when the transaction is restored

### Requirement: New movement screen
Screen 07 Nuevo movimiento SHALL open from the "+" of the `NavCluster` and show the `Toggle`
Gasto/Ingreso with a close button, the amount in the `AmountCapsule` with the plan's currency
symbol, the typed expression under the capsule when it has an operation, a card of `FieldRow`s
Beneficiario (→ 26), Sobre (→ 36), Cuenta (→ 37), Fecha y hora (→ 38, default now) and Descripción,
the calculator keypad and the `SaveBar` "Guardar gasto". The account SHALL default to the plan's
first active account. Confirming with the swipe or a tap SHALL record the expense, show the toast
"Movimiento guardado" and return to the previous screen, and the envelope, account and movement
figures SHALL refresh. The toggle SHALL switch to the income mode (09) keeping the amount, payee,
account, date and description.

#### Scenario: Record an expense
- **WHEN** the user keys 12300 + 6150, picks Coto, Supermercado and Banco Nación and swipes the SaveBar
- **THEN** the expense of 18.450 is recorded, the toast "Movimiento guardado" shows and screen 10 lists it under "Hoy"

#### Scenario: Missing amount
- **WHEN** the user confirms with an amount of 0
- **THEN** nothing is saved and the form says "Ingresá un monto mayor a cero."

#### Scenario: Missing envelope
- **WHEN** the user confirms an expense without an envelope
- **THEN** nothing is saved and the form says "Elegí un sobre."

#### Scenario: Suggested envelope
- **WHEN** the user picks a payee that has a suggested envelope and has not chosen an envelope by hand
- **THEN** the Sobre row takes the suggested envelope

#### Scenario: Toggle keeps the draft
- **WHEN** the user keys 850.000 in Gasto and switches the toggle to Ingreso
- **THEN** the screen becomes 09 with the same amount

#### Scenario: Viewer
- **WHEN** a viewer confirms a movement
- **THEN** the app shows that their role is read-only and nothing is saved

#### Scenario: No active account
- **WHEN** the plan has no active account
- **THEN** screen 07 explains that an account is needed and offers "Agregar cuenta" (→ 28)

### Requirement: Calculator on the amount
The keypad of screen 07 SHALL have the digits, a decimal comma, the operators `÷`, `×`, `−` and `+`
and a delete key. The amount field SHALL accept an arithmetic expression (FR-18): multiplication and
division bind tighter than addition and subtraction, and the capsule SHALL show the result as it is
typed while the expression stays under it ("12.300 + 6.150"). The result SHALL be computed without
floating-point arithmetic and rounded half up to the currency's minor units when the movement is
confirmed. An expression that cannot be computed (division by zero) or whose result is not positive
SHALL NOT be saved and SHALL show "Ingresá un monto mayor a cero." or "Revisá la operación.".

#### Scenario: Sum of two amounts
- **WHEN** the user keys 12300, +, 6150
- **THEN** the capsule shows 18.450 and "12.300 + 6.150" appears under it

#### Scenario: Precedence
- **WHEN** the user keys 100 + 20 × 3
- **THEN** the capsule shows 160

#### Scenario: Division rounds to the minor unit
- **WHEN** the user keys 1000 ÷ 3 in a peso plan
- **THEN** the amount is 333

#### Scenario: Trailing operator
- **WHEN** the user keys 500 and then +
- **THEN** the capsule keeps showing 500 until another number is typed

#### Scenario: Division by zero
- **WHEN** the user keys 5 ÷ 0 and confirms
- **THEN** nothing is saved and the form says "Revisá la operación."

### Requirement: Split payment screen
Screen 08 Dividir pago SHALL open from the split icon of the `SaveBar` in 07 (expenses only) and show
back and close buttons, the title "Dividir pago", the subtitle with the payee, the date and the total
("Farmacity · Hoy, 18:10 · $ 24.300"), a stripe bar with "Repartido $ X" and "Restan $ Y", one card
per portion (envelope icon, name, "$ X disponible" and the amount as a lavender pill that opens the
amount editor), a last row "Elegí un sobre" with the amount still to distribute, and an error line
"Las partes deben sumar el total: faltan $ X." while they differ. The `SaveBar` SHALL be Disabled,
labelled "Faltan $ X" or "Sobran $ X", until at least two portions, each with an envelope and a
positive amount, add up exactly to the total; then it reads "Guardar gasto" and records the
expense with its portions. Back and close SHALL return to 07 without saving.

#### Scenario: Unequal parts
- **WHEN** the total is 24.300 and the portions are 15.800 and 6.000
- **THEN** the bar shows "Repartido $ 21.800" and "Restan $ 2.500", the error line shows and the SaveBar is Disabled with "Faltan $ 2.500"

#### Scenario: Fixed parts
- **WHEN** the user assigns the remaining 2.500 to another envelope
- **THEN** the SaveBar is enabled, reads "Guardar gasto" and confirming records one expense with three portions

#### Scenario: Excess
- **WHEN** the portions add up to 24.800 against 24.300
- **THEN** the SaveBar is Disabled with "Sobran $ 500"

#### Scenario: Cancel
- **WHEN** the user taps back in 08
- **THEN** 07 opens with the draft unchanged and nothing is saved

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

### Requirement: Choose an envelope sheet
Screen 36 Elegir sobre SHALL be a bottom sheet titled "Elegí un sobre" with a close button, a search
field that filters by name in place, and the plan's envelopes under UPPERCASE group dividers
("DÍA A DÍA", "OBLIGACIONES", and "SIN GRUPO" last), each with its icon, name, group name, its
Available for the current month with the caption "Disponible", "Sobregirado" (red, with `−`) or
"Sin asignar", and a radio with the current one checked in lavender. Tapping a row SHALL select it and
close the sheet. The sheet opened from an income MAY offer "Listo para asignar" as its first row.

#### Scenario: Pick an envelope
- **WHEN** the sheet is opened with Supermercado selected and the user taps Alquiler
- **THEN** the sheet closes returning Alquiler

#### Scenario: Overspent envelope
- **WHEN** Transporte has −6.200 available
- **THEN** its row shows "−$ 6.200" and "Sobregirado" in red and its icon circle is tinted red

#### Scenario: Search
- **WHEN** the user types "super"
- **THEN** only Supermercado remains, under its group divider

### Requirement: Choose a payee sheet
Screen 26 Elegir beneficiario SHALL be a bottom sheet titled "Elegí un beneficiario" with a close
button, a search field and the plan's active payees, each with its initials, name, "Sugerido:
<envelope>" (when it has a suggested envelope) and a check or radio, and, when the typed text is not
an exact name of an existing payee, a last row `Crear "<text>"`. Tapping a payee selects it and
closes the sheet; tapping the selected one clears the choice; the create row returns the typed
name, which the movement sends as `payeeName`.

#### Scenario: Pick a payee
- **WHEN** the user types "Co" and taps Coto
- **THEN** the sheet closes returning Coto and, if Coto suggests Supermercado, 07 fills the Sobre row

#### Scenario: Create from the sheet
- **WHEN** the user types "Verdulería" and taps `Crear "Verdulería"`
- **THEN** the sheet closes with that name, which is created as a payee when the movement is saved

#### Scenario: Search without matches
- **WHEN** the typed text matches no payee
- **THEN** only the create row is offered

### Requirement: Account picker and date sheet reuse
Screens 07 and 09 SHALL choose the account with the existing account picker (37 Elegir cuenta,
which offers only active accounts) and the date and time with the existing 38 Fecha y hora sheet,
without new variants of either.

#### Scenario: Pick the account
- **WHEN** the user taps Cuenta in 07 and chooses Mercado Pago
- **THEN** the sheet closes and the row shows Mercado Pago

#### Scenario: Pick yesterday
- **WHEN** the user taps Fecha y hora, picks yesterday at 09:00 and taps "Listo"
- **THEN** the row shows "Ayer, 09:00" and the movement is recorded at that local instant

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

### Requirement: Edit a transaction
An owner or editor SHALL be able to change any field of a transaction with
`PUT /plans/{planId}/transactions/{transactionId}`, which replaces the editable state with the same
body as recording one: `direction`, `accountId`, `amountMinor`, `occurredAt`, optionally the payee
(`payeeId` or `payeeName`) and `description`, and the destination (`envelopeId` or, for an expense,
`splits`). The same structural rules as when recording apply (exclusive fields, portions that add up
exactly, `400`), and so does the existence rule of every reference (`404`). An account SHALL be
active (`409` for an archived one) and a payee SHALL be active only when it differs from the one the
transaction already has, so a transaction whose account was archived or whose payee was deleted can
still be edited without changing them. The response SHALL be `200` with the transaction and the
`affectedMonths`. Editing a transaction that was deleted, or that belongs to another plan, SHALL
respond `404`. The `id` and the creation instant of the transaction SHALL NOT change, and its
portions SHALL be replaced by the ones sent.

#### Scenario: Change the amount
- **WHEN** an editor changes a 12.000 expense on Transporte to 21.000
- **THEN** the API responds `200` with `amountMinor: 21000` and one portion of 21.000 on Transporte

#### Scenario: Change the envelope
- **WHEN** an editor moves an expense of 18.450 from Supermercado to Comida afuera
- **THEN** the response has one portion on Comida afuera

#### Scenario: Turn a simple expense into a split
- **WHEN** an editor sends `splits` of Farmacia 15.800 and Supermercado 8.500 for an expense of 24.300 that had one envelope
- **THEN** the transaction now has two portions that add up to 24.300

#### Scenario: Change direction, account, date and payee
- **WHEN** an editor turns an expense into an income, moves it to Mercado Pago, to another day and to the payee "Rappi"
- **THEN** the response carries all four changes and the same `id` and `createdAt`

#### Scenario: Remove the payee and the description
- **WHEN** an editor sends the transaction without `payeeId`, `payeeName` or `description`
- **THEN** the transaction has no payee and no description

#### Scenario: Sum off by one
- **WHEN** an editor sends portions that add up to 24.299 against an amount of 24.300
- **THEN** the API responds `400` and the transaction is unchanged

#### Scenario: Reference errors
- **WHEN** an editor sends an account, envelope or payee of another plan, or a deleted payee different from the current one
- **THEN** the API responds `404` and the transaction is unchanged

#### Scenario: Archived account
- **WHEN** an editor moves a transaction to an archived account
- **THEN** the API responds `409` and the transaction is unchanged

#### Scenario: Keep an archived account
- **WHEN** an editor changes only the description of a transaction recorded on an account that was archived afterwards
- **THEN** the API responds `200`

#### Scenario: Edit a deleted transaction
- **WHEN** an editor edits a transaction that was deleted
- **THEN** the API responds `404`

### Requirement: Recalculation of every affected month
After an edit, a deletion or a restoration the budget figures of the plan SHALL be what the engine
computes from the stored facts (capability `budget-calc-engine`): the account balances, the
Available and Carryover of every envelope and the Ready to Assign of every month. This includes the
month the transaction left, the month it moved to, and every later month, as a transaction can be
dated in a month that is already over. The responses of an edit, a deletion and a restoration SHALL
carry `affectedMonths`: the month keys from the earliest month the transaction touched, before or
after the change, to the later of the current month and the latest month it touched, in ascending
order, each month attributed in the plan's time zone.

#### Scenario: Amount changed in a closed month
- **WHEN** in 2026-09 an August expense on Transporte of 12.000 is edited to 21.000
- **THEN** Transporte's Available in August falls by 9.000, the Carryover and Available of September and of every later month follow from it, the account balances and Ready to Assign of both months reflect the extra 9.000, and `affectedMonths` is `["2026-08","2026-09"]`

#### Scenario: Moved to the previous month
- **WHEN** a September expense is moved to a date in August
- **THEN** August's Available of its envelope falls by the amount, September's activity falls by it, the carryover between them changes accordingly, and `affectedMonths` is `["2026-08","2026-09"]`

#### Scenario: Envelope changed
- **WHEN** an expense is moved from Supermercado to Comida afuera
- **THEN** Supermercado's Available rises by the amount, Comida afuera's falls by it and Ready to Assign stays the same

#### Scenario: Account changed
- **WHEN** an expense is moved from Banco Nación to Mercado Pago
- **THEN** Banco Nación's balance rises by the amount and Mercado Pago's falls by it, and Ready to Assign stays the same

#### Scenario: Deleted transaction
- **WHEN** an expense is deleted
- **THEN** every figure returns to the value it would have if the expense had never been recorded

#### Scenario: Current month only
- **WHEN** a transaction of the current month 2026-09 is edited
- **THEN** `affectedMonths` is `["2026-09"]`

#### Scenario: Several months back
- **WHEN** in 2026-09 a transaction of 2026-07 is moved to 2026-08
- **THEN** `affectedMonths` is `["2026-07","2026-08","2026-09"]`

### Requirement: Delete and restore a transaction
An owner or editor SHALL be able to delete a transaction with
`DELETE /plans/{planId}/transactions/{transactionId}`, which responds `200` with the
`affectedMonths`. The deletion SHALL be logical: the transaction stops counting in the list, the
summary, the account balances, the envelope activity and the payee counts, and the budget figures
are those of a plan that never had it, but its stored fact is kept so that
`POST /plans/{planId}/transactions/{transactionId}/restore` can bring it back. A restoration SHALL
respond `200` with the transaction and the `affectedMonths`, and SHALL give back the same `id`,
creation instant, amount, account, payee, date, description and portions the transaction had when it
was deleted, so every figure returns to exactly what it was. Deleting a transaction that is already
deleted, or restoring one that is not deleted, SHALL respond `404`.

#### Scenario: Delete
- **WHEN** an editor deletes the Coto expense of 18.450 on Supermercado from Banco Nación
- **THEN** the API responds `200`, the list no longer has it and Supermercado's Available and Banco Nación's balance are what they were before it

#### Scenario: Restore
- **WHEN** the editor restores that transaction
- **THEN** the API responds `200` with the same `id`, `createdAt`, `occurredAt`, payee, description and portions, the list shows it again in its place and every figure equals the one before the deletion

#### Scenario: Restore a split
- **WHEN** a split of Farmacia 15.800, Supermercado 6.000 and Comida afuera 2.500 is deleted and restored
- **THEN** it returns with the three portions and each envelope's Available is exactly as before

#### Scenario: Delete twice
- **WHEN** a member deletes a transaction that is already deleted
- **THEN** the API responds `404`

#### Scenario: Restore without a deletion
- **WHEN** a member restores a transaction that was not deleted
- **THEN** the API responds `404`

#### Scenario: Restore after the envelope was deleted
- **WHEN** a transaction is deleted, then its envelope is deleted, then the transaction is restored
- **THEN** the transaction returns with its portion without an envelope ("Sin sobre"), like any other transaction of a deleted envelope

### Requirement: Undo an edit
A client SHALL undo an edit by sending the state the transaction had before it back with the same
`PUT`; the API SHALL keep no history and SHALL treat that request as any other edit. Because the
`PUT` replaces every editable field, and `id` and creation instant never change, undoing an edit
SHALL leave the transaction and every derived figure exactly as before the edit.

#### Scenario: Undo an amount edit
- **WHEN** an edit changes 12.000 to 21.000 and the client then sends the original state back
- **THEN** the transaction is again 12.000 with the same payee, envelope, account, date and description, and every month's figures equal the ones before the edit

#### Scenario: Undo a split edit
- **WHEN** a split is edited to a single envelope and the original portions are sent back
- **THEN** the transaction returns to its original portions

### Requirement: Edit movement screen
Screen 12 Editar movimiento SHALL open from a `TxRow` in 10 and in the account detail 14, with the
title "Editar movimiento", a back `IconButton` (cancels without saving) and a red trash `IconButton`
at the top right (→ 27). It SHALL show the amount in the `AmountCapsule` with the plan currency's
symbol, "Antes $ X" under it while the amount differs from the saved one, and a card of `FieldRow`s
Beneficiario (→ 26), Sobre (→ 36, or "<N> sobres" opening 08 for a split), Cuenta (→ 37), Fecha y hora
(→ 38) and Descripción, reusing the form of screen 07 and its pickers. The amount is edited with the
calculator keypad of 07, shown or hidden by the calculator icon of the `SaveBar`. When the movement's
month is earlier than the current month the screen SHALL show a lavender note "Es de <mes>, un mes
cerrado" with "Al guardar se recalculan <meses> y tu Listo para asignar." The `SaveBar` SHALL read
"Guardar cambios". The same validation as screen 07 applies, and a split SHALL be edited in 08 with its
rules (exact sum, `SaveBar` Disabled "Faltan $ X"). Confirming SHALL send the edit, refresh the
envelope, account and movement figures and return to 10 with the toast of screen 49. A viewer SHALL
see that their role is read-only and nothing SHALL be saved.

#### Scenario: Edit the amount
- **WHEN** the user opens a 12.000 movement, keys 21000 and swipes "Guardar cambios"
- **THEN** the movement is 21.000, 10 opens and the toast "Recalculado" with "Deshacer" shows

#### Scenario: Original amount shown
- **WHEN** the amount differs from the saved one
- **THEN** "Antes $ 12.000" shows under the capsule

#### Scenario: Closed month note
- **WHEN** the user opens a movement of August in September
- **THEN** the note reads "Es de agosto, un mes cerrado" and "Al guardar se recalculan agosto, septiembre y tu Listo para asignar."

#### Scenario: Current month movement
- **WHEN** the user opens a movement of the current month
- **THEN** no closed-month note is shown

#### Scenario: Invalid amount
- **WHEN** the user clears the amount and confirms
- **THEN** nothing is saved and the form says "Ingresá un monto mayor a cero."

#### Scenario: Edit a split
- **WHEN** the user taps the Sobre row "3 sobres" and the portions no longer add up
- **THEN** 08 opens with the portions, its `SaveBar` is Disabled with "Faltan $ X" and saving the edit is not possible until they add up

#### Scenario: Cancel
- **WHEN** the user taps back
- **THEN** the movement is unchanged and nothing is sent

#### Scenario: Viewer
- **WHEN** a viewer confirms the edit
- **THEN** the app shows that their role is read-only and nothing is saved

### Requirement: Recalculated toast and undo
After saving an edit (screen 12 → 49) the app SHALL return to 10 and show a Neutral toast over the
`NavCluster` with the title "Recalculado", the detail "<meses> actualizados." built from
`affectedMonths` ("Agosto y septiembre actualizados.", "Septiembre actualizado." for one month, "Julio a
septiembre actualizados." for four or more) and the action "Deshacer". After a deletion the toast SHALL
read "Movimiento eliminado" with the same detail and action. Tapping "Deshacer" SHALL send the previous
state with the same `PUT` after an edit, or restore the transaction after a deletion, then refresh
the figures, and SHALL leave the movement exactly as it was before. The toast dismisses itself and
needs no tap to close.

#### Scenario: Undo an edit
- **WHEN** the user edits 12.000 to 21.000 and taps "Deshacer" in the toast
- **THEN** the movement is again 12.000 and the envelope, account and Ready to Assign figures are the ones from before the edit

#### Scenario: Delete and undo
- **WHEN** the user deletes a movement and taps "Deshacer" in the toast "Movimiento eliminado"
- **THEN** the movement is back in 10 in its place with the same data and the figures are the ones from before the deletion

#### Scenario: Several months named
- **WHEN** a movement of August is edited in September
- **THEN** the toast detail reads "Agosto y septiembre actualizados."

#### Scenario: Toast ignored
- **WHEN** the user does not tap "Deshacer"
- **THEN** the toast closes by itself and the change stands

### Requirement: Delete movement confirmation
Screen 27 Eliminar movimiento SHALL be a bottom sheet opened by the trash `IconButton` of 12, titled
"¿Eliminar este movimiento?", showing the movement as a `TxRow`, a lavender note "Se recalcularán
<meses>." with "Los saldos y Listo para asignar se actualizan al confirmar.", and Cancelar (→ 12) and
Eliminar (solid `danger`). Eliminar SHALL delete the movement, return to 10 and show the toast of
screen 49 "Movimiento eliminado" with "Deshacer".

#### Scenario: Confirm
- **WHEN** the user taps the trash in 12 and then Eliminar
- **THEN** the movement is deleted, 10 opens without it and the toast "Movimiento eliminado" with "Deshacer" shows

#### Scenario: Cancel
- **WHEN** the user taps Cancelar
- **THEN** the sheet closes and 12 stays as it was

#### Scenario: Months in the note
- **WHEN** the movement is from August and today is in September
- **THEN** the note reads "Se recalcularán agosto y septiembre."

### Requirement: Filter movements sheet
Screen 11 Filtrar movimientos SHALL be a bottom sheet titled "Filtrar" with a close button, opened by
the filters button of 10, showing: "Fechas" with "Desde" and "Hasta" fields (→ the date calendar of
38, without the time); "Franja horaria" with the chips "Todo el día", "Mañana" (06:00–11:59), "Tarde"
(12:00–17:59) and "Noche" (18:00–23:59) and "Desde" and "Hasta" time fields (→ the time stepper of
38); "Tipo" as a segmented control Todos, Gastos, Ingresos; and the rows Beneficiario (→ 26), Sobre (→ 36)
and Cuenta (→ 37), each "Todos"/"Todas" until one is chosen. The primary button reads "Ver N
movimientos" with the count of the transactions the current choices select, updated as they change,
and "Limpiar" resets every choice. Applying (the button, or closing the sheet) SHALL return to 10 with
the chosen filters active; choosing a time-of-day chip fills the time fields and editing the fields
by hand deselects the chip.

#### Scenario: Evening of September
- **WHEN** the user sets 01/09/2026 to 30/09/2026, taps "Noche" and taps "Ver 4 movimientos"
- **THEN** 10 shows the chips "1 – 30 sep" and "18:00 – 23:59" and only the 4 movements dated in September from 18:00 on

#### Scenario: Count follows the choices
- **WHEN** the user changes "Tipo" to Gastos
- **THEN** the button's count updates to the number of matching expenses

#### Scenario: Clear
- **WHEN** the user taps "Limpiar"
- **THEN** every choice returns to "Todos" and the date and time fields are empty

#### Scenario: Pick an envelope
- **WHEN** the user taps Sobre and chooses Comida afuera
- **THEN** the row shows Comida afuera and 10 lists only movements with a portion on it

#### Scenario: No result
- **WHEN** the choices select no movement
- **THEN** the button reads "Ver 0 movimientos" and applying shows the empty state of 10 with filters

### Requirement: Filtered movements stay paginated
Filters and search SHALL work with the offset pagination of `api-conventions`: `page` and `pageSize`
apply to the filtered set, `total` counts the matching transactions, and a filter change SHALL restart
at page 1.

#### Scenario: Second page of a filter
- **WHEN** 45 transactions match the filters and a member requests `page=3&pageSize=20` with them
- **THEN** the response has 5 items and `total: 45`

#### Scenario: Filter change restarts
- **WHEN** the user has scrolled to the third page and then changes a filter
- **THEN** 10 shows the first page of the new filter
