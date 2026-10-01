# monthly-assignment Specification

## Purpose
Monthly assignment: giving money to envelopes month by month (including future months), the
aggregated view of a budget month, the status filters of the plan view and the month close.

## Requirements

### Requirement: Assign money to an envelope in a month
An owner or editor SHALL be able to add money to an envelope's assignment of any budget month,
past, current or future, with `POST /plans/{planId}/months/{month}/assignments`, sending
`envelopeId` and `amountMinor` (a non-zero integer in minor units: positive adds money, negative
takes it back). The amount SHALL be added to the envelope's existing assignment of that month. The
response SHALL be `200` with the month, its Ready to Assign and the envelope's updated line.

#### Scenario: Cover an overspent envelope
- **WHEN** in 2026-09 Transporte has Available −6.200 and Ready to Assign is 48.200, and 6.200 is assigned to it for 2026-09
- **THEN** the API responds `200`, Transporte's Available is 0 and Ready to Assign is 42.000

#### Scenario: Assign to a future month
- **WHEN** the current month is 2026-09 and 20.000 is assigned to Regalos for 2026-11
- **THEN** Regalos has Assigned 20.000 in 2026-11, its 2026-09 figures do not change, and the Ready to Assign of 2026-09 drops by 20.000

#### Scenario: Assignment adds up
- **WHEN** Supermercado already has 180.000 assigned in 2026-09 and 10.000 is assigned to it for 2026-09
- **THEN** its Assigned in 2026-09 is 190.000

#### Scenario: Over-assigning is allowed
- **WHEN** the amount is larger than the Ready to Assign
- **THEN** the assignment is stored and the response reports a negative Ready to Assign

#### Scenario: Invalid input
- **WHEN** the amount is 0 or not an integer, or the month is not a `YYYY-MM` key
- **THEN** the API responds `400` and nothing changes

#### Scenario: Envelope of another plan
- **WHEN** the envelope does not belong to the plan
- **THEN** the API responds `404` and nothing changes

