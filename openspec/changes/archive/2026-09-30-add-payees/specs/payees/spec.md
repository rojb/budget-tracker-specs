# Spec Delta

## Purpose

Lets plan members keep a reusable list of payees (who money goes to or comes from), each with an
optional suggested envelope, and retire a payee without losing it on past transactions.

## ADDED Requirements

### Requirement: Create a payee
The API SHALL let an owner or editor create a payee with `POST /plans/{planId}/payees`, sending a
`name` (1 to 60 characters after trimming) and optionally a `suggestedEnvelopeId`. Two active
payees of the same plan SHALL NOT share a name, compared without letter case; a duplicate SHALL
respond `409`. The response SHALL be `201` with the payee.

#### Scenario: New payee
- **WHEN** Sofía creates "Coto" in her plan
- **THEN** the API responds `201` with `{ id, name: "Coto", transactionCount: 0, deleted: false }`

#### Scenario: Duplicate name
- **WHEN** the plan already has an active payee "Coto" and a member creates "coto"
- **THEN** the API responds `409` and no second payee is created

#### Scenario: Invalid payee
- **WHEN** a member creates a payee with an empty name
- **THEN** the API responds `400` with a validation error

### Requirement: List and search payees
`GET /plans/{planId}/payees` SHALL return the plan's active payees ordered by name, paginated with
`page` and `pageSize`, and, with `q`, only those whose name contains `q` without letter case.
Each payee SHALL carry its id, name, suggested envelope (if any), the number of transactions that
reference it and `deleted: false`. Deleted payees SHALL NOT be listed.

#### Scenario: Canonical list
- **WHEN** the plan has Coto, Edenor, Estudio Pérez SRL, Farmacity, Rappi and YPF
- **THEN** the list returns the six in alphabetical order with `total: 6`

#### Scenario: Search
- **WHEN** a member lists with `q=far`
- **THEN** only Farmacity is returned

### Requirement: Read and edit a payee
`GET /plans/{planId}/payees/{payeeId}` SHALL return the payee to any member, including a deleted
one (so past transactions can show it), with `deleted: true` in that case. An owner or editor
SHALL be able to change the name and the suggested envelope of an active payee with `PATCH`;
editing a deleted payee SHALL respond `404`.

#### Scenario: Rename
- **WHEN** an editor renames "Coto" to "Coto Digital"
- **THEN** the API responds `200` with the new name and transactions that reference it show the new name

#### Scenario: Deleted payee is still readable
- **WHEN** a member requests a payee that was deleted
- **THEN** the API responds `200` with the payee and `deleted: true`

### Requirement: Soft delete keeps history
An owner or editor SHALL be able to delete a payee with `DELETE /plans/{planId}/payees/{payeeId}`.
The deletion SHALL be logical: the payee stops being listed and offered for new transactions, but
every past transaction keeps referencing it and keeps showing its name (FR-05). The response SHALL
be `204`; deleting an already deleted payee SHALL respond `404`. Its name SHALL become available
for a new payee.

#### Scenario: Delete a payee with movements
- **WHEN** Coto, referenced by 14 transactions, is deleted
- **THEN** Coto disappears from the list, the 14 transactions still show "Coto", and a new payee named "Coto" can be created

#### Scenario: Delete twice
- **WHEN** a member deletes a payee that is already deleted
- **THEN** the API responds `404`

### Requirement: Payees screen
Screen 15 Beneficiarios SHALL open from "Beneficiarios" in 39 and show the active payees in one
card as `PayeeRow`s (initials avatar, name, "<suggested envelope or Sin sobre> · N movimientos",
chevron), a search button that filters in place, a lavender "+" that opens 41 empty, and the note
"Al elegir un beneficiario, su sobre sugerido se completa solo.". With no payees it SHALL show
"Todavía no tenés beneficiarios" and "Se crean solos la primera vez que los usás en un
movimiento".

#### Scenario: Open a payee
- **WHEN** the user taps Coto in 15
- **THEN** screen 41 opens with Coto prefilled

#### Scenario: Search in place
- **WHEN** the user taps the search button and types "rap"
- **THEN** only Rappi remains in the list without leaving the screen

### Requirement: Payee form and delete confirmation
Screen 41 SHALL show "Nuevo beneficiario" or "Editar beneficiario" with the name and suggested
envelope as `FieldRow`s, the movement count with "Ver movimientos" (→ 10), and the `SaveBar`
("Crear beneficiario" / "Guardar cambios"); when editing, a red trash `IconButton` opens 47. Screen
47 SHALL confirm "¿Eliminar "<name>"?" showing the payee and its movement count, the note that the
movements are kept with that payee, and Cancelar / Eliminar (solid `danger`); Eliminar deletes it
and returns to 15.

#### Scenario: Create from 15
- **WHEN** the user taps "+", names the payee "Verdulería" and confirms
- **THEN** the payee is created, "Guardado" shows and 15 lists it

#### Scenario: Delete from 41
- **WHEN** the user taps the trash icon in 41 and then Eliminar
- **THEN** the payee is deleted, 15 opens without it and the toast "Beneficiario eliminado" appears

#### Scenario: Duplicate name in the form
- **WHEN** the user saves a name another active payee already has
- **THEN** the name field shows "Ya tenés un beneficiario con ese nombre" and nothing is saved
