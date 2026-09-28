# Team coordination setup (budget-tracker)

## Objective
Prepare everything two developers (Ruben, nathaliascode) need to build budget-tracker in parallel,
split **by feature (full-stack)**, without integration surprises.

## Problem / Why
Two separate code repos (NestJS back, Flutter front), one planning source (PRD, UX spec, OpenPencil design),
no git, empty OpenSpec scaffold, and PRD/ALCANCE still describe a back/front split by layer.
Without a shared contract, ownership map and tracker, the two devs will drift (API shape, UI consistency).

## Decisions (accepted by user)
- Split: by feature, full-stack; one owner per OpenSpec change covering both repos.
- Repos: `budget-tracker-specs` (this folder; OpenSpec store + openapi.yaml + PRD + UX spec + design),
  `budget-tracker-back` (NestJS, classic per-feature modules, NO hexagonal),
  `budget-tracker-front` (Flutter, `packages/ui` local package + Widgetbook).
- Contract-first `openapi.yaml`; back verifies drift with `@nestjs/swagger` export + `oasdiff` in CI.
- UI coherence: `PRD-ux-spec.md` §6.1, §7, §8 are binding; only `packages/ui` components in screens.
- NO test files in either repo: no `*.spec.ts`/`*.test.ts` (NestJS), no `*_test.dart`/golden tests (Flutter).
  OpenSpec `spec.md` files are unaffected. Nest CLI spec generation disabled; default test files removed.
  `oasdiff` drift check stays (not a test). Verification is manual: Widgetbook (UI), Swagger UI/Prism (API).
- OpenSpec (Fission-AI) 1.13.2: `openspec store` + `openspec workset` for multi-repo.
- Progress tracked in Linear (team Rrgonaut) in a NEW project (not UMLive).

## Scope
In: specs repo init, OpenSpec config/context/rules, collaboration guide, roadmap with feature→owner
assignment, OpenSpec change proposals, Linear project/issues, PRD/ALCANCE split update.
Out: scaffolding back/front code (that is the first foundation change's work), GitHub remotes (user-owned).

## Tasks
- [x] T1 Draft roadmap → docs/ROADMAP.md (16 changes; effort Ruben 16 / nathaliascode 17): features → OpenSpec changes, dependencies, phases, balanced owner assignment (route: delegated — needs PRD + UX spec + odd docs, 4+ files)
- [x] T2 User approves roadmap/assignment — Ruben: all Phase 0 + add-envelopes, add-transactions, add-transaction-editing-and-filters, add-envelope-goals (18); nathaliascode: add-budget-calc-engine, add-plans-and-accounts, add-payees, add-monthly-assignment, add-plan-sharing, add-reports, add-account-transfers (15). Ruben does scaffold-backend + api-contract-base first to unblock calc engine.
- [x] T3 OpenSpec config.yaml context + rules, collaboration guide, PRD/ALCANCE split update, change proposals (route: delegated writer, 2+ files)
- [ ] T4 git init specs repo + register OpenSpec store `budget-tracker-specs` (route: inline, state commands)
- [ ] T5 Linear: project, labels, milestones, one issue per change with owner (route: inline MCP; requires user confirmation; nathaliascode must be invited)

## Acceptance criteria
- Each dev can read one doc and know: their changes, order, dependencies, how to sync contract/UI.
- `openspec validate --all` passes on the specs repo.
- Every OpenSpec change has a matching Linear issue with assignee (or pending invite noted).

## Checks
- `openspec validate --all`, `openspec list`, readback of written files, Linear list_issues readback.
- TDD: not applicable (documentation/planning only).

## Progress
- Exploration done (PRD, UX spec, design, openspec state, Linear workspace).
