# envelopes Specification

## Purpose
TBD - created by archiving change add-envelopes. Update Purpose after archive.

## Requirements

### Requirement: Envelope groups
A plan SHALL hold ordered envelope groups. An owner or editor SHALL be able to create one with
`POST /plans/{planId}/envelope-groups`, sending a `name` (1 to 60 characters after trimming); the
response SHALL be `201` with the group, placed after the existing ones. Two groups of the same plan
SHALL NOT share a name, compared without letter case (`409`). `GET /plans/{planId}/envelope-groups`
SHALL return the groups in order, each with its id, name, position, number of envelopes and
creation instant. `PATCH /plans/{planId}/envelope-groups/{groupId}` SHALL rename a group (`409` on
a duplicate name).

#### Scenario: New group
- **WHEN** Sofía creates the group "Hogar" in a plan that has four groups
- **THEN** the API responds `201` with `{ name: "Hogar", position: 4, envelopeCount: 0 }` and the list returns it last

#### Scenario: Duplicate group name
- **WHEN** the plan has "Día a día" and a member creates or renames a group to "día a día"
- **THEN** the API responds `409` and nothing changes

#### Scenario: Invalid group
- **WHEN** a member creates a group with an empty name or one of 61 characters
- **THEN** the API responds `400` with a validation error

#### Scenario: Group of another plan
- **WHEN** a member renames a group using the id of a group of another plan
- **THEN** the API responds `404`

### Requirement: Reorder groups
An owner or editor SHALL be able to set the order of the groups with `PUT
/plans/{planId}/envelope-groups/order`, sending `groupIds`: every group of the plan exactly once,
in the desired order. The response SHALL be `200` with the groups in the new order. A list that
misses a group, repeats one or names a group of another plan SHALL respond `400` and leave the
order unchanged.

#### Scenario: Move a group up
- **WHEN** the plan has Obligaciones, Día a día, Disfrutar, Metas and the member sends them as Día a día, Obligaciones, Disfrutar, Metas
- **THEN** the API responds `200` and every later list shows that order

#### Scenario: Incomplete order
- **WHEN** a member sends only three of the four group ids
- **THEN** the API responds `400` and the order is unchanged

### Requirement: Delete a group
An owner or editor SHALL be able to delete a group with `DELETE
/plans/{planId}/envelope-groups/{groupId}` (`204`). Its envelopes SHALL NOT be deleted: they stay in
the plan, without a group ("Sin grupo"), keeping their assignments and transactions, so no money or
movement is lost. Envelopes without a group SHALL be listed after every group.

#### Scenario: Delete a group with envelopes
- **WHEN** "Día a día" with 4 envelopes is deleted
- **THEN** the API responds `204`, the 4 envelopes still exist without a group with their assigned amounts unchanged, and Ready to Assign does not change

#### Scenario: Viewer deletes
- **WHEN** a viewer deletes a group
- **THEN** the API responds `403` and the group still exists

### Requirement: Create and list envelopes
An owner or editor SHALL be able to create an envelope with `POST /plans/{planId}/envelopes`,
sending a `name` (1 to 60 characters after trimming), optionally a `groupId` of a group of the same
plan and optionally an `icon` (one of a closed set of icon names, `tag` by default). The envelope
SHALL be placed last in its group, or last among the envelopes without a group. Two envelopes of the
same plan SHALL NOT share a name, compared without letter case (`409`). A `groupId` of another plan
SHALL respond `404`. The response SHALL be `201` with the envelope. `GET /plans/{planId}/envelopes`
SHALL return the plan's envelopes with, for a `month` (`YYYY-MM`, default the current month in the
plan's time zone), the `assignedMinor`, `spentMinor` and `availableMinor` the budget engine derives
for each, and the `readyToAssignMinor` of that month.

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

### Requirement: Read, edit and move an envelope
`GET /plans/{planId}/envelopes/{envelopeId}` SHALL return an envelope to any member. An owner or
editor SHALL be able to change its `name`, `icon` and `groupId` with `PATCH`, at least one field
being sent; moving it to another group places it last there. An envelope of another plan, or one
that does not exist, SHALL respond `404`.

#### Scenario: Rename and move
- **WHEN** an editor renames "Suscripciones" to "Streaming" and moves it to "Disfrutar"
- **THEN** the API responds `200` with the new name and group, and it is the last envelope of "Disfrutar"

#### Scenario: Empty edit
- **WHEN** a member sends `PATCH` with an empty body
- **THEN** the API responds `400`

