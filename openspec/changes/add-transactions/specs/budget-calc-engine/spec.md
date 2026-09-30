# Spec Delta

## MODIFIED Requirements

### Requirement: Envelope activity
`Spent(envelope, month)` SHALL be the net outflow attributed to the envelope in that month: the sum
of expense amounts (or expense split portions) assigned to the envelope minus the sum of income
directed straight to the envelope. Income sent to Ready to Assign SHALL NOT count as envelope
activity. A transfer between accounts SHALL NOT count as envelope activity. A transaction portion
that has no envelope (its envelope was deleted) SHALL count as activity of no envelope, while its
amount still moves the account balance.

#### Scenario: Expenses and split portions
- **WHEN** Supermercado has a 100.000 expense and a 32.450 portion of a split payment in 2026-09
- **THEN** `Spent(Supermercado, 2026-09)` is 132.450

#### Scenario: Income to an envelope
- **WHEN** 10.000 of income is directed to Regalos in 2026-09 and Regalos has no expenses
- **THEN** `Spent(Regalos, 2026-09)` is −10.000, which raises its Available by 10.000

#### Scenario: Portion without an envelope
- **WHEN** an expense of 5.000 lost its envelope because the envelope was deleted
- **THEN** it counts as activity of no remaining envelope and the plan's balances still include the 5.000 outflow

### Requirement: Ready to Assign
For a month `m` that is not after the current month, the engine SHALL compute
`ReadyToAssign(m) = Σ account balances at the end of m − Σ Available(e, m) − Σ Assigned(e, months after m)`,
over all envelopes of the plan. The result MAY be negative (more assigned than available money).

#### Scenario: Canonical September (future commitment)
- **WHEN** on 2026-09-29 the accounts add up to 1.000.000, the envelopes' Available for 2026-09 add up to 931.800 and 20.000 is assigned to Regalos for 2026-11
- **THEN** `ReadyToAssign(2026-09)` is 48.200

#### Scenario: Over-assigned plan
- **WHEN** the envelopes' Available plus future assignments exceed the account balances by 5.000
- **THEN** `ReadyToAssign` is −5.000 and is reported as a negative amount, not clamped to 0

#### Scenario: Expense on an envelope
- **WHEN** Ready to Assign is 48.200 and an 18.450 expense is recorded on Supermercado
- **THEN** the account balances fall by 18.450, Supermercado's Available falls by 18.450 and Ready to Assign stays 48.200

#### Scenario: Income to Ready to Assign
- **WHEN** Ready to Assign is 48.200 and an income of 850.000 is recorded without an envelope
- **THEN** `ReadyToAssign` is 898.200

#### Scenario: Income to an envelope
- **WHEN** Ready to Assign is 48.200 and an income of 3.500 is recorded into Farmacia
- **THEN** Farmacia's Available rises by 3.500 and `ReadyToAssign` stays 48.200
