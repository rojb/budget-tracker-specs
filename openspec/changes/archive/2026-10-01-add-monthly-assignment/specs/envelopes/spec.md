# Spec Delta

## MODIFIED Requirements

### Requirement: Plan tab with envelopes
When the active plan has at least one envelope, the Plan tab SHALL show screen 02 Plan del mes for
the viewed month (the current one when the tab opens): the `layers` button (→ 32), the search button (filters envelopes by name in
place), the month switch, the `JoinedCard` with "Listo para asignar" and the number of "Sobres
activos", and, for each group in order, a group header (name, "<amount> disponible" subtotal and a
"+" that opens 31 with that group preselected) followed by its envelopes as `EnvelopeRow`s;
envelopes without a group SHALL follow under "Sin grupo". An envelope row shows the icon, the name,
"<spent> de <assigned>" and the available amount with its state taken from the API's `state`:
Funded ("Disponible", or "Cubierto" with full stripes when it has a goal), Underfunded ("Falta
<missing>" with partial stripes), Overspent (red, "Sobregirado") or Empty (nothing assigned, no
goal). Tapping a row SHALL open 22 Detalle de sobre. The "+" of the `JoinedCard` (→ 03), the
status filter chips, the change of month and the future month view are defined by the
`monthly-assignment` capability.

#### Scenario: Plan with a funded and an empty envelope
- **WHEN** Transporte has 45.000 assigned and Alquiler nothing
- **THEN** Transporte is listed as Funded with its available amount and Alquiler as Empty, each under its group

#### Scenario: Underfunded row
- **WHEN** Supermercado has a monthly goal of 180.000 and 100.000 assigned
- **THEN** its row is Underfunded and reads "Falta $ 80.000" under the amount

#### Scenario: Open the detail
- **WHEN** the user taps an envelope row
- **THEN** screen 22 opens for that envelope

#### Scenario: Plus of a group
- **WHEN** the user taps the "+" next to "Día a día"
- **THEN** screen 31 opens with "Día a día" as the group

#### Scenario: Search in place
- **WHEN** the user taps the search button and types "super"
- **THEN** only Supermercado remains, without leaving the screen

#### Scenario: Ungrouped envelopes
- **WHEN** a group is deleted and its envelopes lose their group
- **THEN** 02 lists them at the end under "Sin grupo"
