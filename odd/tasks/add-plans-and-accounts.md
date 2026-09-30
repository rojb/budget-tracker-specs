# add-plans-and-accounts (RRG-46)

## Objective
FR-02, FR-03, FR-40: plans with an immutable currency and members; accounts with derived balance,
archived instead of deleted. Screens 20, 06, 16, 33, 13, 14, 28, 42, 48, 51, 37 (+ 01/39 shells).

## Why
Phase 2 core entities. Unblocks add-envelopes (Ruben needs `Plan` and `PlanAccessService`),
add-payees, add-plan-sharing and add-account-transfers.

## Decisions
- Roles owner/editor/viewer; `PlanAccessService.require(planId, userId, roles)`: non-member 404,
  role not allowed 403. Exported for every plan-scoped module.
- `POST /plans` creates the first account atomically; plans/accounts lists are plain arrays
  (bounded). Currency immutable: `UpdatePlanRequest` only whitelists `name`.
- Balance derived in `AccountsService.balances` (opening balance until add-transactions extends it).
- Contract: path parameters per operation and `archivedAt` optional (oasdiff 1.32.1 / Redocly 3.1
  constraints). `.contract-ref` bumped.
- Front: app-scoped `PlansController` (active plan remembered) and `AccountsController`; tabs with
  `StatefulShellRoute`; 01 and 39 shells built here (entry to 16). Owner label "Titular"
  (gender-neutral).
- New packages/ui components (need Ruben's review, COLABORACION §5): JoinedCard, MonthSwitch,
  AccountRow + Card, PlanRow, MemberRow, CurrencySelector, Sheet, InfoNote, StripeBar,
  ChecklistRow, MenuRow; Button white/danger, Chip soft, Avatar color; accessibility fixes in
  HitTarget, FieldRow, AccountRow.

## Tasks
- [x] T1 Specs repo: specs → design → tasks
- [x] T2 Contract + back (2.1–2.4)
- [x] T3 Front (3.1–3.11)
- [x] T4 Verify + tasks-complete commit; merge into nathaliascode/work; archive
- [ ] T5 Two-dev contract approval, Ruben reviews packages/ui, on-device check, PRs to main, Linear Done

## Progress
- Specs: 6465af5, 740f5fb, 1c80c9d, contract d3e140a + f8a9c83, docs ce87ee7, 8ae5cde, complete 9106f28.
- Back: 4fbb4cc..0f97ac7. Front: 9e67e19..d442e2c.
- Environment: installed Android SDK (cmdline-tools, platform 36, build-tools 36) to build the apk;
  no device/emulator, so screens were driven in a local-only web build against the real back.
