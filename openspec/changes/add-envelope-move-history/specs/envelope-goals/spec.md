## MODIFIED Requirements

### Requirement: Envelope detail
`GET /plans/{planId}/envelopes/{envelopeId}/detail` SHALL return to any member (FR-24), for a
`month` (`YYYY-MM`, the current month of the plan's time zone by default), the envelope line of
that month (envelope with its goal and photo, the assigned, spent and available amounts, the
state and the goal status), its `carryoverMinor`, and the month's activity, which has two kinds of
items. `activity` SHALL hold the transactions that have a portion on the envelope and whose local
date in the plan's time zone is in that month, newest first by registration instant (`createdAt`,
ties by id), at most 100 of them, with `activityTotal` counting all of them; each item SHALL have
the shape of a listed transaction. `moves` SHALL hold the moves of money (FR-25) of that month in
which the envelope was the source or the destination, newest first by registration instant
(`createdAt`, ties by id), at most 100 of them, with `movesTotal` counting all of them; each item
SHALL carry its `id`, its `direction` (`out` when the envelope was the source, `in` when it was the
destination), the counterpart envelope (`counterpartId`, null when that envelope no longer exists,
and `counterpartName`), the positive `amountMinor`, the `month` it was made for and its `createdAt`.
A move belongs to the month it was made for, not to the day it was registered. `spentMinor`, the
assigned, available and carryover amounts SHALL be computed as if moves were not listed: a move is
history, never a transaction, so it SHALL NOT count in `spentMinor`. A client shows both lists as
one activity by merging them by `createdAt`. An envelope of another plan, or one that does not
exist, SHALL respond `404`.

#### Scenario: Month activity
- **WHEN** Supermercado has an 18.450 expense registered today and a 42.100 expense registered yesterday in 2026-09
- **THEN** the detail for 2026-09 lists them in that order, `activityTotal` is 2 and `spentMinor` is 60.550

#### Scenario: Income to the envelope
- **WHEN** a 3.500 income was directed to the envelope in the month
- **THEN** it is part of the activity and lowers `spentMinor`

#### Scenario: Month without movements
- **WHEN** the envelope has no transactions and no moves in the month
- **THEN** `activity` and `moves` are empty and `activityTotal` and `movesTotal` are 0

#### Scenario: Another month
- **WHEN** the detail is requested for 2026-08
- **THEN** the figures, the state, the transactions and the moves are those of August

#### Scenario: Other plan or missing envelope
- **WHEN** a member asks for the detail of an envelope of another plan
- **THEN** the API responds `404`

#### Scenario: Moves in the detail
- **WHEN** 10.000 was moved from Alquiler to Transporte in 2026-09
- **THEN** the detail of Alquiler for 2026-09 has one move with `direction` `out`, `counterpartName` "Transporte" and `amountMinor` 10.000, and the detail of Transporte has one with `direction` `in`, `counterpartName` "Alquiler" and the same amount

#### Scenario: Moves do not count as spending
- **WHEN** an envelope has 18.450 of expenses and a 10.000 move out in the month
- **THEN** its `spentMinor` is 18.450, `activityTotal` is 1 and `movesTotal` is 1

#### Scenario: Moves and transactions share one order
- **WHEN** an expense is registered, then a move, then another expense
- **THEN** merging `activity` and `moves` by `createdAt` newest first gives the second expense, the move and the first expense

#### Scenario: Move for another month
- **WHEN** a move is registered today for the month 2026-10
- **THEN** it appears in the detail for 2026-10 and not in the detail for the current month

#### Scenario: Moves only in the envelope detail
- **WHEN** a move is made between two envelopes
- **THEN** it is in no transaction list, in no account detail, in no "Salió" or "Entró" total and in no report, because it is not a transaction

#### Scenario: Viewer reads the moves
- **WHEN** a viewer asks for the detail of an envelope that has moves
- **THEN** the moves are part of the response

