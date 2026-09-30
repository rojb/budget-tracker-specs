# add-payees (RRG-48)

## Objective
FR-05: payees as a manageable entity per plan, deleted logically so past transactions keep them.
Screens 15, 41, 47.

## Why
Phase 2. Unblocks add-transactions (Ruben): payee selection (26) and autocomplete (FR-23).

## Decisions
- `payees` with `deleted_at`; partial unique index on `(plan_id, lower(name))` for active payees
  → 409; a deleted name can be reused.
- Paginated list (`q`, `page`, `pageSize`) because payees grow with use; GET by id returns deleted
  payees too (`deleted: true`).
- `PayeesService.findOrCreate` and `transactionCounts` (0 until add-transactions) exported for Ruben.
- `suggested_envelope_id` without FK/validation until add-envelopes; 41's "Sobre" row disabled.
- 47 copy follows PRD FR-05 ("se conservan con este beneficiario"), not the render's "sin
  beneficiario asignado".

## Tasks
- [x] T1 Specs repo: specs → design → tasks
- [x] T2 Contract + back (1.1, 2.1–2.3)
- [x] T3 Front (3.1–3.4)
- [x] T4 Verify + tasks-complete; merge into nathaliascode/work; archive
- [ ] T5 Two-dev contract approval, PayeeRow review, on-device check, PRs to main, Linear Done

## Progress
- Specs: 60e47d3, 68d2926, 8936eb4, contract 4d2884d, complete 65ee341.
- Back: 771925a..9085464. Front: e3912ff..e91bfc2.
