# budget-calc-engine Specification

## Purpose
Derives every budget figure of a plan (envelope Available, Carryover, Ready to Assign and the
month-close settlement) from the stored facts — account opening balances, transactions and
monthly assignments — on every query, without persisting any aggregate.

## Requirements

### Requirement: Derived values are never persisted
The engine SHALL compute `Assigned`, `Spent`, `Carryover`, `Available` and `ReadyToAssign` from
the stored facts (account opening balances, transactions, transaction splits and assignments) each
time they are requested. None of these derived values SHALL be stored in the database.

#### Scenario: Editing a past fact
- **WHEN** a transaction dated in a month that is already over is edited or deleted
- **THEN** the next calculation of that month and of every later month reflects the change, with no stored aggregate left out of date

#### Scenario: Schema holds only facts
- **WHEN** the database schema introduced by this change is inspected
- **THEN** it contains budget months and assignments only, with no column for Available, Carryover or Ready to Assign

### Requirement: Monthly assignment facts
An assignment SHALL be the amount of money, in minor units, given to one envelope in one budget
month of one plan. There SHALL be at most one assignment per envelope and month; setting it again
replaces the amount. An assignment amount SHALL be an integer and MAY be zero or negative (money
taken back). Assignments to any month, past, current or future, SHALL be allowed.

#### Scenario: Assign to a month
- **WHEN** 45.000 is assigned to Transporte for 2026-09
- **THEN** `Assigned(Transporte, 2026-09)` is 45.000

#### Scenario: Re-assign replaces
- **WHEN** Transporte already has 45.000 for 2026-09 and 50.000 is assigned to it for 2026-09
- **THEN** `Assigned(Transporte, 2026-09)` is 50.000, not 95.000

#### Scenario: Assign to a future month
- **WHEN** the current month is 2026-09 and 20.000 is assigned to Regalos for 2026-11
- **THEN** the assignment is stored for 2026-11 and counts as a future commitment for 2026-09 and 2026-10

### Requirement: Envelope activity
`Spent(envelope, month)` SHALL be the net outflow attributed to the envelope in that month: the sum
of expense amounts (or expense split portions) assigned to the envelope minus the sum of income
directed straight to the envelope. Income sent to Ready to Assign SHALL NOT count as envelope
activity. A transfer between accounts SHALL NOT count as envelope activity.

#### Scenario: Expenses and split portions
- **WHEN** Supermercado has a 100.000 expense and a 32.450 portion of a split payment in 2026-09
- **THEN** `Spent(Supermercado, 2026-09)` is 132.450

#### Scenario: Income to an envelope
- **WHEN** 10.000 of income is directed to Regalos in 2026-09 and Regalos has no expenses
- **THEN** `Spent(Regalos, 2026-09)` is −10.000, which raises its Available by 10.000

### Requirement: Available per envelope and month
For every envelope and month the engine SHALL compute
`Available(e, m) = Assigned(e, m) + Carryover(e, m) − Spent(e, m)`.

#### Scenario: Overspent envelope
- **WHEN** Transporte has `Assigned` 45.000, `Carryover` 0 and `Spent` 51.200 in 2026-09
- **THEN** `Available(Transporte, 2026-09)` is −6.200

#### Scenario: Envelope without activity
- **WHEN** an envelope has no assignment, no carryover and no spending in a month
- **THEN** its Available for that month is 0

### Requirement: Carryover of positive balances
`Carryover(e, m)` SHALL be `Available(e, m−1)` when that value is positive, and 0 otherwise. A
negative `Available` SHALL NOT carry into the next month as a negative envelope balance; the
envelope starts the next month from its new assignment and activity only.

#### Scenario: Positive balance carries
- **WHEN** Supermercado ends 2026-09 with Available 47.550
- **THEN** `Carryover(Supermercado, 2026-10)` is 47.550

#### Scenario: Negative balance resets
- **WHEN** Transporte ends 2026-09 with Available −6.200 and gets no assignment or spending in 2026-10
- **THEN** `Carryover(Transporte, 2026-10)` is 0 and `Available(Transporte, 2026-10)` is 0

