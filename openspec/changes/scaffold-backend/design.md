# Design

## Context

`budget-tracker-back` does not exist yet. This change creates it from scratch with the Nest CLI
and wires the infrastructure every later backend change will build on: per-feature module
convention, TypeORM against Postgres, config/env validation, migrations, Docker for local
Postgres, and CI (lint + build, no tests). See proposal.md - Why for the motivation; PRD.md
§"Persistencia" (~line 329) already fixes TypeORM + Postgres + docker-compose as the team's
persistence decision, with SQLite as a documented fallback if Docker setup blocks the team.

No application behavior ships in this change - no feature module, no entity beyond what NestJS
generates by default, no endpoint beyond a `/health` check reused from the Nest CLI boilerplate.

## Goals / Non-Goals

**Goals:**
- A cloned, buildable, lintable NestJS project with npm + Node 22.
- TypeORM connected to Postgres via `@nestjs/typeorm`, config validated at boot, `synchronize: false`.
- A working migration workflow (`generate` / `run` / `revert`) against a CLI-only `DataSource`.
- `docker-compose.yml` that brings up Postgres 16 for local development.
- The per-feature folder convention documented so the next change (`api-contract-base`, and every
  feature change after it) knows where files go, without creating a feature module now.
- CI that installs, lints, and builds on every push/PR - no test step.
- Zero test artifacts: no `*.spec.ts`, no `test/`, no Jest/ts-jest/supertest devDependencies.

**Non-Goals:**
- `@nestjs/swagger` wiring and the `oasdiff` contract-drift check - that is `api-contract-base`
  (RRG-42)'s job, not this change's.
- Any feature module, entity, or endpoint tied to product behavior (envelopes, plans, auth, …).
- Authentication/authorization - out of scope until `add-auth` (RRG-44).
- Deployment/hosting concerns - the PRD states the evaluation is local, no deployment.

## Decisions

**Package manager: npm.** Fixed by `odd/tasks/scaffold-backend.md` constraints and
`openspec/config.yaml` (Node 22, npm). No alternative considered.

**Nest CLI scaffold (`@nestjs/cli@latest new`) over a manual `package.json`.** The CLI gives a
working TypeScript build, ESLint/Prettier config, and `nest-cli.json` for free, all of which this
change needs anyway. Manually assembling the same from scratch would only reproduce Nest's own
defaults with more risk of drift. Trade-off: the CLI also generates a default Jest setup and
`*.spec.ts` files, which this change removes immediately after scaffolding (see Risks).

**TypeORM + `@nestjs/typeorm` + `pg` over Prisma or a raw `pg` client.** PRD.md §9 (persistence,
~line 329) already settled this at product level: "TypeORM se integra de forma nativa con NestJS
... y define el modelo como entidades por feature, con migraciones generadas por su CLI." Prisma
was the original PRD decision (v1.1) and was explicitly superseded in PRD.md v1.8. A raw `pg`
client would mean hand-rolling migrations and entity mapping with no framework support - rejected.

**Config validation: `@nestjs/config` with a Joi schema, over `class-validator`/`class-transformer`
on a config class.** Both are common Nest patterns. Joi is chosen because `@nestjs/config`'s
`validationSchema` option is a single, self-contained schema object next to the module
registration (`ConfigModule.forRoot({ validationSchema })`) - no extra DTO class, decorators, or
`plainToInstance` boilerplate needed for a handful of env vars (`DATABASE_*`, `PORT`, `NODE_ENV`).
`class-validator` is kept for request DTOs (where it is already idiomatic Nest via
`ValidationPipe`), not duplicated for env config. Trade-off: Joi is one more dependency, but it
replaces what would otherwise be a hand-written config class with equivalent validation code.

**`TypeOrmModule.forRootAsync` with `autoLoadEntities: true`, `synchronize: false`.**
`forRootAsync` lets the datasource options come from `ConfigService` (already validated by Joi)
instead of hard-coded values or direct `process.env` reads. `autoLoadEntities: true` means every
feature module that registers entities via `TypeOrmModule.forFeature([...])` is picked up
automatically, so adding a feature never requires touching the root connection config.
`synchronize: false` is mandatory per the constraints and PRD: schema changes only happen through
reviewed migrations, never implicit sync, which would silently diverge across the two devs'
machines.

