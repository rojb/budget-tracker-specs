## MODIFIED Requirements

### Requirement: New envelope screen
Screen 31 Nuevo sobre SHALL open from the "+" of a group in 02, from "Crear sobre vacío" in 06 or from
"+ Nueva meta" in 01 and show the subtitle "Sumá un sobre a <group>", the name and group as
`FieldRow`s (the group opens 52), an icon selector, the objective block "Objetivo (opcional)" with
the chips "Sin objetivo", "Mensual" and "Con fecha", the target in the `AmountCapsule` with quick
amounts and, for "Con fecha", the "Fecha límite" row, a "Foto" row (→ 50) when the group is "Metas"
(compared without letter case) or the objective is "Con fecha", and the `SaveBar` "Crear sobre".
The content SHALL scroll above a `SaveBar` pinned at the bottom, so the bar is never cut off however
many rows the form shows. "Fecha límite" SHALL be marked as required ("Obligatoria") while it has no
date. The target amount that the screen preselects when an objective is chosen SHALL be drawn as a
suggestion (muted) until the user confirms it with a quick amount, the keypad or by saving. Creating
SHALL send the goal, if any, show "Guardado" and return to the previous screen, which shows the new
envelope; the chosen photo, if any, is applied right after the envelope exists. A duplicate name
SHALL show "Ya tenés un sobre con ese nombre" on the field and save nothing.

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

#### Scenario: Save bar always visible
- **WHEN** the user opens 31 from "+ Nueva meta", so the Foto row and the "Fecha límite" row are shown
- **THEN** the content scrolls and the `SaveBar` "Crear sobre" stays fully visible at the bottom

#### Scenario: Date required
- **WHEN** the objective is "Con fecha" and no date is chosen
- **THEN** the "Fecha límite" row reads as required and confirming saves nothing and says "Elegí una fecha límite."

#### Scenario: Suggested amount
- **WHEN** the user picks "Con fecha" and has not touched the amount
- **THEN** the preselected amount is drawn muted, and it becomes `ink` once the user picks a quick amount or keys one

#### Scenario: Duplicate name
- **WHEN** the user saves a name another envelope already has
- **THEN** the name field shows the error and nothing is saved

### Requirement: Assign your money screen
Screen 46 Asigná tu dinero SHALL open after the template is created and show the plan's Ready to
Assign, the new envelopes grouped under the same labels as 35, each with an amount pill ("$ 0"
muted when nothing is entered) that opens an amount editor, and the live note "Te quedan <amount>
por asignar" (the Ready to Assign minus what is entered). The figure "Listo para asignar" of the top
card SHALL follow what is typed: it shows what remains to assign and it turns `danger` red with a
minus sign when the entered amounts exceed the Ready to Assign. When they do, the note SHALL turn
`danger` red with a warning icon and read "Te pasaste <amount>. Quitá dinero de algún sobre o seguí y
lo ajustás después."; the warning does not block. "Listo" SHALL send the non-zero amounts through the
initial bulk assignment and open the Plan tab; the close button SHALL open the Plan tab without
assigning.

#### Scenario: Distribute the opening balance
- **WHEN** the plan has 370.000 and the user enters Alquiler 280.000, Transporte 20.000 and Supermercado 60.000
- **THEN** the note reads "Te quedan $ 10.000 por asignar", the top card shows "$ 10.000" and "Listo" assigns those three amounts

#### Scenario: Skip
- **WHEN** the user taps the close button
- **THEN** the Plan tab opens and every envelope has 0 assigned

#### Scenario: Over-assigning
- **WHEN** the entered amounts exceed the Ready to Assign by 80.000
- **THEN** the note is red with a warning icon and reads "Te pasaste $ 80.000. Quitá dinero de algún sobre o seguí y lo ajustás después.", the top card shows "−$ 80.000" in red, and "Listo" still works, leaving a negative Ready to Assign

#### Scenario: Back under the limit
- **WHEN** the user lowers an amount so the total no longer exceeds the Ready to Assign
- **THEN** the note and the top card return to their normal color and "Te quedan <amount> por asignar"