#### Scenario: Carryover over several months
- **WHEN** Vacaciones has 360.000 available at the end of 2026-09 and no activity afterwards
- **THEN** its Available is 360.000 in 2026-10, 2026-11 and 2026-12

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

### Requirement: Account balances in the calculation
The account balance used by the engine SHALL be derived, never stored: the account's opening
balance plus every transaction on it (income positive, expense negative, transfers in and out) up
to the end of the month. Only accounts that are not archived SHALL be summed.

#### Scenario: Balance from facts
- **WHEN** Banco Nación opened with 300.000 and has 850.000 of inflows and 307.700 of outflows up to 2026-09
- **THEN** its balance at the end of 2026-09 is 842.300

#### Scenario: Account opened later
- **WHEN** an account is opened in 2026-10 with 50.000
- **THEN** it adds 0 to the balances of 2026-09 and 50.000 to the balances of 2026-10

### Requirement: Month settlement of overspending
When a month ends, the total overspending of that month, `Σ max(0, −Available(e, m))`, SHALL be
deducted from the Ready to Assign of month `m+1`. After the settlement the Ready to Assign formula
SHALL still hold exactly for `m+1`.

#### Scenario: Canonical month close
- **WHEN** 2026-09 closes with Transporte at −6.200, Supermercado at 47.550 and Alquiler at 380.000, and nothing else changes in 2026-10
- **THEN** `ReadyToAssign(2026-10)` is 48.200 − 6.200 = 42.000, and `1.000.000 − 938.000 − 20.000 = 42.000` holds

#### Scenario: Several overspent envelopes
- **WHEN** two envelopes end a month at −1.000 and −2.500
- **THEN** the next month's Ready to Assign is 3.500 lower than it would be with no overspending

### Requirement: Plan-wide Ready to Assign for future months
For a month after the current month, the Ready to Assign reported SHALL equal the Ready to Assign of
the current month, because the current month's overspending is settled only when it ends. The
current month SHALL be the calendar month of the present instant in the plan's time zone.

#### Scenario: Viewing November from September
- **WHEN** the current month is 2026-09 with Ready to Assign 48.200 and 2026-11 is requested
- **THEN** the Ready to Assign reported for 2026-11 is 48.200

#### Scenario: Future assignment already reflected
- **WHEN** the current month is 2026-09 and 20.000 is assigned to Regalos for 2026-11
- **THEN** 2026-11 shows Regalos with Assigned and Available 20.000, and the reported Ready to Assign is the same as for 2026-09

### Requirement: Month close summary
The engine SHALL describe the close of a month `m` into `m+1`: for each envelope with a positive
Available, the amount that carries over; for each envelope with a negative Available, the amount
deducted from Ready to Assign; the total deduction; and the resulting `ReadyToAssign(m+1)`.

#### Scenario: September into October
- **WHEN** the close of 2026-09 is requested with the canonical data
- **THEN** it lists Supermercado +47.550 and Alquiler +380.000 as carried over, Transporte −6.200 as deducted, and Ready to Assign in 2026-10 of 42.000

### Requirement: Budget month attribution by plan time zone
A transaction SHALL belong to the budget month of its instant expressed in the plan's time zone,
not in UTC and not in the device's time zone.

#### Scenario: Late on the last day of the month
- **WHEN** a plan in `America/Argentina/Buenos_Aires` records an expense at `2026-10-01T02:30:00Z` (30 September, 23:30 local time)
- **THEN** the expense counts in 2026-09

### Requirement: Exact integer arithmetic
Every amount handled by the engine SHALL be an integer in the minor units of the plan's currency.
The engine SHALL NOT use floating-point arithmetic for money and SHALL reject a non-integer amount
as input.

#### Scenario: Non-integer input
- **WHEN** the engine receives an amount of 10.5
- **THEN** it refuses the input with an error instead of rounding it

### Requirement: Calculation performance
The calculation of one month SHALL complete in under 100 ms for a plan with 2.000 transactions
spread over its months, on a developer laptop.

#### Scenario: Large plan
- **WHEN** the state of one month is calculated for a plan with 2.000 transactions and 12 envelopes over 24 months
- **THEN** the calculation takes less than 100 ms

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
