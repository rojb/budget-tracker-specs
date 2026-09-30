# Design

## Context

See proposal.md for the why. `budget-tracker-back` has TypeORM on Postgres (`synchronize: false`,
hand-written migrations), per-feature modules, a global `ValidationPipe` and the `users`/`auth`
modules from `add-auth`. No plan, envelope, account or transaction tables exist yet:
`add-plans-and-accounts` (nathaliascode) creates `plans`/`accounts`, `add-envelopes` (Ruben)
creates `envelopes`, and `add-transactions` (Ruben) creates `transactions`/`transaction_splits`.
The engine therefore has to be usable before its data sources exist, and its interface is the
first cross-owner sync point of the roadmap (docs/ROADMAP.md §5).

Sources: FR-10, FR-11, FR-12, FR-13 and §7/§9 of PRD.md; `odd/tasks/canonical-dataset.md`
(states B and C are the reference numbers); capability spec `api-conventions` (money in minor
units, `YYYY-MM` month keys).

## Goals / Non-Goals

**Goals:**
- `BudgetMonth` and `Assignment` entities and their migration.
- A pure `CalculationService` that derives every figure of the `budget-calc-engine` spec from a
  plain in-memory ledger, plus the month-close summary.
- An `AssignmentsService` that stores assignments and returns them in ledger form.
- Month-key helpers, including attribution of an instant to a budget month in a time zone.
- A runnable demo (`npm run calc:kr1`) that reproduces the three KR1 scenarios with the canonical
  dataset, since there is no endpoint yet and no test files.

**Non-Goals:**
- Public endpoints (`POST` assignment, month view): they belong to `add-monthly-assignment`.
- Reading envelopes, accounts or transactions from the database: each consumer builds the ledger
  from its own tables (see "Consumer contract").
- Envelope goals and statuses (`add-envelope-goals`), money moves between envelopes.
- Test files of any kind (repo rule); verification is manual.

## API surface

None. This change adds no path to `openapi.yaml`; the contract drift check is unaffected.

## Backend design

```
src/budget/
  budget.module.ts            # exports CalculationService, AssignmentsService
  calculation.service.ts      # pure engine, no repositories injected
  calculation.types.ts        # PlanLedger, MonthState, EnvelopeMonthState, MonthClose
  assignments.service.ts      # upsert + ledger rows, uses BudgetMonth/Assignment repositories
  month-key.ts                # MonthKey helpers (parse, add, compare, range, monthOfInstant)
  entities/budget-month.entity.ts
  entities/assignment.entity.ts
  fixtures/canonical-plan.ts  # state B of odd/tasks/canonical-dataset.md, used by the demo only
src/scripts/kr1-scenarios.ts  # npm run calc:kr1
src/database/migrations/<ts>-CreateBudgetMonthsAndAssignments.ts
```

### Data model (facts only)

- `budget_months(id uuid pk, plan_id uuid not null, month character(7) not null, created_at
  timestamptz)` with `UNIQUE (plan_id, month)` and `CHECK (month ~ '^\d{4}-(0[1-9]|1[0-2])$')`.
  A row is created lazily the first time something is assigned in that month.
- `assignments(id uuid pk, budget_month_id uuid not null fk -> budget_months on delete cascade,
  envelope_id uuid not null, amount_minor bigint not null, updated_at timestamptz)` with
  `UNIQUE (budget_month_id, envelope_id)`.
- No Available/Carryover/RTA column anywhere (spec: "Derived values are never persisted").
- `bigint` is read through a column transformer to `number`, which throws if the value is not a
  safe integer; amounts never become floats or strings in the domain.
- **Foreign keys that wait for their tables.** `plans` and `envelopes` do not exist yet, so
  `plan_id` and `envelope_id` are plain `uuid` columns in this migration. `add-plans-and-accounts`
  adds `FK_budget_months_plan` (`on delete cascade`) in its own migration, and `add-envelopes`
  adds `FK_assignments_envelope` (`on delete cascade`). This is written in the migration comment
  so the other owner sees it.

### Consumer contract (the sync point)

