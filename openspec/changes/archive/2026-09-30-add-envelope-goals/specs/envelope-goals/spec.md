# Spec Delta

## ADDED Requirements

### Requirement: Envelope goal
An envelope MAY have one goal (FR-19), of one of two types. A `monthly` goal is an amount to assign
to the envelope every month. A `targetByDate` goal is an amount to have available in the envelope by
a due date. A goal SHALL have a `type`, a `targetMinor` (a positive integer in the plan currency's
minor units) and, for `targetByDate` only, a `dueDate` (a calendar date). An owner or editor SHALL
set or replace the goal with `PUT /plans/{planId}/envelopes/{envelopeId}/goal` (`200` with the
envelope) and remove it with `DELETE /plans/{planId}/envelopes/{envelopeId}/goal` (`200` with the
envelope, also when it had none), and MAY send the goal when creating an envelope. A `monthly` goal
that carries a `dueDate`, a `targetByDate` goal without one, a non-integer or non-positive target, an
unknown type or a `dueDate` in a month before the current month of the plan's time zone SHALL
respond `400` and change nothing. Every envelope the API returns SHALL carry its `goal` when it has
one and omit it otherwise. An envelope SHALL NOT need a goal: without one it behaves exactly as
before this capability.

#### Scenario: Monthly goal
- **WHEN** an editor sends `{ type: "monthly", targetMinor: 180000 }` for Supermercado
- **THEN** the API responds `200` with the envelope carrying that goal and no `dueDate`

#### Scenario: Goal with a date
- **WHEN** an editor sends `{ type: "targetByDate", targetMinor: 600000, dueDate: "2026-12-15" }` for Vacaciones
- **THEN** the API responds `200` and the envelope carries the target and the due date

#### Scenario: Replace the goal
- **WHEN** Supermercado has a monthly goal of 180.000 and an editor sends a monthly goal of 200.000
- **THEN** the envelope carries only the new goal

#### Scenario: Remove the goal
- **WHEN** an editor deletes the goal of an envelope
- **THEN** the API responds `200` with an envelope without `goal`, and deleting again also responds `200`

#### Scenario: Create with a goal
- **WHEN** an editor creates "Suscripciones" sending a monthly goal of 50.000
- **THEN** the API responds `201` with the envelope and its goal

#### Scenario: Invalid goal
- **WHEN** a member sends a monthly goal with a `dueDate`, a `targetByDate` goal without `dueDate`, a target of 0, −5 or 10.5, or a due date in a past month
- **THEN** the API responds `400` with a validation error and the envelope keeps the goal it had

### Requirement: Required amount for the month
For an envelope with a goal and a month `m`, the API SHALL derive the amount that has to be
assigned in `m` to be on track, `requiredMinor`, from the goal and the figures of the budget
engine, never from stored values. For a `monthly` goal it SHALL be the target. For a `targetByDate`
goal it SHALL be `max(0, ceil((target − Carryover) / N))`, where `Carryover` is the envelope's
carryover into `m` and `N` is the number of budget months from `m` to the month of the due date,
both included, and at least 1 (so, after the due month, the whole shortfall is required in one
month). The amount SHALL NOT depend on what was assigned in `m`, so it stays steady while the user
assigns.

#### Scenario: Monthly goal
- **WHEN** Supermercado has a monthly goal of 180.000
- **THEN** `requiredMinor` is 180.000 in every month

#### Scenario: Goal with a date
- **WHEN** in 2026-09 Vacaciones has a goal of 600.000 due in December and carries over 360.000
- **THEN** `N` is 4 (September to December) and `requiredMinor` is 60.000, the same whether 0 or 60.000 has been assigned in September

#### Scenario: Rounded up
- **WHEN** the shortfall of 100.000 has to be spread over 3 months
- **THEN** `requiredMinor` is 33.334

#### Scenario: Already reached
- **WHEN** the carryover of a `targetByDate` goal is at least its target
- **THEN** `requiredMinor` is 0

#### Scenario: Past the due month
- **WHEN** the viewed month is after the month of the due date and 240.000 are still missing
- **THEN** `N` is 1 and `requiredMinor` is 240.000

