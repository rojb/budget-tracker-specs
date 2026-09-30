# add-budget-calc-engine (RRG-45)

## Objective
FR-11 and FR-12: derive envelope Available, Carryover and Ready to Assign, and the month-close
settlement, from facts on every query. No screens; feeds 02, 03, 04, 25, 46, 53.

## Why
Critical path (Phase 1). Blocks add-envelopes, add-transactions, add-monthly-assignment and,
transitively, every budget screen. Its interface is the first cross-owner sync point.

## Decisions
- Pure `CalculationService` fed by a `PlanLedger` (balance movements, assignments, spending per
  envelope and month); consumers build it from their own tables. No provider registry (no
  hexagonal), no DB access in the engine.
- Tables `budget_months` (plan, `YYYY-MM` as character(7) with CHECK) and `assignments` (one per
  envelope and month, may be negative). Facts only. FKs to `plans`/`envelopes` added later by
  add-plans-and-accounts / add-envelopes.
- Future months report the current month's Ready to Assign (canonical state B: 04 Noviembre shows
  48.200); `closeMonth` uses the settled formula for the next month.
- No endpoints, no contract change. KR1 verification through `npm run calc:kr1`, a demo script
  that prints expected vs. computed values with the canonical dataset (no test files).

## Tasks
- [x] T1 Specs repo: specs → design → tasks
- [x] T2 Back per tasks (1.1–1.6)
- [x] T3 Verify (lint/build, migrations, calc:kr1, drift) + tasks-complete commit
- [x] T4 Merge into nathaliascode/work; archive
- [ ] T5 Joint KR1 rehearsal with Ruben; PRs to main; Linear Done

## Progress
- RRG-45 moved to In Progress. Proposal owner fixed to nathaliascode (f1e6af2).
- Specs: c848a54 specs, 5a50b43 design, e729f43 tasks, 63feb38 tasks complete. Back: 6bbe1e8..f5ca1a9 (1.1–1.6).
- Evidence: calc:kr1 all OK (48.200; close → 42.000 with 938.000; edit/delete recalculation; tz attribution; 2.000 tx in ~2 ms); migration run/revert/run; setAssignment upsert against Postgres; drift exit 0; no test files.
- Interface posted on Linear RRG-45 for Ruben (ROADMAP §5 sync point).