```ts
type MonthKey = `${number}-${number}`;           // 'YYYY-MM', validated by month-key.ts

interface PlanLedger {
  currentMonth: MonthKey;                         // currentMonth(plan.timeZone)
  envelopeIds: string[];                          // every envelope of the plan
  balanceMovements: { month: MonthKey; amountMinor: number }[];
  //   opening balance of each non-archived account (in its opening month) and every
  //   transaction on a non-archived account: income +, expense −, transfer in +/out −
  assignments: { envelopeId: string; month: MonthKey; amountMinor: number }[];
  //   straight from AssignmentsService.ledgerRows(planId)
  spending: { envelopeId: string; month: MonthKey; amountMinor: number }[];
  //   net outflow per envelope: expense or split portion +, income sent to the envelope −
  //   (income to Ready to Assign and transfers are NOT listed here)
}

interface EnvelopeMonthState {
  envelopeId: string;
  assignedMinor: number; carryoverMinor: number; spentMinor: number; availableMinor: number;
}

interface MonthState {
  month: MonthKey;
  isFuture: boolean;                              // month > ledger.currentMonth
  envelopes: EnvelopeMonthState[];                // same order as ledger.envelopeIds
  balanceMinor: number;                           // Σ balances at the end of the month
  availableMinor: number;                         // Σ Available
  futureAssignedMinor: number;                    // Σ Assigned in later months
  overspentSettledMinor: number;                  // overspending of the previous month
  readyToAssignMinor: number;
}

interface MonthClose {
  fromMonth: MonthKey; toMonth: MonthKey;
  carried: { envelopeId: string; amountMinor: number }[];    // positive Available
  deducted: { envelopeId: string; amountMinor: number }[];   // |negative Available|
  totalDeductedMinor: number;
  readyToAssignFromMinor: number; readyToAssignToMinor: number;
}

class CalculationService {
  calculateMonth(ledger: PlanLedger, month: MonthKey): MonthState;
  closeMonth(ledger: PlanLedger, month: MonthKey): MonthClose;     // month -> month + 1
}

class AssignmentsService {
  setAssignment(planId: string, envelopeId: string, month: MonthKey, amountMinor: number): Promise<void>;
  ledgerRows(planId: string): Promise<PlanLedger['assignments']>;
}

// month-key.ts
monthOfInstant(instant: Date, timeZone: string): MonthKey;  // FR "attribution by plan time zone"
currentMonth(timeZone: string, now?: Date): MonthKey;
```

Consumers: `add-envelopes` calls `AssignmentsService.setAssignment` for the initial bulk
assignment (screen 46) and reads `calculateMonth` for envelope rows; `add-transactions` uses
`monthOfInstant` to attribute a transaction and contributes `balanceMovements`/`spending`;
`add-monthly-assignment` builds the full ledger for the month view and screen 25. Until those
tables exist the demo builds the ledger from fixtures.

### Algorithm

`calculateMonth` walks months from the earliest month present in the ledger (or the requested
month, if earlier) up to the requested month, keeping one running `available` per envelope:

1. Index every input once into `Map<month, Map<envelopeId, amount>>` (O(N)).
2. For each month `k` in order: `carryover = max(0, previousAvailable)`;
   `available = assigned(k) + carryover − spent(k)`; `overspent(k) = Σ max(0, −available)`.
