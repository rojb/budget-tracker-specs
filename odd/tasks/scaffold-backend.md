# scaffold-backend (RRG-40)

## Objective
Bootstrap `budget-tracker-back` (NestJS + TypeORM + Postgres) so every feature change can add a
module without touching infrastructure.

## Why
First foundation change; unblocks `api-contract-base` (RRG-42) and `add-budget-calc-engine` (RRG-45).

## Constraints
- Classic NestJS per-feature modules (module/controller/service/dto/entities). NO hexagonal.
- TypeORM on Postgres; `synchronize: false`; migrations via TypeORM CLI.
- NO test files: no `*.spec.ts`, no `test/`, no Jest; `nest-cli.json` `generateOptions.spec: false`.
- npm as package manager (Node 22).
- OpenSpec change: `openspec/changes/scaffold-backend` (skip_specs); tasks.md authored here.

## Tasks
- [x] T1 Author `tasks.md` for the change in specs repo (route: inline)
- [x] T2 Scaffold back repo: Nest CLI, remove tests/Jest, TypeORM + config + docker-compose + data-source + migration scripts, CI lint+build, README (route: delegated writer, many files)
- [x] T3 Verify: lint, build, docker compose up, app boots and connects to DB, no test files (route: writer self-verification + parent spot check)
- [x] T4 Work-unit commit on branch `rrg-40-scaffold-backend` in back repo; RDD assessment (RDD on, global)

## SDD traceability (user requirement)
Git history must demonstrate the OpenSpec (Fission-AI) SDD cycle: one specs-repo commit per phase
(design → tasks → tasks complete with back-repo hashes → archive after merge), and one back-repo
commit per task referencing `(RRG-40, task N.N)`.

## Checks
`npm run lint`, `npm run build`, `docker compose up -d` + app start log shows TypeORM connected,
file search for `*.spec.ts` / `test/` returns nothing. TDD: off (project rule: no test files).

## Progress
- RRG-40 moved to In Progress.
- Specs commits: 5677cc8 design, 73fc7c8 tasks, 6a5b24d tasks complete. Back commits f81db0f..cda2b08 (one per task 1.1-1.11) on rrg-40-scaffold-backend; main 17a3407.
- Evidence: lint pass, build pass, docker postgres healthy, app boots + TypeORM connected, GET /health ok, migration:run no pending, no test files (writer); parent re-ran lint/build and read key files.
- Stack reality: NestJS 12 ESM, oxlint (not eslint), TypeORM 1.1 CLI via typeorm-ts-node-esm.
- RDD: assessed high (CI shell); user declined review for this candidate.
- Next: user decides push + PRs; archive change after merge; Linear Done.
