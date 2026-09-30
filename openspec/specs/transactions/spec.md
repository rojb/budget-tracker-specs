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
activity of each envelope and the Ready to Assign SHALL reflect them on the next read, with nothing
stored (capability `budget-calc-engine`). An expense SHALL lower its account's balance and raise the
activity of the envelope of each portion; an income SHALL raise its account's balance and, when it
names an envelope, raise that envelope's Available.

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

### Requirement: List movements
`GET /plans/{planId}/transactions` SHALL return the plan's transactions newest first by
`occurredAt` (ties by creation instant), paginated with `page` and `pageSize`, and, with
`accountId`, only those of that account. Each item SHALL carry its id, direction, account id and
name, amount, `occurredAt`, payee id and name (when any, including a deleted payee), description
(when any), `splits` (each with its envelope id and name when it has an envelope, and its amount)
and creation instant.

#### Scenario: Newest first
- **WHEN** the plan has a transaction dated today 21:45, one today 19:10 and one on Saturday 26
- **THEN** the list returns them in that order with `total: 3`

#### Scenario: Pagination
- **WHEN** the plan has 45 transactions and a member requests `page=3&pageSize=20`
- **THEN** the response has `page: 3`, 5 items and `total: 45`

#### Scenario: Only one account
- **WHEN** the list is requested with the id of Mercado Pago
- **THEN** only the transactions recorded on Mercado Pago are returned

#### Scenario: Names survive deletions
- **WHEN** the payee of a past transaction is deleted
- **THEN** the transaction still shows the payee's name, and when its envelope is deleted the split keeps its amount with no envelope

### Requirement: Transaction authorization
Every transaction endpoint SHALL require the caller to be a member of the plan. Members of any
role SHALL read the list; `owner` and `editor` SHALL record transactions; a `viewer` SHALL receive
`403` when recording. A user who is not a member, or a plan that does not exist, SHALL receive
`404` with the standard error shape.

#### Scenario: Viewer records
- **WHEN** a viewer records an expense
- **THEN** the API responds `403` and records nothing

#### Scenario: Viewer reads
- **WHEN** a viewer lists the transactions
- **THEN** the API responds `200`

#### Scenario: Non-member
- **WHEN** a user who is not a member lists or records transactions of the plan
- **THEN** the API responds `404`

### Requirement: Transactions follow their plan, account, envelope and payee
Transactions SHALL be removed with their plan. An account SHALL never be deleted, so its
transactions stay in its history, archived or not. Deleting an envelope SHALL NOT delete any
transaction: the portions that used it keep their amount and have no envelope ("Sin sobre"), which
counts as activity of no envelope. Deleting a payee SHALL NOT change past transactions. Transfers
between accounts SHALL remain a separate fact (capability `accounts`) and SHALL NOT be recorded as
transactions.

#### Scenario: Plan deleted
- **WHEN** the owner deletes a plan that has transactions
- **THEN** they are removed together with it

#### Scenario: Envelope deleted
- **WHEN** Supermercado is deleted after receiving three expenses
- **THEN** the three transactions still exist, their portions have no envelope and the account balances are unchanged

#### Scenario: Transfers are not transactions
- **WHEN** a transfer between two accounts is recorded
- **THEN** it does not appear in the transaction list and does not change any envelope's activity

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
envelope and then shows its name. The `SaveBar` SHALL read "Guardar ingreso" and its calculator
button SHALL show and hide the keypad. Confirming records the income to Ready to Assign or to the
chosen envelope.

#### Scenario: Income to Ready to Assign
- **WHEN** the user enters 850.000 from Estudio Pérez SRL into Banco Nación, keeps "Listo para asignar" and confirms
- **THEN** the income is recorded without an envelope, the toast "Movimiento guardado" shows and Ready to Assign rises by 850.000

#### Scenario: Directly to an envelope
- **WHEN** the user chooses "Directo a un sobre" and picks Farmacia
- **THEN** the card shows Farmacia and confirming raises Farmacia's Available

#### Scenario: Direct to an envelope without choosing
- **WHEN** the user chooses "Directo a un sobre", closes 36 without a pick and confirms
- **THEN** nothing is saved and the form says "Elegí un sobre."

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
newest first, grouped by day ("Hoy · martes 29", "Ayer · lunes 28", then "Sábado 26"), each as a
`TxRow`: the payee name (or the description when there is no payee, or "Sin beneficiario"), the
subtitle "<envelope> · <time>" ("<N> sobres · <time>" for a split, "Listo para asignar · <time>" for
an income without envelope), the account name under the amount, the amount with `−` for an expense
and a lavender capsule with `+` for an income, and the icon of the envelope (a split icon for a
split, an arrow for an income to Ready to Assign). More rows SHALL load as the list is scrolled.
With no transactions it SHALL show "Todavía no hay movimientos"; while loading, at least three
skeleton rows; on failure, a retry. Search, the filters and opening a movement (screens 11 and 12)
belong to `add-transaction-editing-and-filters` and are not offered here.

#### Scenario: Grouped by day
- **WHEN** the plan has movements today, yesterday and on Saturday 26
- **THEN** 10 shows them under "Hoy · martes 29", "Ayer · lunes 28" and "Sábado 26", newest first

#### Scenario: Split row
- **WHEN** a 24.300 expense at Farmacity is split across two envelopes at 18:10
- **THEN** its row reads "Farmacity", "2 sobres · 18:10" and "−$ 24.300"

#### Scenario: Income row
- **WHEN** an income of 3.500 into Farmacia at 19:10 on Banco Nación was recorded
- **THEN** its row shows "+$ 3.500" in a lavender capsule with "Banco Nación" under it

#### Scenario: Empty plan
- **WHEN** the plan has no transactions
- **THEN** 10 shows "Todavía no hay movimientos"

#### Scenario: Scrolling loads more
- **WHEN** the plan has more transactions than one page and the user scrolls to the end
- **THEN** the next page is loaded and appended without repeating rows
