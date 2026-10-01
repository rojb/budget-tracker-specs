## MODIFIED Requirements

### Requirement: Empty plan screen
When the active plan has no envelopes, the Plan tab SHALL show screen 06 Plan vacío: the
`JoinedCard` with "Listo para asignar" equal to the sum of the plan's account balances and "0
Sobres activos" with a muted "+", and a "Primeros pasos" checklist (Creaste tu plan ✓, Agregá tus
otras cuentas → 28, Creá tus sobres, Asigná tu dinero shown disabled), the template preview chips,
"Usar plantilla sugerida" (→ 35) and "Crear sobre vacío" (→ 31), the `layers` button (→ 32) and the
search button, which opens a search field in place like the one of 02 (collapsed again by an `x`).
With no envelopes, a search that has text SHALL answer that no envelope matches it.
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

#### Scenario: Search in place
- **WHEN** the user taps the search button of 06 and types "alq"
- **THEN** a search field shows in place, the screen is not left and it says that no envelope matches "alq"
