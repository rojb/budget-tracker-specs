# Spec Delta

## ADDED Requirements

### Requirement: Assignments belong to envelopes of the plan
Every assignment SHALL reference an existing envelope of the same plan as its budget month. An
envelope's assignments SHALL be removed when the envelope is deleted, and the plan's envelope list
SHALL be the `envelopeIds` the engine computes over, so the Available of a deleted envelope stops
counting and returns to Ready to Assign.

#### Scenario: Assignment for a foreign envelope
- **WHEN** an assignment is stored for an envelope that belongs to another plan
- **THEN** it is refused and nothing is stored

#### Scenario: Envelope deleted
- **WHEN** Transporte, with 45.000 assigned in 2026-09, is deleted
- **THEN** its assignments are gone and `ReadyToAssign(2026-09)` rises by the 45.000 it had available

#### Scenario: Bulk assignment is one fact per envelope and month
- **WHEN** 20.000 is assigned to Transporte and 60.000 to Supermercado for 2026-09 in one bulk operation
- **THEN** the month holds exactly one assignment per envelope, and the operation either stores both or neither