**Standalone `src/database/data-source.ts` for the TypeORM CLI, separate from the Nest
`forRootAsync` config.** The TypeORM CLI (`typeorm migration:generate/run/revert`) needs a plain
`DataSource` instance it can import outside of Nest's DI container; it cannot consume
`ConfigService`. `data-source.ts` reads `process.env` directly (loaded via `dotenv` at the top of
the file) and constructs the same connection shape used by the app. This is the standard
`@nestjs/typeorm` pattern for CLI migrations and avoids maintaining two divergent connection
configs by keeping both driven from the same `.env`.

**Migrations in `src/database/migrations`, run via npm scripts wrapping `typeorm-ts-node-commonjs`
(or `ts-node` + `typeorm` CLI).** Centralizing migrations under `src/database/migrations` (as
opposed to per-feature migration folders) keeps migration ordering globally obvious - Postgres
migrations are inherently a single, ordered, cross-feature timeline, so splitting them per feature
would only make ordering harder to reason about without any real isolation benefit.

**Per-feature folder convention documented, not scaffolded.** `src/<feature>/{<feature>.module.ts,
.controller.ts, .service.ts, dto/, entities/}` is written into this change's README/design as the
convention every future feature change follows, matching `openspec/config.yaml`'s "classic
per-feature modules, NOT hexagonal" rule. No feature module is created now because this change has
no product behavior to implement (Non-Goals) - creating an empty example module would be dead code
with nothing to verify against.

**Global `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })`
registered in `main.ts`.** Standard Nest hardening: strips unknown properties, rejects requests
carrying properties not declared on the DTO, and auto-transforms payloads to their DTO classes.
Applied globally now so every future feature module's DTOs are validated without each one wiring
its own pipe.

**No tests, no Jest.** Fixed by team-wide constraint (`openspec/config.yaml`, PRD.md v1.8,
`odd/tasks/scaffold-backend.md`). Verification is manual per change (`docker compose up`, curl
`/health`, `npm run migration:run` against the running DB) - see docs/COLABORACION.md §6.

**CI: install → lint → build, no test step, GitHub Actions, Node 22.** Matches the constraint
directly. `@nestjs/swagger`/`oasdiff` contract-drift CI step is explicitly deferred to
`api-contract-base` (RRG-42) per that change's scope - this CI workflow only proves the code
installs, passes lint, and compiles.

**`docker-compose.yml`: `postgres:16` + named volume + healthcheck.** Postgres 16 is the current
stable major version compatible with TypeORM's Postgres driver. A named volume persists data
across `docker compose down`/`up` cycles during local development. The healthcheck (`pg_isready`)
lets `docker compose up -d` be immediately followed by an app start without a manual wait, and
lets future CI or scripts gate on DB readiness if needed.

## Risks / Trade-offs

- [Nest CLI generates `*.spec.ts`, a `test/` folder, and Jest devDependencies by default] →
  Deleted immediately after scaffolding, before the first commit; `nest-cli.json`
  `generateOptions.spec: false` prevents any future `nest generate` from reintroducing them; CI
  has no test step so a reintroduced spec file would not silently start running.
- [Two connection configs (`forRootAsync` for the app, `data-source.ts` for the CLI) could drift]
  → Both are driven from the same `.env` file and the same variable names; `data-source.ts` is
  kept minimal (host/port/user/password/db/entities/migrations paths only) to reduce surface
  area for divergence.
- [`synchronize: false` means every schema change needs an explicit migration, adding friction to
  early development] → Accepted deliberately per PRD/constraints; the alternative (implicit sync)
  risks silent schema drift between the two devs' machines, which is worse for a 2-person team
  without a shared dev DB.
- [Docker may not be available or may be slow in the evaluation environment] → PRD.md §9 already
  documents the fallback: switch TypeORM's `type` to `sqlite` and document the reason; not
  implemented in this change unless Docker verification actually fails.
- [`@nestjs/swagger` is not wired here] → `GET /health` and any other endpoint added later by this
  change is undocumented in OpenAPI until `api-contract-base` runs; acceptable since this change
  ships no product endpoints.

## Migration Plan

This is a greenfield repository, so there is no data migration. Rollout is: scaffold → strip
tests → implement design decisions above → verify locally (lint, build, `docker compose up`, app
boot, `migration:run` against the empty DB) → commit on `rrg-40-scaffold-backend` → PR. Rollback
is trivial (the branch/PR is simply not merged); there is no deployed state to roll back.
