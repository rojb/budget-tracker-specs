# Spec Delta

## MODIFIED Requirements

### Requirement: Create and list envelopes
An owner or editor SHALL be able to create an envelope with `POST /plans/{planId}/envelopes`,
sending a `name` (1 to 60 characters after trimming), optionally a `groupId` of a group of the same
plan, optionally an `icon` (one of a closed set of icon names, `tag` by default) and optionally a
`goal` (capability `envelope-goals`). The envelope SHALL be placed last in its group, or last among
the envelopes without a group. Two envelopes of the same plan SHALL NOT share a name, compared
without letter case (`409`). A `groupId` of another plan SHALL respond `404`. The response SHALL be
`201` with the envelope, which carries its `goal` and its `photoUrl` when it has them.
`GET /plans/{planId}/envelopes` SHALL return the plan's envelopes with, for a `month` (`YYYY-MM`,
default the current month in the plan's time zone), the `assignedMinor`, `spentMinor` and
`availableMinor` the budget engine derives for each, the `state` and, when it has a goal, the
`goalStatus` of capability `envelope-goals`, and the `readyToAssignMinor` of that month.

#### Scenario: New envelope in a group
- **WHEN** Sofía creates "Suscripciones" in "Día a día" with icon `tag`
- **THEN** the API responds `201` with the envelope in that group, after the group's other envelopes

#### Scenario: Envelope without a group
- **WHEN** a member creates an envelope without `groupId`
- **THEN** the envelope is created with no group and is listed after the grouped envelopes

#### Scenario: Duplicate envelope name
- **WHEN** the plan has "Transporte" and a member creates or renames an envelope to "transporte"
- **THEN** the API responds `409` and nothing changes

#### Scenario: Unknown icon
- **WHEN** a member sends an `icon` outside the closed set
- **THEN** the API responds `400` with a validation error

#### Scenario: New envelope starts empty
- **WHEN** an envelope is created in a plan with Ready to Assign 370.000
- **THEN** its `assignedMinor`, `spentMinor` and `availableMinor` are 0 and Ready to Assign stays 370.000

#### Scenario: List for a month
- **WHEN** a member lists the envelopes of a plan whose Transporte has 20.000 assigned in 2026-09 and requests `month=2026-09`
- **THEN** Transporte has `assignedMinor` 20.000, `spentMinor` 0 and `availableMinor` 20.000 and the response carries the month's Ready to Assign

#### Scenario: List with spending
- **WHEN** Supermercado has 60.000 assigned in 2026-09 and an 18.450 expense is recorded on it in that month
- **THEN** the list for `month=2026-09` shows `assignedMinor` 60.000, `spentMinor` 18.450 and `availableMinor` 41.550

#### Scenario: List with state
- **WHEN** Transporte is overspent and Supermercado has a covered monthly goal
- **THEN** the list marks Transporte `overspent` and Supermercado `funded`, and Supermercado's line carries its `goalStatus`

### Requirement: Plan tab with envelopes
When the active plan has at least one envelope, the Plan tab SHALL show screen 02 Plan del mes for
the current month: the `layers` button (→ 32), the search button (filters envelopes by name in
place), the month switch, the `JoinedCard` with "Listo para asignar" and the number of "Sobres
activos", and, for each group in order, a group header (name, "<amount> disponible" subtotal and a
"+" that opens 31 with that group preselected) followed by its envelopes as `EnvelopeRow`s;
envelopes without a group SHALL follow under "Sin grupo". An envelope row shows the icon, the name,
"<spent> de <assigned>" and the available amount with its state taken from the API's `state`:
Funded ("Disponible", or "Cubierto" with full stripes when it has a goal), Underfunded ("Falta
<missing>" with partial stripes), Overspent (red, "Sobregirado") or Empty (nothing assigned, no
goal). Tapping a row SHALL open 22 Detalle de sobre. The "+" of the `JoinedCard`, the status filter
chips and the change of month belong to `add-monthly-assignment` and SHALL stay inert or
placeholder routes here.

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

### Requirement: New envelope screen
Screen 31 Nuevo sobre SHALL open from the "+" of a group in 02, from "Crear sobre vacío" in 06 or from
"+ Nueva meta" in 01 and show the subtitle "Sumá un sobre a <group>", the name and group as
`FieldRow`s (the group opens 52), an icon selector, the objective block "Objetivo (opcional)" with
the chips "Sin objetivo", "Mensual" and "Con fecha", the target in the `AmountCapsule` with quick
amounts and, for "Con fecha", the "Fecha límite" row, a "Foto" row (→ 50) when the group is "Metas"
(compared without letter case) or the objective is "Con fecha", and the `SaveBar` "Crear sobre".
Creating SHALL send the goal, if any, show "Guardado" and return to the previous screen, which shows
the new envelope; the chosen photo, if any, is applied right after the envelope exists. A duplicate
name SHALL show "Ya tenés un sobre con ese nombre" on the field and save nothing.

#### Scenario: Create from a group
- **WHEN** the user taps "+" on "Día a día", names the envelope "Suscripciones" and confirms
- **THEN** the envelope is created in "Día a día" and 02 lists it

#### Scenario: Create from an empty plan
- **WHEN** the user taps "Crear sobre vacío" in 06 and confirms a name
- **THEN** the envelope is created and the Plan tab shows 02 with "1 Sobres activos"

#### Scenario: Create with a monthly goal
- **WHEN** the user names "Suscripciones", picks "Mensual", 50.000 and confirms
- **THEN** the envelope is created with that goal

#### Scenario: New goal from Inicio
- **WHEN** the user opens 31 from "+ Nueva meta"
- **THEN** the group is "Metas" and the objective is "Con fecha", with the "Foto" row visible

#### Scenario: Duplicate name
- **WHEN** the user saves a name another envelope already has
- **THEN** the name field shows the error and nothing is saved

### Requirement: Delete confirmations
Screen 44 Eliminar grupo SHALL confirm "¿Eliminar "<group>"?" as a sheet showing the group, its
envelope count, the note "Sus N sobres pasan a «Sin grupo». No se pierde dinero ni movimientos." and
Cancelar / Eliminar (solid `danger`); Eliminar deletes the group and returns to 32. Screen 43
Eliminar sobre SHALL confirm "¿Eliminar "<envelope>"?" showing the envelope with its group and
available amount, the note "Sus movimientos pasan a «Sin sobre». Los <amount> disponibles vuelven a
Listo para asignar." and Cancelar / Eliminar; Eliminar deletes the envelope and returns to the Plan
tab. Nothing SHALL be deleted without passing through these sheets. The only entry points of 43 are
the trash of the edit screen 23 and "Eliminar meta" of 40; no gesture on a row of 02 SHALL delete
an envelope.

#### Scenario: Delete a group from 32
- **WHEN** the user taps the trash of "Día a día" and then Eliminar
- **THEN** the group is deleted, 32 no longer lists it and the envelopes appear under "Sin grupo" in 02

#### Scenario: Delete an envelope from 23
- **WHEN** the user taps the trash of 23 and then Eliminar in 43
- **THEN** the envelope is deleted and the Plan tab opens without it

#### Scenario: Cancel
- **WHEN** the user taps Cancelar in 43 or 44
- **THEN** the sheet closes and nothing is deleted

#### Scenario: No gesture on the row
- **WHEN** the user long-presses an envelope row of 02
- **THEN** nothing is deleted and no confirmation opens
