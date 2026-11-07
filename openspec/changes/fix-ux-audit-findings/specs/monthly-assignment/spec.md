## MODIFIED Requirements

### Requirement: Status filters in the plan view
The plan view SHALL show the chips "Todos", "Sobregirados · N", "Falta · N", "Cubiertos · N" and
"Sin asignar · N", with N the envelopes of the viewed month in that state, so that every envelope
belongs to exactly one of the four state chips. "Sin asignar" holds the envelopes that are empty:
no goal, nothing assigned and nothing available. Selecting a chip SHALL keep only the envelopes in
that state, hide the groups left empty and, when none match, say so in place; "Todos" SHALL show
every envelope again. The chips scroll sideways as a chip row that ends visibly.

#### Scenario: Only overspent
- **WHEN** September has Transporte overspent and the user taps "Sobregirados · 1"
- **THEN** only Transporte is listed, under "Día a día"

#### Scenario: Filter without results
- **WHEN** no envelope is overspent and the user taps "Sobregirados · 0"
- **THEN** the list says that no envelope is overspent this month

#### Scenario: Counts add up
- **WHEN** the plan has 14 envelopes of which 2 are empty, 1 lacks money and 11 are covered
- **THEN** the chips read "Sobregirados · 0", "Falta · 1", "Cubiertos · 11" and "Sin asignar · 2", and the four counts add up to 14

#### Scenario: Empty envelopes
- **WHEN** the user taps "Sin asignar · 2"
- **THEN** only the two empty envelopes are listed under their groups

#### Scenario: Nothing unassigned
- **WHEN** no envelope is empty and the user taps "Sin asignar · 0"
- **THEN** the list says that every envelope has money or a goal this month