### Requirement: Reorder envelopes
An owner or editor SHALL be able to set the order of the envelopes of one group, or of the
envelopes without a group, with `PUT /plans/{planId}/envelopes/order`, sending `envelopeIds` (every
envelope currently in that scope exactly once, in the desired order) and, for a group, its
`groupId`. The response SHALL be `200` with those envelopes in the new order. An incomplete or
repeated list, or an envelope that is not in that scope, SHALL respond `400` and change nothing.

#### Scenario: Reorder inside a group
- **WHEN** "Día a día" holds Transporte, Supermercado, Farmacia, Comida afuera and the member sends Supermercado, Transporte, Farmacia, Comida afuera
- **THEN** the API responds `200` and every list shows that order inside the group

#### Scenario: Envelope from another group
- **WHEN** the member includes an envelope of "Metas" in the order of "Día a día"
- **THEN** the API responds `400` and nothing changes

### Requirement: Delete an envelope
An owner or editor SHALL be able to delete an envelope with `DELETE
/plans/{planId}/envelopes/{envelopeId}` (`204`). Its assignments SHALL be deleted with it, so the
money it had available returns to Ready to Assign. Transactions that used the envelope SHALL NOT be
deleted: they keep their amount, account and date and have no envelope ("Sin sobre"). Payees that
suggested it SHALL have no suggested envelope afterwards.

#### Scenario: Delete a funded envelope
- **WHEN** Supermercado with 47.550 available is deleted while Ready to Assign is 48.200
- **THEN** the API responds `204` and Ready to Assign becomes 95.750

#### Scenario: Envelope with movements
- **WHEN** an envelope that transactions reference is deleted
- **THEN** the transactions still exist with their amounts and have no envelope

#### Scenario: Deleted twice
- **WHEN** a member deletes an envelope that no longer exists
- **THEN** the API responds `404`

### Requirement: Suggested starter template
`GET /envelope-template` SHALL return the suggested template, the same for every plan: four groups
and twelve envelopes, in this order, each envelope with its icon: Obligaciones (Alquiler, Servicios,
Internet y celular), Día a día (Transporte, Supermercado, Farmacia, Comida afuera), Disfrutar
(Salidas, Suscripciones, Regalos) and Metas (Emergencia, Vacaciones).

#### Scenario: Canonical template
- **WHEN** a signed-in user requests the template
- **THEN** it lists the four groups and twelve envelopes above in that order

