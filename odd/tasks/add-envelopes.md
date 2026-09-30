# add-envelopes (RRG-47)

## Objective
FR-04: envelope groups and envelopes per plan — CRUD, reordering, starter template (4 groups / 12
envelopes) and initial bulk assignment. Screens 02 (group/envelope management), 31, 32, 52, 44, 43,
35, 46.

## Why
Core budgeting unit. Unblocks add-transactions (RRG-49), add-monthly-assignment (RRG-51,
nathaliascode), add-envelope-goals (RRG-52), add-reports (RRG-54).

## Constraints / sync points
- Builds on nathaliascode's merged work: `plans`, `accounts`, `payees`, `budget-calc-engine` specs and
  back modules (`src/budget/*` has `Assignment`, `BudgetMonth`, `CalculationService`; `payees` has
  `suggestedEnvelopeId`). Reuse, don't duplicate: initial bulk assignment goes through the existing
  assignment facts, and FKs to the new `envelopes` table are added where those columns exist.
- Screen 02 is shared with RRG-51 (add-monthly-assignment, nathaliascode): this change delivers
  group/envelope structure and management affordances; the monthly amounts view/assign flow belongs
  to RRG-51. Document the boundary in design.md so neither duplicates.
- Plan membership authorization: only members of the plan can read; only editors/owners can mutate
  (reuse whatever plan-access guard/service the plans/plan-sharing changes established).
- Contract first; back `.contract-ref` bumped to the specs commit that contains the new paths.
- Repo layout: back/front now live inside the specs folder (`2do/budget-tracker-back`,
  `2do/budget-tracker-front`); contract path from back is `../openapi.yaml`.
- No test files. UI only from `packages/ui`; new domain rows (EnvelopeRow, GroupRow) go to
  packages/ui with Widgetbook stories (COLABORACION §5 → notify nathaliascode).

## Tasks
- [x] T1 Specs repo: specs → design → tasks, one commit per phase (delegated writer)
- [x] T2 Contract + back + client regen + front per tasks, one commit per task (same writer)
- [x] T3 Verify (lint/build/analyze, drift, live API incl. authz, device flows vs design) + tasks-complete
- [ ] T4 Review gate; merge (specs first); archive; Linear Done

## Checks
back: lint, build, migrations, drift vs pinned contract, curl CRUD/reorder/template/bulk assign +
403/404 for non-members. front: analyze, apk, device screens vs design PNGs. TDD: off.

## Progress
- RRG-47 In Progress. RRG-45/46 merged by nathaliascode (PR #1).
- Specs: a0b7122 specs, 3d91a36 design, 1a85de1 tasks, 683dd26 openapi (1.1), 9ce831e tasks complete, 1dc039d verification. Back 777004a..a5d4eb6 (.contract-ref -> 683dd26). Front 854ae05..4782e27 + fix 087327d.
- Evidence: curl CRUD/reorder/template/bulk assign, non-member 404, viewer 403, drift 0 (both refs); analyze/apk; device flow 06-35-46-02-31-52-32-44-43 vs design; Swagger 14 ops match; 32 duplicate rename in-field error; Widgetbook new rows. Parent re-ran lint/build/analyze and reviewed cmp-s02/cmp-s46.
- Decisions: names unique per plan case-insensitive; group delete -> envelopes to Sin grupo; envelope delete removes assignments; long-press 02 row -> 43 until 23 exists; 02 month arrows/filters/joined + left to RRG-51. Shared showTextEditSheet fix (features/common). Local builds (app+widgetbook) need temporary kotlin.incremental=false on this machine.
