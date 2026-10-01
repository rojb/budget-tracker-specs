# add-reports (RRG-54)

## Objective
FR-26: spending by envelope, income against expenses and net worth over a range of months. Screen
17 Reportes.

## Why
Phase 6 (complementary, team decision). Depends on add-transactions and add-envelopes (merged).

## Decisions
- Own read-only `reports` module with three endpoints (`spending`, `income-expense`, `net-worth`),
  months as the unit (`from`/`to`, default the last 6, at most 24) in the plan's time zone.
- Sources already owned elsewhere: `TransactionLedgerService.spending`,
  `AccountsService.ledgerBalanceMovements` (cumulative) and one grouped read of `transactions`.
- No chart library: `UiBarChart` in `packages/ui`, one series styled with the design tokens.
  Flagged for Ruben.
- 17 lives under the 01 branch (`/home/reports`), so the NavCluster stays on Inicio; range sheet with
  3/6/12 months.

## Tasks
- [x] T1 Specs repo: specs → design → tasks
- [x] T2 Contract + back (1.1, 2.1–2.2)
- [x] T3 Front (3.1–3.3)
- [x] T4 Verify against the real API and the render + tasks-complete
- [ ] T5 Two-dev contract approval, component review, on-device check, PRs to main, archive, Linear Done

## Progress
- Specs: 11e6b77, 83e47e4, 3751089, contract 4ccc33c, tasks 7bbc63d.
- Back: 4acb297, cbf893f. Front: 24113f5..67bd21e.