### Requirement: Apply the template
An owner or editor SHALL be able to create the template's envelopes at once with `POST
/plans/{planId}/envelope-groups/template`, optionally sending `envelopeNames` (the names of the
template envelopes to create; all twelve when omitted). The envelopes SHALL be created with no
assigned amount, in the template order, inside their groups; a group with no selected envelope SHALL
NOT be created and a group of the plan with the same name (ignoring case) SHALL be reused instead
of duplicated. The operation SHALL be atomic and only allowed in a plan that has no envelopes
(`409` otherwise). The response SHALL be `201` with the groups and envelopes of the plan. A name
that is not in the template SHALL respond `400`.

#### Scenario: Full template
- **WHEN** a member applies the template to an empty plan
- **THEN** the API responds `201` and the plan has 4 groups and 12 envelopes, all with 0 assigned, and Ready to Assign is unchanged

#### Scenario: Unticked envelope
- **WHEN** the member sends eleven names, leaving out "Regalos"
- **THEN** 11 envelopes are created, "Disfrutar" holds Salidas and Suscripciones only, and all four groups exist

#### Scenario: Whole group unticked
- **WHEN** the member leaves out both Metas envelopes
- **THEN** the group "Metas" is not created

#### Scenario: Plan already has envelopes
- **WHEN** the template is applied to a plan that already has an envelope
- **THEN** the API responds `409` and creates nothing

#### Scenario: Existing empty group
- **WHEN** the plan has an empty group "Día a día" and the template is applied
- **THEN** the template's Día a día envelopes go into that group and no second "Día a día" is created

### Requirement: Initial bulk assignment
An owner or editor SHALL be able to give money to several envelopes at once with `POST
/plans/{planId}/envelopes/initial-assignment`, sending `assignments` (each an `envelopeId` of the
plan and an `amountMinor`, a non-negative integer in the plan currency's minor units) and optionally
a `month` (default the current month in the plan's time zone). Each amount SHALL be stored as the
envelope's assignment for that month through the budget engine's assignment facts, replacing any
assignment that envelope already had for that month. The operation SHALL be atomic. The response
SHALL be `200` with the `month`, the total assigned in it and the month's `readyToAssignMinor`,
which MAY be negative when more is assigned than is available (it SHALL NOT be clamped and SHALL NOT
block the operation). An envelope of another plan SHALL respond `404`; a repeated envelope, a
negative or non-integer amount SHALL respond `400`; nothing is stored in either case.

#### Scenario: Canonical onboarding
- **WHEN** the plan has 370.000 in its accounts and the member assigns Alquiler 280.000, Transporte 20.000 and Supermercado 60.000
- **THEN** the API responds `200` with `readyToAssignMinor` 10.000 and each envelope has that amount assigned and available for the month

#### Scenario: Over-assigned
- **WHEN** the member assigns 380.000 in total against 370.000 available
- **THEN** the API responds `200` with `readyToAssignMinor` −10.000, reported as negative

#### Scenario: Invalid amount
- **WHEN** the member sends an amount of 10.5 or −1
- **THEN** the API responds `400` and no envelope is changed

#### Scenario: Repeating the assignment
- **WHEN** the same call is sent again with Alquiler 300.000
- **THEN** Alquiler's assignment for the month is 300.000, not 580.000

#### Scenario: Foreign envelope
- **WHEN** one of the ids belongs to another plan
- **THEN** the API responds `404` and no envelope of the request is changed

### Requirement: Envelope authorization
Every envelope and group endpoint SHALL require the caller to be a member of the plan. Members of
any role SHALL read (groups, envelopes, figures); `owner` and `editor` SHALL create, edit, reorder,
delete, apply the template and assign; a `viewer` SHALL receive `403` on each of those. A user who
is not a member, or a plan that does not exist, SHALL receive `404`.

#### Scenario: Viewer creates
- **WHEN** a viewer creates an envelope
- **THEN** the API responds `403` and nothing is created

#### Scenario: Viewer reads
- **WHEN** a viewer lists the envelopes
- **THEN** the API responds `200`

#### Scenario: Non-member
- **WHEN** a user who is not a member lists or creates envelopes of the plan
- **THEN** the API responds `404` with the standard error shape

### Requirement: Plan tab with envelopes
When the active plan has at least one envelope, the Plan tab SHALL show screen 02 Plan del mes for
the current month: the `layers` button (→ 32), the search button (filters envelopes by name in
place), the month switch, the `JoinedCard` with "Listo para asignar" and the number of "Sobres
activos", and, for each group in order, a group header (name, "<amount> disponible" subtotal and a
"+" that opens 31 with that group preselected) followed by its envelopes as `EnvelopeRow`s;
envelopes without a group SHALL follow under "Sin grupo". An envelope row shows the icon, the name,
"<spent> de <assigned>" and the available amount with its state: Funded ("Disponible"), Overspent
(red, "Sobregirado") or Empty (nothing assigned). The "+" of the `JoinedCard`, the row tap, the
status filter chips and the change of month belong to `add-monthly-assignment` and
`add-envelope-goals` and SHALL stay inert or placeholder routes here.

#### Scenario: Plan with a funded and an empty envelope
- **WHEN** Transporte has 45.000 assigned and Alquiler nothing
- **THEN** Transporte is listed as Funded with its available amount and Alquiler as Empty, each under its group

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
Screen 31 Nuevo sobre SHALL open from the "+" of a group in 02 or from "Crear sobre vacío" in 06 and
show the subtitle "Sumá un sobre a <group>", the name and group as `FieldRow`s (the group opens 52),
an icon selector and the `SaveBar` "Crear sobre". Creating SHALL show "Guardado" and return to the
Plan tab, which shows the new envelope. A duplicate name SHALL show "Ya tenés un sobre con ese
nombre" on the field and save nothing. The goal fields ("Objetivo") belong to `add-envelope-goals`.

#### Scenario: Create from a group
- **WHEN** the user taps "+" on "Día a día", names the envelope "Suscripciones" and confirms
- **THEN** the envelope is created in "Día a día" and 02 lists it

#### Scenario: Create from an empty plan
- **WHEN** the user taps "Crear sobre vacío" in 06 and confirms a name
- **THEN** the envelope is created and the Plan tab shows 02 with "1 Sobres activos"

#### Scenario: Duplicate name
- **WHEN** the user saves a name another envelope already has
- **THEN** the name field shows the error and nothing is saved

### Requirement: Choose a group sheet
Screen 52 Elegir grupo SHALL open from the "Grupo" row of 31 as a bottom sheet listing the groups
with their envelope count and a radio with the current one checked in lavender, without a search
field. Its last row "+ Nuevo grupo" SHALL expand in place into a name field and "Crear", which
creates the group, selects it and closes the sheet. Choosing a row selects it and closes the sheet.

#### Scenario: Pick a group
- **WHEN** the user taps "Disfrutar"
- **THEN** the sheet closes and 31 shows "Disfrutar" as the group

#### Scenario: Create a group from the sheet
- **WHEN** the user expands "+ Nuevo grupo", types "Hogar" and taps "Crear"
- **THEN** the group "Hogar" exists, is selected and the sheet closes

### Requirement: Groups screen
Screen 32 Grupos SHALL open from the `layers` button of 02 and 06 and list the groups as `GroupRow`s
(name and "N sobres") with a drag handle to reorder, a pencil that renames in place and a red trash
that opens 44, plus a "Nuevo grupo" field with a "+" that creates the group in place, and the note
"Al borrar un grupo, sus sobres pasan a «Sin grupo». No se pierde dinero ni movimientos.". Reordering
SHALL be saved when the drag ends.

#### Scenario: Reorder
- **WHEN** the user drags "Metas" above "Disfrutar"
- **THEN** the order is saved and 02 lists the groups in that order

#### Scenario: Rename in place
- **WHEN** the user taps the pencil of "Día a día", types "Diario" and confirms
- **THEN** the group is renamed and the list shows it

#### Scenario: Create a group
- **WHEN** the user types "Hogar" in "Nuevo grupo" and taps "+"
- **THEN** the group is added at the end of the list

#### Scenario: Duplicate group name
- **WHEN** the user creates or renames a group to a name another group has
- **THEN** the field shows "Ya tenés un grupo con ese nombre" and nothing is saved

### Requirement: Delete confirmations
Screen 44 Eliminar grupo SHALL confirm "¿Eliminar "<group>"?" as a sheet showing the group, its
envelope count, the note "Sus N sobres pasan a «Sin grupo». No se pierde dinero ni movimientos." and
Cancelar / Eliminar (solid `danger`); Eliminar deletes the group and returns to 32. Screen 43
Eliminar sobre SHALL confirm "¿Eliminar "<envelope>"?" showing the envelope with its group and
available amount, the note "Sus movimientos pasan a «Sin sobre». Los <amount> disponibles vuelven a
Listo para asignar." and Cancelar / Eliminar; Eliminar deletes the envelope and returns to the Plan
tab. Nothing SHALL be deleted without passing through these sheets. The entry point of 43 is the
edit screen of the envelope (`add-envelope-goals`); this change delivers the sheet and the endpoint.

#### Scenario: Delete a group from 32
- **WHEN** the user taps the trash of "Día a día" and then Eliminar
- **THEN** the group is deleted, 32 no longer lists it and the envelopes appear under "Sin grupo" in 02

#### Scenario: Cancel
- **WHEN** the user taps Cancelar in 43 or 44
- **THEN** the sheet closes and nothing is deleted

### Requirement: Suggested template screen
Screen 35 Plantilla sugerida SHALL open from "Usar plantilla sugerida" in 06 and list the
template's twelve envelopes under the labels OBLIGACIONES, DÍA A DÍA, DISFRUTAR and METAS, each with
its icon and a lavender check, all ticked and untickable one by one, the note "Se crean sin objetivo
y en $ 0. Después los ajustás." and a primary button whose label counts the ticked envelopes ("Crear
12 sobres", "Crear 11 sobres"); with none ticked the button SHALL be disabled. Confirming SHALL
apply the template with the ticked names and open 46.

#### Scenario: Create all
- **WHEN** the user keeps the twelve ticked and taps "Crear 12 sobres"
- **THEN** the template is applied and 46 opens with the twelve new envelopes

#### Scenario: Untick one
- **WHEN** the user unticks "Regalos"
- **THEN** the button reads "Crear 11 sobres" and only eleven are created

### Requirement: Assign your money screen
Screen 46 Asigná tu dinero SHALL open after the template is created and show the plan's Ready to
Assign, the new envelopes grouped under the same labels as 35, each with an amount pill ("$ 0"
muted when nothing is entered) that opens an amount editor, and the live note "Te quedan <amount>
por asignar" (the Ready to Assign minus what is entered; a warning text "Te pasaste <amount>" when
negative, which does not block). "Listo" SHALL send the non-zero amounts through the initial bulk
assignment and open the Plan tab; the close button SHALL open the Plan tab without assigning.

#### Scenario: Distribute the opening balance
- **WHEN** the plan has 370.000 and the user enters Alquiler 280.000, Transporte 20.000 and Supermercado 60.000
- **THEN** the note reads "Te quedan $ 10.000 por asignar" and "Listo" assigns those three amounts

#### Scenario: Skip
- **WHEN** the user taps the close button
- **THEN** the Plan tab opens and every envelope has 0 assigned

#### Scenario: Over-assigning
- **WHEN** the entered amounts exceed the Ready to Assign
- **THEN** the note warns with the excess and "Listo" still works, leaving a negative Ready to Assign
