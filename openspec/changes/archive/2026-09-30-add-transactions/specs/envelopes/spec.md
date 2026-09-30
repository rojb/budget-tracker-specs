# Spec Delta

## MODIFIED Requirements

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
