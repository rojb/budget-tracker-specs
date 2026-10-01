## MODIFIED Requirements

### Requirement: Envelope detail
`GET /plans/{planId}/envelopes/{envelopeId}/detail` SHALL return to any member (FR-24), for a
`month` (`YYYY-MM`, the current month of the plan's time zone by default), the envelope line of
that month (envelope with its goal and photo, the assigned, spent and available amounts, the
state and the goal status), its `carryoverMinor`, and the month's activity: the transactions that
have a portion on the envelope and whose local date in the plan's time zone is in that month, newest
first by registration instant (`createdAt`, ties by id), at most 100 of them, with `activityTotal`
counting all of them. Each activity item SHALL have the shape of a listed transaction. An envelope
of another plan, or one that does not exist, SHALL respond `404`.

#### Scenario: Month activity
- **WHEN** Supermercado has an 18.450 expense registered today and a 42.100 expense registered yesterday in 2026-09
- **THEN** the detail for 2026-09 lists them in that order, `activityTotal` is 2 and `spentMinor` is 60.550

#### Scenario: Income to the envelope
- **WHEN** a 3.500 income was directed to the envelope in the month
- **THEN** it is part of the activity and lowers `spentMinor`

#### Scenario: Month without movements
- **WHEN** the envelope has no transactions in the month
- **THEN** `activity` is empty and `activityTotal` is 0

#### Scenario: Another month
- **WHEN** the detail is requested for 2026-08
- **THEN** the figures, the state and the activity are those of August

#### Scenario: Other plan or missing envelope
- **WHEN** a member asks for the detail of an envelope of another plan
- **THEN** the API responds `404`

### Requirement: Envelope detail screen
Screen 22 Detalle de sobre SHALL open from an `EnvelopeRow` of 02 and from the tiles of 05. It SHALL
show a back button, a pencil that opens 23 (hidden for a viewer), the envelope's icon, its name
(30) and group, a card with the Asignado, Disponible and Gastado of the month, the goal row, the
section "Actividad de <month>" with the month's transactions as `TxRow`s grouped by the day they
were registered, last registered first, with the date of the movement before the time when it
differs from that day (a tap opens
12) and, for an owner or editor, a primary button "Mover dinero" that opens 24. The goal row of a
`monthly` goal SHALL read "Objetivo mensual" with "<target> · <percent>% asignado" and a stripe
progress bar; of a `targetByDate` goal, "Meta <target> · <month of the due date>" with
"<percent>% ahorrado"; when the envelope is `underfunded` it SHALL add "Falta <missing> este mes",
and when `overspent` it SHALL say "Sobregirado" in red with a full red bar. Without a goal it SHALL
say "Sin objetivo". With no movements it SHALL show "Sin movimientos este mes"; while loading, at
least three skeleton rows; on failure, a retry. No state SHALL be conveyed by color alone.

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
- **WHEN** the user taps a movement of the activity
- **THEN** screen 12 opens with it

#### Scenario: Viewer
- **WHEN** a viewer opens 22
- **THEN** there is no pencil and no "Mover dinero" button
