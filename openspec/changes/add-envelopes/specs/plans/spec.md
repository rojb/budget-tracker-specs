# Spec Delta

## MODIFIED Requirements

### Requirement: Delete a plan
The plan's owner SHALL be able to delete it with `DELETE /plans/{planId}`, which SHALL remove the
plan and everything scoped to it (members, accounts, envelope groups, envelopes, budget months and
assignments). Other members SHALL receive `403`.

#### Scenario: Owner deletes
- **WHEN** the owner deletes a plan
- **THEN** the API responds `204` and a later `GET /plans/{planId}` responds `404`

#### Scenario: Viewer deletes
- **WHEN** a viewer tries to delete the plan
- **THEN** the API responds `403` and the plan still exists

#### Scenario: Envelopes go with the plan
- **WHEN** the owner deletes a plan that has groups, envelopes and assignments
- **THEN** all of them are removed together with the plan

### Requirement: Empty plan screen
When the active plan has no envelopes, the Plan tab SHALL show screen 06 Plan vacío: the
`JoinedCard` with "Listo para asignar" equal to the sum of the plan's account balances and "0
Sobres activos" with a muted "+", and a "Primeros pasos" checklist (Creaste tu plan ✓, Agregá tus
otras cuentas → 28, Creá tus sobres, Asigná tu dinero shown disabled), the template preview chips,
"Usar plantilla sugerida" (→ 35) and "Crear sobre vacío" (→ 31), and the `layers` button (→ 32).
Destinations built by later changes SHALL be placeholder routes. As soon as the plan has an
envelope the Plan tab SHALL show screen 02 instead.

#### Scenario: Fresh plan
- **WHEN** the active plan has only Banco Nación with $ 300.000 and no envelopes
- **THEN** 06 shows "$ 300.000 Listo para asignar" and "0 Sobres activos"

#### Scenario: Add accounts from the checklist
- **WHEN** the user taps "Agregá tus otras cuentas"
- **THEN** screen 28 Nueva cuenta opens

#### Scenario: Start from the template
- **WHEN** the user taps "Usar plantilla sugerida"
- **THEN** screen 35 Plantilla sugerida opens

#### Scenario: Start with one envelope
- **WHEN** the user taps "Crear sobre vacío" and creates an envelope
- **THEN** the Plan tab shows screen 02 instead of 06