### Requirement: Derived envelope states
Every envelope line of a month SHALL carry a `state` (FR-20) that is one of `funded`,
`underfunded` or `overspent`, derived on every read from the engine's figures and the goal, in this
order: (1) `overspent` when the envelope's Available in the month is negative, with or without a
goal; (2) `underfunded` when it has a goal and the amount assigned in the month is lower than
`requiredMinor`; (3) `funded` otherwise, which includes every envelope without a goal and a zero
Available. The state SHALL be computed only by the API, in one place, for the envelope list, the
envelope detail and the move-money result, so every client and every filter reads the same
definition. The state SHALL NOT be stored.

#### Scenario: Monthly goal not yet assigned
- **WHEN** Supermercado has a monthly goal of 180.000 and 100.000 assigned in the month
- **THEN** its state is `underfunded` and it is missing 80.000

#### Scenario: Monthly goal covered
- **WHEN** 180.000 or more is assigned in the month
- **THEN** its state is `funded`

#### Scenario: Overspent wins
- **WHEN** an envelope with a covered goal has spent 6.200 more than it has available
- **THEN** its state is `overspent`

#### Scenario: Envelope without a goal
- **WHEN** an envelope has no goal, 45.000 available and nothing wrong
- **THEN** its state is `funded`

#### Scenario: State follows the facts
- **WHEN** an expense, an assignment or a move changes an envelope's figures
- **THEN** the next read returns the state that the new figures give, and no state was stored

#### Scenario: Month by month
- **WHEN** the list is requested for two months
- **THEN** each carries the state derived from that month's figures

### Requirement: Goal status in the month view
`GET /plans/{planId}/envelopes` SHALL return, for every envelope line, its `state` and, when the
envelope has a goal, a `goalStatus` with `requiredMinor`, `missingMinor` (`max(0, required −
assigned)`, what the month still needs), `savedMinor` (the Assigned of the month for a `monthly`
goal, and the Available, floored at 0, for a `targetByDate` goal), `remainingMinor` (`max(0, target
− saved)`), `percent` (an integer from 0 to 100, `saved` over `target`, floored and capped) and,
for a `targetByDate` goal only, `monthsRemaining` (the months from the viewed month to the due
month, never below 0). The envelope in each line SHALL carry its `goal`. The existing figures
(`assignedMinor`, `spentMinor`, `availableMinor`) and the plan's `readyToAssignMinor` SHALL NOT
change.

#### Scenario: Goal with a date in September
- **WHEN** Vacaciones has a goal of 600.000 due in December, 360.000 available and 0 assigned in 2026-09
- **THEN** its line shows `savedMinor` 360.000, `remainingMinor` 240.000, `percent` 60, `monthsRemaining` 3, `requiredMinor` 60.000, `missingMinor` 60.000 and `state` `underfunded`

#### Scenario: Monthly goal fully assigned
- **WHEN** Supermercado has a monthly goal of 180.000 and 180.000 assigned
- **THEN** `percent` is 100, `missingMinor` is 0 and `state` is `funded`

#### Scenario: Envelope without a goal
- **WHEN** an envelope has no goal
- **THEN** its line has `state` but no `goalStatus`

