# add-account-transfers (RRG-55)

## Objective
FR-28: move money between two accounts of the same plan without envelopes. Screen 29 (+ 38 and
transfers in 14).

## Why
Phase 6 (complementary, team decision). Depends only on add-plans-and-accounts.

## Decisions
- Own table `account_transfers` in the `accounts` module (not a transaction row): no envelope or
  payee by construction, and no writes into Ruben's future `transactions` schema; 10 will union.
- Transfers folded into `balances`, `monthlyFlows` (plan time zone) and `ledgerBalanceMovements`
  (only the active side counts). Create/list/delete; no edit (delete and recreate).
- 38 Fecha y hora and `UiTxRow` built here as first consumers (both assigned to add-transactions in
  the roadmap); `UiCalendarMonth`, `UiStepper` new. Flagged for Ruben.

## Tasks
- [x] T1 Specs repo: specs → design → tasks
- [x] T2 Contract + back (1.1, 2.1–2.3)
- [x] T3 Front (3.1–3.4)
- [x] T4 Verify + tasks-complete; merge into nathaliascode/work; archive
- [ ] T5 Two-dev contract approval, component review, on-device check, PRs to main, Linear Done

## Progress
- Specs: e543cf9, a38ef60, cb298a6, contract a2bdfbd.
- Back: f7fd565..c414f0e. Front: a753fa0..54af7f0.
