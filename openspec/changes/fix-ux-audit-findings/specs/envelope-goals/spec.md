## MODIFIED Requirements

### Requirement: Move money screen
Screen 24 Mover dinero SHALL open from "Mover dinero" in 22 and 05 and show a close button, the title,
"Desde" and "Hacia" cards (each an `EnvelopeRow` with its icon, "<spent> de <assigned>", its
Available and its state, and the arrow between them), each opening the envelope picker 36, the
amount in the `AmountCapsule` with quick amounts and the `SaveBar` "Mover <amount>". The source
SHALL be the envelope the screen was opened from. When the destination is `overspent`, the amount SHALL
start as its overspending, capped at the source's Available, and be the first quick amount. The quick
amounts SHALL sit in fixed slots of equal width, and choosing the destination SHALL NOT move them: the
slot of the overspending amount is reserved from the start. The `SaveBar` SHALL be Disabled, with the
reason ("Elegí un sobre", "Ingresá un monto" or "Supera lo disponible"), until both envelopes differ,
the amount is positive and it does not exceed the source's Available. Confirming SHALL move the money,
return to the previous screen with every figure refreshed and show a toast that says what moved:
"Movido <amount> a <destination>" with the source's name as detail. A viewer SHALL see that their role
is read-only.

#### Scenario: Cover the overspending
- **WHEN** the user opens 24 from Supermercado (47.550 available) and picks Transporte at −6.200
- **THEN** the amount is 6.200, the bar reads "Mover $ 6.200" and confirming leaves Transporte at 0 and Supermercado at 41.350

#### Scenario: Too much
- **WHEN** the user keys 50.000 and the source has 47.550
- **THEN** the `SaveBar` is Disabled with "Supera lo disponible"

#### Scenario: Same envelope
- **WHEN** the user picks the source as the destination
- **THEN** the destination is not accepted and the `SaveBar` stays Disabled

#### Scenario: Refused by the API
- **WHEN** the API responds `409` because the money changed meanwhile
- **THEN** the screen says "Ya no hay tanto disponible" and nothing moves

#### Scenario: Feedback after the move
- **WHEN** the user moves 10.000 from Supermercado to Salidas
- **THEN** the screen closes and the toast reads "Movido $ 10.000 a Salidas" with "Desde Supermercado" as detail

#### Scenario: Quick amounts stay in place
- **WHEN** the user chooses the destination after looking at the quick amounts
- **THEN** the chips already shown keep their position and size

### Requirement: Envelope detail screen
Screen 22 Detalle de sobre SHALL open from an `EnvelopeRow` of 02 and from the tiles of 05. It SHALL
show a back button, a pencil that opens 23 (hidden for a viewer), the envelope's icon, its name
(30) and group, a card with the Asignado, Disponible and Gastado of the month, the goal row, the
section "Actividad de <month>" with the month's transactions and moves as `TxRow`s, merged and
grouped by the day they were registered, last registered first, with the date of the movement before
the time when it differs from that day (a tap on a transaction opens
12) and, for an owner or editor, a primary button "Mover dinero" that opens 24. In the card, Disponible
SHALL be the emphasized figure (larger, `ink`, in the middle) and Asignado and Gastado the secondary
ones, each figure on one line that scales down to fit its column with at least 12 dp between columns.
A move SHALL be a
`TxRow` with a left-right arrows icon: on the source, the title "Movido a <envelope>" and the amount
with a `−` sign; on the destination, the title "Movido desde <envelope>" and the amount with a `+`
sign in the lavender capsule used by income; the subtitle SHALL be the time it was registered,
preceded by its day and short month when the month it was made for is not the month it was registered
in. The title of a move SHALL be one line that ends with an ellipsis, so a move row is as tall as the
other `TxRow`s. A move row SHALL NOT react to a tap, have no chevron and no pressed state, because a
move is not a transaction and has no screen. The goal row of a
`monthly` goal SHALL read "Objetivo mensual" with "<target> · <percent>% asignado" and a stripe
progress bar; of a `targetByDate` goal, "Meta <target> · <month of the due date>" with
"<percent>% ahorrado"; when the envelope is `underfunded` it SHALL add "Falta <missing> este mes",
and when `overspent` it SHALL say "Sobregirado" in red with a full red bar. Without a goal it SHALL
say "Sin objetivo". With no movements and no moves it SHALL show "Sin movimientos este mes"; while
loading, at least three skeleton rows; on failure, a retry. No state SHALL be conveyed by color alone.

#### Scenario: Monthly goal covered
- **WHEN** the user opens Supermercado, with a monthly goal of 180.000 fully assigned
- **THEN** 22 shows "$ 180.000 Asignado", "$ 47.550 Disponible", "$ 132.450 Gastado", "Objetivo mensual" with "$ 180.000 · 100% asignado" and full stripes, and the month's movements

#### Scenario: Disponible stands out
- **WHEN** the user opens any envelope on 22
- **THEN** "Disponible" is the largest figure of the card and the other two are smaller, and a seven-digit amount does not touch its neighbor

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

#### Scenario: Long envelope name in a move
- **WHEN** the move is to an envelope named "Fondo de emergencia y ahorro familiar"
- **THEN** the title stays on one line with an ellipsis and the row is as tall as an expense row

#### Scenario: Moves among transactions
- **WHEN** an envelope has an expense registered at 10:00 and a move registered at 11:00 today
- **THEN** under "Hoy" the move is listed first and the expense after it

#### Scenario: Move rows do not react to taps
- **WHEN** the user taps a move row
- **THEN** nothing happens and the row shows no pressed state

#### Scenario: Moves not in 10 and 14
- **WHEN** the user opens Movimientos (10) or the detail of an account (14) after a move
- **THEN** the move is not listed and the "Salió" and "Entró" totals are unchanged