### Requirement: Envelope detail
`GET /plans/{planId}/envelopes/{envelopeId}/detail` SHALL return to any member (FR-24), for a
`month` (`YYYY-MM`, the current month of the plan's time zone by default), the envelope line of
that month (envelope with its goal and photo, the assigned, spent and available amounts, the
state and the goal status), its `carryoverMinor`, and the month's activity: the transactions that
have a portion on the envelope and whose local date in the plan's time zone is in that month, newest
first, at most 100 of them, with `activityTotal` counting all of them. Each activity item SHALL have
the shape of a listed transaction. An envelope of another plan, or one that does not exist, SHALL
respond `404`.

#### Scenario: Month activity
- **WHEN** Supermercado has an 18.450 expense today and a 42.100 expense yesterday in 2026-09
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
overspent MAY be the destination, which is how its overspending is covered.

#### Scenario: Cover an overspent envelope
- **WHEN** Supermercado has 47.550 available, Transporte is at −6.200 and an editor moves 6.200 from Supermercado to Transporte
- **THEN** the API responds `200`, Supermercado has 41.350 available, Transporte 0, and Ready to Assign is the same as before

#### Scenario: Assignments change by the amount
- **WHEN** 10.000 is moved from Supermercado (assigned 180.000) to Salidas (assigned 20.000) in 2026-09
- **THEN** their assignments for 2026-09 are 170.000 and 30.000, and the assignments of every other month and envelope are unchanged

#### Scenario: More than available
- **WHEN** Supermercado has 47.550 available and 50.000 is moved from it
- **THEN** the API responds `409`, no assignment changes and the response uses the standard error shape

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
- **THEN** neither assignment has changed

### Requirement: Goal photo
An owner or editor SHALL be able to set or replace an envelope's photo (FR-41) with `POST
/plans/{planId}/envelopes/{envelopeId}/photo`, a `multipart/form-data` request with the image in
the field `file`. The file SHALL NOT exceed 5 MB (`413` otherwise) and SHALL be a JPEG, PNG or WebP
image, decided by the content of the file (its signature) and not by its name or declared type; any
other content, including text renamed `.jpg`, and any file that cannot be decoded as an image SHALL
respond `415` and change nothing. A request without the field SHALL respond `400`. The server SHALL
resize the image to at most 1.080 pixels wide (a narrower image keeps its width), apply the image's
orientation, strip its metadata and store it as JPEG, in a configurable directory outside the
database, without ever keeping the uploaded bytes. The response SHALL be `200` with the envelope,
whose `photoUrl` is the path, relative to the API, of the stored photo. Replacing a photo SHALL
delete the previous file, and `DELETE /plans/{planId}/envelopes/{envelopeId}/photo` SHALL delete the
photo and its file and respond `200` with the envelope without `photoUrl` (also when it had none).
Deleting an envelope SHALL delete its photo file. Without a photo the envelope has no `photoUrl`,
and the client SHALL show a lavender tint with the envelope's icon instead.

#### Scenario: Upload a JPEG, PNG or WebP
- **WHEN** an editor uploads a 3000-pixel wide image of any of the three formats
- **THEN** the API responds `200` with a `photoUrl` and the stored photo is a JPEG 1.080 pixels wide

#### Scenario: Small image
- **WHEN** an editor uploads a 600-pixel wide image
- **THEN** the stored photo is 600 pixels wide

#### Scenario: Too large
- **WHEN** an editor uploads a file of 6 MB
- **THEN** the API responds `413` and the envelope keeps its photo

#### Scenario: Not an image
- **WHEN** an editor uploads a text file named `photo.jpg`, or an image declared as `image/jpeg` that is a PDF
- **THEN** the API responds `415` and nothing is stored

#### Scenario: Replace
- **WHEN** an envelope has a photo and an editor uploads another one
- **THEN** `photoUrl` changes, the new photo is served and the old file no longer exists on disk

#### Scenario: Remove
- **WHEN** an editor deletes the photo
- **THEN** the envelope has no `photoUrl`, the file is gone and a request for the photo responds `404`

#### Scenario: Missing file
- **WHEN** the request has no `file` field
- **THEN** the API responds `400`

#### Scenario: Envelope deleted
- **WHEN** an envelope with a photo is deleted
- **THEN** its photo file is deleted too

### Requirement: Serving the photo
`GET /plans/{planId}/envelopes/{envelopeId}/photo` SHALL return the stored image (`image/jpeg`) to
any member of the plan, whatever the role, and only with a valid bearer token: a request without
one SHALL respond `401`, and a user who is not a member, an envelope of another plan, or an envelope
without a photo SHALL respond `404`. Photos SHALL NOT be reachable by any URL that does not check
membership. The response MAY be cached privately by the client; changing the photo changes the
`photoUrl`.

#### Scenario: Member
- **WHEN** a member, an editor or a viewer requests the photo of an envelope that has one
- **THEN** the API responds `200` with the image

#### Scenario: Not a member
- **WHEN** a user who is not a member of the plan requests the photo
- **THEN** the API responds `404`

#### Scenario: No token
- **WHEN** the request has no bearer token
- **THEN** the API responds `401`

#### Scenario: No photo
- **WHEN** the envelope has no photo
- **THEN** the API responds `404`

### Requirement: Suggested photos
The API SHALL offer a fixed set of suggested goal photos, the same for everyone: `vacaciones`,
`auto`, `emergencia` and `mudanza`. `GET /envelope-photo-suggestions` SHALL return them in that
order, each with its `id`, its `name` and the `imageUrl` of its image, to any signed-in user, and
`GET /envelope-photo-suggestions/{suggestionId}/image` SHALL return the image (`404` for an unknown
id). An owner or editor SHALL set one as an envelope's photo with `POST
/plans/{planId}/envelopes/{envelopeId}/photo/suggested`, sending `suggestionId`; the image SHALL
go through the same resizing and storage as an upload, so replacing or removing it behaves like any
other photo. An unknown `suggestionId` SHALL respond `400`.

#### Scenario: List
- **WHEN** a signed-in user lists the suggestions
- **THEN** the four suggestions are returned in the order above, each with an image URL

#### Scenario: Choose a suggestion
- **WHEN** an editor chooses `vacaciones` for an envelope
- **THEN** the API responds `200` with the envelope and a `photoUrl`, and the photo is served like an uploaded one

#### Scenario: Unknown suggestion
- **WHEN** an editor sends `suggestionId` `playa`
- **THEN** the API responds `400` and nothing changes

### Requirement: Goal authorization
Reading an envelope's goal, state, detail and photo SHALL be allowed to every member of the plan.
Setting or removing a goal, moving money, and setting, replacing or removing a photo SHALL be
allowed to `owner` and `editor` only; a `viewer` SHALL receive `403` and nothing changes. A user who
is not a member, a plan that does not exist or an envelope of another plan SHALL receive `404` with
the standard error shape, and a request without a valid token `401`.

#### Scenario: Viewer writes
- **WHEN** a viewer sets a goal, moves money, uploads a photo or deletes a photo
- **THEN** the API responds `403` and nothing changes

#### Scenario: Viewer reads
- **WHEN** a viewer asks for the detail or the photo of an envelope
- **THEN** the API responds `200`

#### Scenario: Non-member
- **WHEN** a user who is not a member asks for a detail or moves money
- **THEN** the API responds `404`

### Requirement: Envelope detail screen
Screen 22 Detalle de sobre SHALL open from an `EnvelopeRow` of 02 and from the tiles of 05. It SHALL
show a back button, a pencil that opens 23 (hidden for a viewer), the envelope's icon, its name
(30) and group, a card with the Asignado, Disponible and Gastado of the month, the goal row, the
section "Actividad de <month>" with the month's transactions as `TxRow`s grouped by day (a tap opens
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

### Requirement: Edit envelope screen
Screen 23 Editar sobre SHALL open from the pencil of 22 and from "Editar meta" in 40 and show a back
button (no close button) and a red trash button that opens 43, "Nombre" and "Grupo" (→ 52)
`FieldRow`s, the icon selector, "Tipo de objetivo" as chips "Sin objetivo", "Mensual" and "Con
fecha", the target in the `AmountCapsule` with quick amounts (the capsule opens the keypad for an own
amount), for "Con fecha" a "Fecha límite" row (→ the date sheet), for a goal envelope a "Foto" row
(→ 50) and the `SaveBar` "Guardar cambios". Saving SHALL send the changes of the name, icon and
group and set or remove the goal, show "Guardado" and return to 22. A duplicate name SHALL show "Ya
tenés un sobre con ese nombre" on the field. "Con fecha" without a date, or with a date before the
current month, SHALL NOT be saved and SHALL say "Elegí una fecha límite." The trash SHALL be the
only entry to the deletion, which SHALL always pass through 43. A viewer SHALL see that their role
is read-only and nothing SHALL be saved.

#### Scenario: Set a monthly goal
- **WHEN** the user picks "Mensual", the quick amount 180.000 and saves
- **THEN** the goal is set, 22 opens and shows "Objetivo mensual"

#### Scenario: Goal with a date
- **WHEN** the user picks "Con fecha", enters 600.000, picks December as the due date and saves
- **THEN** the goal is a `targetByDate` goal and the envelope appears in the goals of 01

#### Scenario: Remove the goal
- **WHEN** the user picks "Sin objetivo" and saves
- **THEN** the goal is removed and 22 shows "Sin objetivo"

#### Scenario: Missing date
- **WHEN** the user picks "Con fecha" without a due date and confirms
- **THEN** nothing is saved and the form says "Elegí una fecha límite."

#### Scenario: Delete
- **WHEN** the user taps the trash
- **THEN** 43 opens, and only "Eliminar" there deletes the envelope

#### Scenario: Duplicate name
- **WHEN** the user renames the envelope to the name of another
- **THEN** the field shows "Ya tenés un sobre con ese nombre" and nothing is saved

### Requirement: Goals on Inicio
Screen 01 Inicio SHALL show the section "Metas" with a carousel of one `GoalCard` for each envelope
that has a `targetByDate` goal, in the order of the envelope list, for the current month, and a
last card "+ Nueva meta". A `GoalCard` SHALL show the goal's photo (radius 32) or, without one, a
lavender tint with the envelope's icon; the saved amount and the percent over a progress line; and
a glass panel with the name, the "<target> · <month>" and an arrow. Tapping it SHALL open 05;
"+ Nueva meta" SHALL open 31 with the group "Metas" preselected (when the plan has such a group,
compared without letter case) and the goal type "Con fecha". A page indicator SHALL show the
position in the carousel, at the right of the "Metas" title. The cards SHALL be drawn slightly
rotated, the centered one and the neighbors that peek at its sides, as in the render. With no
goals, the section SHALL show the card "Creá tu primera meta" that opens 31 in the same way; while
loading, a skeleton card; on failure, a retry. Screen 01 SHALL also show the greeting "Hola" over
"<first name>!" in the headline style (no plan subtitle), the `JoinedCard` with the plan's Ready to
Assign ("Listo para asignar") and the number of envelopes ("Sobres activos"), and the Reportes
button. The "+" of the card (→ 03, `add-monthly-assignment`) and Reportes (→ 17, `add-reports`)
belong to other changes: they SHALL be drawn in their muted disabled look and SHALL NOT react to a
tap until those screens exist.

#### Scenario: Goals carousel
- **WHEN** the plan has Vacaciones (600.000 due in December, 360.000 saved) and Emergencia goals
- **THEN** 01 shows two `GoalCard`s and "+ Nueva meta", and Vacaciones reads "$ 360.000", "60%" and "$ 600.000 · diciembre"

#### Scenario: No photo
- **WHEN** a goal has no photo
- **THEN** its card shows the lavender tint and the envelope's icon, with the same texts

#### Scenario: Open a goal
- **WHEN** the user taps a `GoalCard`
- **THEN** screen 05 opens with that goal

#### Scenario: New goal
- **WHEN** the user taps "+ Nueva meta"
- **THEN** 31 opens with the group "Metas" and "Con fecha" selected

#### Scenario: No goals
- **WHEN** no envelope has a `targetByDate` goal
- **THEN** the section shows "Creá tu primera meta"

### Requirement: Goal detail screen
Screen 05 Detalle de meta SHALL open from a `GoalCard` and show the goal's photo full bleed (or the
lavender tint with the icon) under glass panels with white text, a back button, the goal's name
with "<N> meses restantes" ("Vence este mes" in the due month, "Vencida" after it) and a "…" button
that opens 40; the "Objetivo", "Ya ahorrado" and "Falta" amounts with the stripe progress bar
(chartreuse stripes for what is saved and dots for what is missing); four tiles, "Últimos aportes"
and "Plan de aportes" (→ 22), "Mover dinero" (→ 24) and "Ajustar objetivo" (→ 23); and the button
"Asignar a esta meta", whose destination 03 belongs to the monthly assignment change: until that
screen exists it SHALL be drawn disabled (muted, not chartreuse) with the caption "Disponible con
la asignación mensual" and SHALL NOT react to a tap. The photo SHALL be darkened by a scrim so the
white text and the glass panels keep a contrast of at least 4.5 : 1 whatever the photo. Over a
photo the status bar SHALL use light icons. A viewer SHALL see no "Mover dinero" and no
"Ajustar objetivo" tile and no "…" menu.

#### Scenario: Goal in progress
- **WHEN** the user opens Vacaciones with 600.000 as the target and 360.000 saved
- **THEN** 05 shows "Objetivo $ 600.000", "Ya ahorrado $ 360.000", "Falta $ 240.000", "3 meses restantes" and a 60% stripe bar

#### Scenario: Tiles
- **WHEN** the user taps "Últimos aportes", "Mover dinero" or "Ajustar objetivo"
- **THEN** 22, 24 or 23 opens for that envelope

#### Scenario: Due month
- **WHEN** the due month is the current month
- **THEN** the title says "Vence este mes"

### Requirement: Goal options and photo screens
Screen 40 Opciones de meta SHALL be a bottom sheet opened by the "…" of 05, with "Cambiar foto" (→
50), "Editar meta" (→ 23) and a red "Eliminar meta" that opens 43 and, once confirmed, deletes the
envelope and returns to 01. Screen 50 Foto de la meta SHALL be a bottom sheet with the current photo
(or the tint and icon), the rows "Elegir de la galería" and "Sacar una foto" (the device's picker and
camera), the "Fotos sugeridas" grid of the suggestions (the selected one marked with a lavender ring
and a check) with the tile "Más fotos" (which opens the gallery), a red "Quitar foto" with the note
"La tarjeta usa un color en su lugar." (only when there is a photo) and a primary "Listo". Choosing a
suggestion or a picture marks it, and "Listo" uploads it and closes the sheet showing "Guardado".
"Quitar foto" SHALL ask for confirmation in place and then delete the photo. A file over 5 MB or
that is not JPEG, PNG or WebP SHALL show "La foto debe ser JPEG, PNG o WebP de hasta 5 MB." and
keep the previous one. When opened from 31 the sheet SHALL only remember the choice, which is
applied after the envelope is created.

#### Scenario: Pick a suggested photo
- **WHEN** the user opens 50, taps the car photo and "Listo"
- **THEN** the photo is stored, 05 and the `GoalCard` show it and the sheet closes with "Guardado"

#### Scenario: Remove the photo
- **WHEN** the user taps "Quitar foto" and confirms
- **THEN** the photo is removed and the card shows the lavender tint with the icon

#### Scenario: Gallery picture too large
- **WHEN** the user picks a picture over 5 MB
- **THEN** the sheet says "La foto debe ser JPEG, PNG o WebP de hasta 5 MB." and nothing changes

#### Scenario: Delete the goal
- **WHEN** the user taps "Eliminar meta" and then Eliminar in 43
- **THEN** the envelope is deleted and 01 opens without it

#### Scenario: Photo while creating
- **WHEN** the user picks a suggestion in 50 opened from 31 and then creates the envelope
- **THEN** the envelope is created and the photo is set right after

### Requirement: Move money screen
Screen 24 Mover dinero SHALL open from "Mover dinero" in 22 and 05 and show a close button, the title,
"Desde" and "Hacia" cards (each an `EnvelopeRow` with its icon, "<spent> de <assigned>", its
Available and its state, and the arrow between them), each opening the envelope picker 36, the
amount in the `AmountCapsule` with quick amounts and the `SaveBar` "Mover <amount>". The source
SHALL be the envelope the screen was opened from. When the destination is `overspent`, the amount SHALL
start as its overspending, capped at the source's Available, and be the first quick amount. The
`SaveBar` SHALL be Disabled, with the reason ("Elegí un sobre", "Ingresá un monto" or "Supera lo
disponible"), until both envelopes differ, the amount is positive and it does not exceed the
source's Available. Confirming SHALL move the money, show "Guardado" and return to the previous
screen with every figure refreshed. A viewer SHALL see that their role is read-only.

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
