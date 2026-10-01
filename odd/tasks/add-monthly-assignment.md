# add-monthly-assignment (RRG-51)

## Objective
FR-09, FR-10, FR-15, FR-16, FR-21 and the UI of FR-11/FR-12: assign money to envelopes in any
month, month navigation, status filters, the future month view and the month close. Screens 02,
03, 53, 04, 25.

## Why
Phase 4, the main consumer of the calc engine. Depends on add-envelopes, add-transactions and
add-budget-calc-engine (all merged).

## Decisions
- Own `months` module in the back; it reads the lines and the ledger from `EnvelopesService` and
  writes only assignments (`shiftAssignments`, a delta) and the close confirmation, so Ruben's
  `envelopes` module and `listEnvelopes` contract stay untouched.
- Assigning adds to the month's assignment (03/53 "Asignar $ X", "quedaría en"); one row per
  envelope and month is kept (FR-11).
- The close stays derived; `budget_months.closed_at` only records that 25 was confirmed (plan-wide).
  25 opens by itself for owners and editors when the previous month's close moves money and is not
  confirmed.
- Front in `lib/features/plan`: `MonthController` follows `EnvelopesController`, which now keeps a
  viewed month (`showMonth`). 02 and 04 are one page; "Cubiertos" counts funded rows with money.
- New `packages/ui`: `UiAssignCard`, `UiCloseRow`, `UiBalanceCheck`; `UiChip.icon`,
  `UiInfoNote` action, `UiEnvelopeRow.subtitleMaxLines`, icon `calendarClock`. Flagged for Ruben.

## Tasks
- [x] T1 Specs repo: specs → design → tasks
- [x] T2 Contract + back (1.1, 2.1–2.3)
- [x] T3 Front (3.1–3.5)
- [x] T4 Verify against the real API and the renders + tasks-complete
- [ ] T5 Two-dev contract approval, component review, on-device check, PRs to main, archive, Linear Done

## Progress
- Specs: 376bc53, 439e77c, cefd688, contract 9ca3457, design alignment a77fbd1, tasks ac9b430.
- Back: 0e8a753..930bb16. Front: b83fd87..7bb361e.
