# Proposal

## Why

This is the critical-path risk of the whole project: the `Available`/`ReadyToAssign` derivation
and month carryover/settlement rules feed every envelope, transaction, and monthly-assignment
screen. Per the PRD's own priority rule, if the 3 KR1 scenarios don't pass, all UI work stops
until this engine is right. It goes early, with a single owner, competing with no one else on the
same module.

## What Changes

- Backend: `BudgetMonth` and `Assignment` entities.
- `CalculationService` implementing FR-11 (`Available`/`ReadyToAssign`) and FR-12 (carryover and
  month settlement), including the overspend rule: a negative `Available` does not carry over as
  a negative envelope — it is deducted from next month's `ReadyToAssign`, and the envelope
  restarts at zero.
- No public endpoints yet — an internal service consumed by `add-envelopes`,
  `add-transactions`, and `add-monthly-assignment`. Its call signature (inputs, outputs, how
  other modules invoke it) must be agreed between both devs before those changes start consuming
  it (see `docs/ROADMAP.md` §5 sync points).
- No UI.

## Capabilities

### New Capabilities

- `budget-calc-engine`: envelope `Available`/`ReadyToAssign` derivation, month carryover and
  settlement, overspend handling.

### Modified Capabilities

None.

## Impact

- Repos touched: `budget-tracker-back` only.
- Verification: manual — reproduce the 3 KR1 scenarios from the PRD (including the 2026-09-29
  example: `$ 1.000.000 − $ 931.800 − $ 20.000 = $ 48.200`) against the internal service via
  Swagger UI/Prism with fixtures, no automated test files. Both devs should rehearse this together
  before closing the change, even though there is a single owner.
- Blocks, directly or indirectly, `add-envelopes`, `add-transactions`, `add-monthly-assignment`,
  `add-envelope-goals`, `add-reports`, and transitively `add-transaction-editing-and-filters`.

## Metadata

- Owner: Ruben
- Repos touched: budget-tracker-back
- FRs covered: FR-11, FR-12
- Screens: none (internal engine; feeds 02, 03, 04, 25, 46, 53)
- Depends on: api-contract-base, scaffold-backend
- Size: L
- Linear: TBD
