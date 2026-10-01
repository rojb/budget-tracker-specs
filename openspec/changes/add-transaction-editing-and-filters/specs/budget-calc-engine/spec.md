# Spec Delta

## MODIFIED Requirements

### Requirement: Derived values are never persisted
The engine SHALL compute `Assigned`, `Spent`, `Carryover`, `Available` and `ReadyToAssign` from
the stored facts (account opening balances, transactions that have not been deleted, transaction
splits and assignments) each time they are requested. None of these derived values SHALL be stored
in the database, and a transaction that was deleted logically SHALL NOT be a fact of the
calculation until it is restored.

#### Scenario: Editing a past fact
- **WHEN** a transaction dated in a month that is already over is edited or deleted
- **THEN** the next calculation of that month and of every later month reflects the change, with no stored aggregate left out of date

#### Scenario: Schema holds only facts
- **WHEN** the database schema introduced by this change is inspected
- **THEN** it contains budget months and assignments only, with no column for Available, Carryover or Ready to Assign

#### Scenario: Deleted and restored fact
- **WHEN** a transaction is deleted and later restored
- **THEN** the calculations made while it was deleted equal those of a plan that never had it, and the ones made after the restoration equal those from before the deletion
