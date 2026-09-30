# add-plan-sharing (RRG-53)

## Objective
FR-27: join a plan with a single-use, 24 h invitation code (and its QR link) with a role; the
owner manages members. Screens 21, 30, 45 and member roles in 16.

## Why
Phase 6 (complementary, team decision). Depends only on add-plans-and-accounts.

## Decisions
- `plan_invitations`, one pending code per plan (partial unique index), 6 chars without ambiguous
  characters, dash optional on input; accept locks the row (single use under concurrency); 5
  members max; owner cannot leave or be changed (409).
- Preview without amounts or emails. Link `https://sobres.app/unirse/<CODE>`; Android intent
  filter + iOS deep-link flag; without a session the code waits in `PendingInvite` through 19/18.
- No in-app QR scanner: the phone camera opens the link (FR-27); 30's tab explains it.
- New deps `qr_flutter`, `share_plus`; new `UiCodeCard`, tappable `UiMemberRow` role.

## Tasks
- [x] T1 Specs repo: specs → design → tasks
- [x] T2 Contract + back (1.1, 2.1–2.3)
- [x] T3 Front (3.1–3.5)
- [x] T4 Verify + tasks-complete; merge into nathaliascode/work; archive
- [ ] T5 Two-dev contract approval, component review, on-device deep link, PRs to main, Linear Done

## Progress
- Specs: 2b35f64, df0d145, 610a4e7, contract 58aca2f.
- Back: 914ed07..afe8db4. Front: 6309b61..55e6d78.