### Requirement: Month summary
`GET /plans/{planId}/months/{month}` SHALL return, for any month, the figures the budget engine
derives for it: `currentMonth` (in the plan's time zone), `isFuture`, the sum of account balances,
the sum of Available, the amount reserved for later months, the Ready to Assign, the total
assigned in the month, the number of envelopes and how many are overspent, underfunded and funded.

#### Scenario: September with the canonical data
- **WHEN** the current month is 2026-09 and 2026-09 is requested
- **THEN** `isFuture` is false, balance is 1.000.000, available 931.800, reserved for later 20.000, Ready to Assign 48.200, 12 envelopes, 1 overspent

#### Scenario: A future month
- **WHEN** the current month is 2026-09 and 2026-11 is requested
- **THEN** `isFuture` is true, `currentMonth` is 2026-09, the assigned total is 20.000 and Ready to Assign is 48.200

#### Scenario: Invalid month
- **WHEN** the month is `2026-13`
- **THEN** the API responds `400`

### Requirement: Month close
`GET /plans/{planId}/months/{month}/close` SHALL describe the close of `month` into the next one:
each envelope (id and name) whose positive Available carries over, each one whose overspending is
deducted, the total deducted, the Ready to Assign of both months, the next month's balance, sum of
Available and amount reserved for later months, and whether the close was already confirmed.

#### Scenario: September into October
- **WHEN** the close of 2026-09 is requested with the canonical data
- **THEN** Supermercado +47.550 and Alquiler +380.000 are among the carried envelopes, Transporte 6.200 is deducted, and October reads 1.000.000 − 938.000 − 20.000 = 42.000

#### Scenario: Close of an empty month
- **WHEN** the plan had no envelopes with money in the month
- **THEN** both lists are empty and the total deducted is 0

### Requirement: Confirm a month close
An owner or editor SHALL be able to confirm the close of a month that has ended with
`POST /plans/{planId}/months/{month}/close`, which records that the close was seen and returns the
close with `confirmed` true. Confirming SHALL change no figure, and confirming again SHALL succeed
without changes. A month that has not ended SHALL be rejected with `409`.

#### Scenario: Confirm September in October
- **WHEN** the current month is 2026-10 and the close of 2026-09 is confirmed
- **THEN** the API responds `200` with `confirmed` true and every figure of 2026-09 and 2026-10 stays the same

#### Scenario: Month not ended
- **WHEN** the current month is 2026-10 and the close of 2026-10 is confirmed
- **THEN** the API responds `409` and nothing is recorded

### Requirement: Monthly assignment authorization
Every member of the plan SHALL be able to read a month summary and a month close. Assigning money
and confirming a close SHALL require the owner or editor role: a viewer SHALL receive `403`. A
caller who is not a member SHALL receive `404`, and a request without a valid token `401`.

#### Scenario: Viewer assigns
- **WHEN** a viewer assigns money to an envelope
- **THEN** the API responds `403` and nothing changes

#### Scenario: Viewer reads the month
- **WHEN** a viewer requests the month summary
- **THEN** the API responds `200`

### Requirement: Month navigation in the plan view
Screen 02 Plan del mes SHALL show the viewed month in the month switch ("Septiembre 2026") and its
‹ › buttons SHALL move one month back or forward without any limit (FR-15), reloading the
envelopes, the Ready to Assign and the filters for that month in place.

#### Scenario: Next month
- **WHEN** the user views "Septiembre 2026" and taps ›
- **THEN** the switch reads "Octubre 2026" and the envelopes show October's figures

#### Scenario: Past month
- **WHEN** the user taps ‹ from "Septiembre 2026"
- **THEN** the switch reads "Agosto 2026" and the envelopes show August's figures

### Requirement: Future month view
When the viewed month is after the current month, the plan view SHALL become screen 04 Plan · mes
futuro: a lavender notice "Estás en un mes futuro · Lo que asignes acá se reserva hoy." with a
"Hoy" button back to the current month, group headers with "<amount> asignado", and each envelope
with its assigned amount, "Asignado" or "Sin asignar", and "Reservado desde <current month>" or
"Sin asignar todavía".

#### Scenario: November from September
- **WHEN** the current month is September, Regalos has 20.000 reserved for November and the user moves to "Noviembre 2026"
- **THEN** 04 shows the notice, Ready to Assign 48.200, Regalos "Reservado desde septiembre" with "$ 20.000 · Asignado" and Alquiler "Sin asignar todavía" with "$ 0 · Sin asignar"

#### Scenario: Back to today
- **WHEN** the user taps "Hoy" in 04
- **THEN** the plan view returns to the current month

### Requirement: Status filters in the plan view
The plan view SHALL show the chips "Todos", "Sobregirados · N", "Falta · N" and "Cubiertos · N",
with N the envelopes of the viewed month in that state. Selecting a chip SHALL keep only the
envelopes in that state, hide the groups left empty and, when none match, say so in place;
"Todos" SHALL show every envelope again.

#### Scenario: Only overspent
- **WHEN** September has Transporte overspent and the user taps "Sobregirados · 1"
- **THEN** only Transporte is listed, under "Día a día"

#### Scenario: Filter without results
- **WHEN** no envelope is overspent and the user taps "Sobregirados · 0"
- **THEN** the list says that no envelope is overspent this month

### Requirement: Assign money screen
Screen 03 Asignar dinero SHALL open from the "+" of the "Listo para asignar" card (02, 04, 01) and
from "Asignar a esta meta" in 05, and show a close button, "Asignar dinero", the amount in the
`AmountCapsule`, quick amount chips (the chosen envelope's need, 10.000, 20.000, 50.000), month
chips from the viewed month on (four months), "Elegí un sobre" with a carousel of envelope cards
and the `SaveBar` "Asignar <amount>".

#### Scenario: Cover Transporte
- **WHEN** the user opens 03 in September and picks Transporte (−$ 6.200 disponible)
- **THEN** the amount is 6.200, the card reads "Sobregirado · quedaría en $ 0" and the bar reads "Asignar $ 6.200"

#### Scenario: Reserve for a future month
- **WHEN** the user picks "Nov", Regalos and 20.000 and confirms
- **THEN** 20.000 is assigned to Regalos for November and the plan view returns showing the new Ready to Assign

#### Scenario: Opened from a goal
- **WHEN** the user taps "Asignar a esta meta" in 05 for Vacaciones
- **THEN** 03 opens with Vacaciones chosen

### Requirement: Own amount with the calculator
Tapping the `AmountCapsule` or the calculator of the `SaveBar` in 03 SHALL show screen 53: the
capsule with a cursor, the quick chips, a compact card of the chosen envelope ("<available>
disponible → quedaría en <after>"), "Listo para asignar quedaría en <amount>" and the calculator
pad, which accepts `+ − × ÷` and resolves the expression (FR-18).

#### Scenario: Own amount
- **WHEN** Transporte has −6.200, Ready to Assign is 48.200 and the user types 15.000
- **THEN** 53 reads "−$ 6.200 disponible → quedaría en $ 8.800" and "Listo para asignar quedaría en $ 33.200"

### Requirement: Confirming an assignment
Confirming 03 or 53 SHALL assign the amount to the chosen envelope and month, show "Guardado" and
return to the plan view of that month. An amount of 0 SHALL not be sent and the screen SHALL say
"Ingresá un monto mayor a cero". When the result leaves Ready to Assign negative, a warning SHALL
say "Asignaste más de lo disponible".

#### Scenario: Zero amount
- **WHEN** the user confirms with 0
- **THEN** nothing is saved and the screen says "Ingresá un monto mayor a cero"

#### Scenario: Over-assigning
- **WHEN** the user assigns 60.000 with Ready to Assign 48.200
- **THEN** the assignment is saved and a warning toast says "Asignaste más de lo disponible"

### Requirement: Month close screen
Screen 25 Cierre de mes SHALL open by itself when the user opens the current month in the plan view
and the previous month's close has money to carry or deduct and was not confirmed. It SHALL show
"<Month> → <Next month>", "Así queda tu plan al cerrar el mes.", each carried envelope ("+<amount>
se arrastra") and each overspent one in red ("−<amount> se descuenta de Listo para asignar"), the
envelopes that restart at $ 0, the "Todo cuadra" check and "Empezar <next month>".

#### Scenario: Open October
- **WHEN** the current month is October and September's close was not confirmed
- **THEN** 25 shows "Septiembre → Octubre", Transporte "−$ 6.200 se descuenta de Listo para asignar", "Transporte reinicia en $ 0 en octubre." and "$ 1.000.000 − $ 938.000 − $ 20.000 = $ 42.000"

#### Scenario: Start the month
- **WHEN** the user taps "Empezar octubre"
- **THEN** the close is confirmed, a toast says "Mes de octubre abierto" and 02 shows October; 25 does not open again

#### Scenario: Dismiss
- **WHEN** the user closes 25 with the close button
- **THEN** nothing is confirmed and 25 opens again the next time the current month is opened