3. `balance(m)` is the running sum of `balanceMovements` up to `m`.
4. For `m <= currentMonth`: `RTA(m) = balance(m) − Σ available(m) − Σ assigned(months > m)`.
   For `m > currentMonth`: the envelope columns are computed normally (future assignments and
   positive carryover show up) and `RTA(m) = RTA(currentMonth)` (spec "Plan-wide Ready to Assign
   for future months").
5. `overspentSettledMinor(m) = overspent(m − 1)`; it is reported, not subtracted again — the
   subtraction is already implied because the negative envelope resets to 0 while the money
   stays spent, which is why FR-11's formula keeps holding after the settlement.

Cost is O(N + months × envelopes): 2.000 transactions, 24 months and 12 envelopes is a few
thousand operations, far below the 100 ms budget. `closeMonth(m)` is `calculateMonth(m)` plus
`calculateMonth(m + 1)` and a split of `m`'s envelopes by sign.

Every input amount goes through `assertMinor(value)`, which throws a `RangeError` for a
non-integer or unsafe integer (spec "Exact integer arithmetic"); all sums are integer additions.

### Month keys and time zones

`monthOfInstant` formats the instant with `Intl.DateTimeFormat('en-CA', { timeZone, year,
month })`, so `2026-10-01T02:30:00Z` in `America/Argentina/Buenos_Aires` is `2026-09`. `addMonths`
and `compareMonths` work on `(year, month)` integers; string comparison of `YYYY-MM` is also
valid and is used for sorting. The plan time zone column arrives with `add-plans-and-accounts`
(`plans.time_zone`, default `America/Argentina/Buenos_Aires`).

### Demo instead of endpoints

`src/scripts/kr1-scenarios.ts` (compiled by `nest build`, run with `npm run calc:kr1`, no
database) builds state B of the canonical dataset in `fixtures/canonical-plan.ts` and prints:

1. **Future assignment:** RTA 2026-09 with and without the 20.000 for Regalos in 2026-11
   (68.200 → 48.200), and 2026-11 showing Regalos 20.000 with RTA 48.200.
2. **Month settlement:** `closeMonth(2026-09)` — carried Supermercado 47.550, Alquiler 380.000,
   Transporte −6.200 deducted, RTA 2026-10 42.000 — and the invariant line
   `1.000.000 − 938.000 − 20.000 = 42.000`.
3. **Edit and delete with recalculation:** the Transporte 51.200 spending edited to 41.200 and
   then a Supermercado expense deleted from 2026-09, printing RTA and Available of 2026-09 and
   2026-10 before and after each edit.
4. **Performance:** a generated plan of 2.000 transactions over 24 months and 12 envelopes, with
   the elapsed time of `calculateMonth` (must be < 100 ms).

Each line prints the expected value next to the computed one and a final `OK`/`MISMATCH`, so the
two developers can rehearse KR1 together by reading the output (ROADMAP §5). It is a demo, not a
test: it lives under `src/scripts`, uses no test framework and is not run by CI.

## UI components

None. The engine feeds screens 02, 03, 04, 25, 46 and 53, built by later changes.

## Decisions

**Pure engine, ledger as input.** The service receives facts already aggregated by month instead
of querying tables. Alternatives: (a) the engine queries `transactions`/`envelopes` itself —
impossible today and it would couple Ruben's modules to this one; (b) a provider/port registry —
a hexagonal pattern the project explicitly rejects. The pure form also makes the KR1 demo
trivial and keeps the domain independent of the web framework (PRD §9).

**Assignment amounts can be negative.** YNAB lets users take money back from an envelope; the
month view of `add-monthly-assignment` sets the assigned value, which can go below what carried
over. Rejecting negatives would block that edit.

**`character(7)` month key instead of `date`.** It matches the contract's `MonthKey` exactly,
sorts correctly as text and avoids time-zone surprises of a `date` column.

**Future months show the current month's RTA.** Required by the canonical dataset (state B: 04
Noviembre shows 48.200) and by FR-10. Using FR-11 literally for November would already subtract
September's overspending, which is only settled when September ends.

**FK constraints added by the owners of the referenced tables.** Keeps each migration owned by one
person and avoids a migration that cannot run because its target table is missing.

## Risks / Trade-offs

- [Consumers aggregate the ledger inconsistently, e.g. transfers counted as spending] -> the
  `PlanLedger` doc comment states each rule; `add-monthly-assignment` is the single place that
  assembles the full ledger.
- [Interface disagreement found late] -> the interface above is posted on the Linear issue for
  Ruben's review before the change is archived (ROADMAP §5).
- [No automated tests for the critical path (PRD §7 note 1)] -> the KR1 demo prints expected vs.
  computed values and is rehearsed by both developers.
- [`bigint` overflow in JS] -> the transformer throws beyond `Number.MAX_SAFE_INTEGER`
  (9·10^15 minor units, far above any plan).

## Migration Plan

Additive: `npm run migration:run` creates `budget_months` and `assignments`. Rollback:
`npm run migration:revert` drops both (no data depends on them yet).