### Requirement: Move money between envelopes
An owner or editor SHALL be able to move money from one envelope to another inside one month (FR-25)
with `POST /plans/{planId}/envelopes/move`, sending `fromEnvelopeId`, `toEnvelopeId`, `amountMinor` (a
positive integer) and optionally a `month` (the current month of the plan's time zone by default).
The move SHALL subtract the amount from the source's assignment of the month and add it to the
destination's, through the budget engine's assignment facts, in one atomic operation, without
creating a transaction. It SHALL NOT change Ready to Assign, any other envelope or any other month's
assignments. The amount SHALL NOT exceed the source's Available in that month, including its
carryover: a larger amount, or any amount from an envelope with no available money, SHALL respond
`409` and change nothing. The source and the destination SHALL differ (`400`), and both SHALL belong
to the plan (`404`). The response SHALL be `200` with the `month`, the month's `readyToAssignMinor`
and the updated envelope lines of both envelopes, with their states. An envelope that was
overspent MAY be the destination, which is how its overspending is covered. Each successful move
SHALL also be recorded (who moved it is not kept): its plan, source, destination, amount, month and
registration instant, in the same atomic operation as the assignments, so a move is recorded if and
only if its assignments changed. A refused move SHALL record nothing. The record is history only:
nothing is computed from it. Moves made before the record existed cannot be reconstructed and are
not listed.

#### Scenario: Cover an overspent envelope
- **WHEN** Supermercado has 47.550 available, Transporte is at −6.200 and an editor moves 6.200 from Supermercado to Transporte
- **THEN** the API responds `200`, Supermercado has 41.350 available, Transporte 0, and Ready to Assign is the same as before

#### Scenario: Assignments change by the amount
- **WHEN** 10.000 is moved from Supermercado (assigned 180.000) to Salidas (assigned 20.000) in 2026-09
- **THEN** their assignments for 2026-09 are 170.000 and 30.000, and the assignments of every other month and envelope are unchanged

#### Scenario: More than available
- **WHEN** Supermercado has 47.550 available and 50.000 is moved from it
- **THEN** the API responds `409`, no assignment changes, no move is recorded and the response uses the standard error shape

#### Scenario: Source without money
- **WHEN** the source's Available is 0 or negative and any amount is moved
- **THEN** the API responds `409`

#### Scenario: Same envelope or invalid amount
- **WHEN** the source and the destination are the same, or the amount is 0, −5 or 10.5
- **THEN** the API responds `400` and nothing changes

#### Scenario: Foreign envelope
- **WHEN** one of the ids belongs to another plan
- **THEN** the API responds `404` and nothing changes

#### Scenario: Move in another month
- **WHEN** an editor moves money with `month` 2026-10
- **THEN** only the assignments of 2026-10 change, and the Available of later months is recalculated from them

#### Scenario: Atomic
- **WHEN** the move fails after the amount was checked
- **THEN** neither assignment has changed and no move is recorded

#### Scenario: Each move is recorded
- **WHEN** an editor moves 10.000 from Alquiler to Transporte
- **THEN** one move is recorded with that source, destination, amount, month and registration instant, and it shows in the detail of both envelopes

#### Scenario: Concurrent moves
- **WHEN** several moves out of the same envelope run at once and only some fit in its Available
- **THEN** exactly the moves that succeeded are recorded

#### Scenario: Envelope deleted later
- **WHEN** an envelope that took part in a move is deleted
- **THEN** the other envelope keeps the move in its detail with `counterpartId` null and the name the deleted envelope had, and a move whose two envelopes were deleted is removed

### Requirement: Envelope detail screen
Screen 22 Detalle de sobre SHALL open from an `EnvelopeRow` of 02 and from the tiles of 05. It SHALL
show a back button, a pencil that opens 23 (hidden for a viewer), the envelope's icon, its name
(30) and group, a card with the Asignado, Disponible and Gastado of the month, the goal row, the
section "Actividad de <month>" with the month's transactions and moves as `TxRow`s, merged and
grouped by the day they were registered, last registered first, with the date of the movement before
the time when it differs from that day (a tap on a transaction opens
12) and, for an owner or editor, a primary button "Mover dinero" that opens 24. A move SHALL be a
`TxRow` with a left-right arrows icon: on the source, the title "Movido a <envelope>" and the amount
with a `−` sign; on the destination, the title "Movido desde <envelope>" and the amount with a `+`
sign in the lavender capsule used by income; the subtitle SHALL be the time it was registered,
preceded by its day and short month when the month it was made for is not the month it was registered
in. A move row SHALL NOT react to a tap, have no chevron and no pressed state, because a move is not
a transaction and has no screen. The goal row of a
`monthly` goal SHALL read "Objetivo mensual" with "<target> · <percent>% asignado" and a stripe
progress bar; of a `targetByDate` goal, "Meta <target> · <month of the due date>" with
"<percent>% ahorrado"; when the envelope is `underfunded` it SHALL add "Falta <missing> este mes",
and when `overspent` it SHALL say "Sobregirado" in red with a full red bar. Without a goal it SHALL
say "Sin objetivo". With no movements and no moves it SHALL show "Sin movimientos este mes"; while
loading, at least three skeleton rows; on failure, a retry. No state SHALL be conveyed by color alone.

#### Scenario: Monthly goal covered
- **WHEN** the user opens Supermercado, with a monthly goal of 180.000 fully assigned
- **THEN** 22 shows "$ 180.000 Asignado", "$ 47.550 Disponible", "$ 132.450 Gastado", "Objetivo mensual" with "$ 180.000 · 100% asignado" and full stripes, and the month's movements

#### Scenario: Underfunded
- **WHEN** the envelope is `underfunded` in the month
- **THEN** the goal row also shows "Falta" with the missing amount and the bar shows stripes and dots

#### Scenario: Overspent
- **WHEN** the envelope is `overspent`
- **THEN** the goal row shows "Sobregirado" in red and a full red bar

#### Scenario: No goal
- **WHEN** the envelope has no goal
- **THEN** the goal row says "Sin objetivo"

#### Scenario: Open a movement
- **WHEN** the user taps a transaction of the activity
- **THEN** screen 12 opens with it

#### Scenario: Viewer
- **WHEN** a viewer opens 22
- **THEN** there is no pencil and no "Mover dinero" button, and the moves are listed

#### Scenario: Move out
- **WHEN** 10.000 was moved from Alquiler to Transporte and the user opens 22 of Alquiler
- **THEN** it lists "Movido a Transporte" with "−$ 10.000" and the time, and its figures are the ones the move produced

#### Scenario: Move in
- **WHEN** the user opens 22 of Transporte after that move
- **THEN** it lists "Movido desde Alquiler" with "+$ 10.000" in the lavender capsule and the time, instead of "Sin movimientos este mes"

#### Scenario: Moves among transactions
- **WHEN** an envelope has an expense registered at 10:00 and a move registered at 11:00 today
- **THEN** under "Hoy" the move is listed first and the expense after it

#### Scenario: Move rows do not react to taps
- **WHEN** the user taps a move row
- **THEN** nothing happens and the row shows no pressed state

#### Scenario: Moves not in 10 and 14
- **WHEN** the user opens Movimientos (10) or the detail of an account (14) after a move
- **THEN** the move is not listed and the "Salió" and "Entró" totals are unchanged
