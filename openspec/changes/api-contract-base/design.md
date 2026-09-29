# Design

## Context

`scaffold-backend` (RRG-40) is merged: `budget-tracker-back` is a NestJS 12 ESM project (`.js`
import suffixes, oxlint, TypeORM) with a single `GET /health` endpoint and a CI workflow that only
lints and builds. `budget-tracker-specs` has no `openapi.yaml` yet. The frontend generates its
API client and Prism mock from that file, and the backend must not silently diverge from it. See
`proposal.md` for the motivation and `specs/api-conventions/spec.md` for the rules this design
implements.

Endpoints this change adds or modifies: none new. `GET /health` is the only path in
`openapi.yaml` and is documented (not changed) by this change.

## Goals / Non-Goals

**Goals:**
- An `openapi.yaml` (OpenAPI 3.1) at the specs repo root that encodes every convention in
  `api-conventions` as reusable components, so feature changes only add paths and schemas.
- The backend exports its real spec with `@nestjs/swagger`, with no database required.
- A CI job in `budget-tracker-back` that fails when an implemented endpoint breaks the contract.

**Non-Goals:**
- Any product endpoint (auth, plans, envelopes, ...); each feature change adds its own.
- Frontend client generation or Prism wiring (owned by the frontend scaffold change).
- Enforcing the two-dev PR approval by tooling (branch protection is configured on GitHub).

## Decisions

**Structure of `openapi.yaml` (OpenAPI 3.1).** One file, feature-agnostic base:
- `info`, `servers` (local `http://localhost:3000`), global `security: [bearerAuth: []]`.
- `tags`: one per feature, starting with `Health`; each feature change appends its tag.
- `paths`: only `/health` (`security: []`, response `{ status: "ok" }`).
- `components.securitySchemes.bearerAuth`: HTTP bearer, `bearerFormat: JWT`.
- `components.schemas`: `Error` (`statusCode`, `message` as string or string array, `error`),
  `ValidationError` (same, `message` is a string array, `statusCode` 400), `Uuid`, `Timestamp`
  (`date-time`), `MonthKey` (`^\d{4}-(0[1-9]|1[0-2])$`), `CurrencyCode` (enum `ARS`, `USD`,
  `EUR`), `Currency` (`{ code, symbol, name, minorUnits }`, see Money), `MoneyMinor` (integer;
  description documents the minor-unit rule), `PageMeta` (`page`, `pageSize`, `total`).
- Pagination: OpenAPI has no generics, so the pattern is documented in `PageMeta` and each list
  endpoint declares `allOf: [PageMeta, {properties: {items: {type: array, items: $ref}}}]`.
  Alternative considered: a `Paginated<T>` schema per resource written in full. Rejected as
  repetitive; `allOf` keeps the envelope defined once.
- `components.parameters`: `Page` (query, integer, min 1, default 1), `PageSize` (min 1, max 100,
  default 20).
- `components.responses`: `Unauthorized` (401 -> `Error`), `NotFound` (404 -> `Error`),
  `ValidationFailed` (400 -> `ValidationError`), reused with `$ref` from every operation.

**Money and currency.** Fields are named `<thing>Minor` and typed `MoneyMinor`. Currency lives on
the plan schema (added by the plans change) as a `Currency` object, never next to an amount.
Rationale: PRD §9 fixes integer minor units end to end; a per-amount currency would allow mixed
units the PRD forbids. `PRD-ux-spec.md` §7 ("Moneda") fixes the currency as one of exactly three
options chosen on screen 20 (Nuevo plan) and immutable afterwards (FR-40), so `Currency` is a
closed set, not an open ISO 4217 list:

| code | symbol | name (`PlanRow`: "pesos ($)") | minorUnits |
|------|--------|-------------------------------|------------|
| ARS  | `$`    | pesos                         | 0          |
| USD  | `US$`  | dólares                       | 2          |
| EUR  | `€`    | euros                         | 2          |

`MoneyMinor` values are expressed in the minor units defined by the plan currency's `minorUnits`,
so ARS amounts are whole pesos. The `name` is the Spanish display name the client shows in
`PlanRow`. Alternative considered: return only `code` and let each client keep its own
symbol/unit table. Rejected because the table would be duplicated in Flutter and Nest and could
drift; serving it from the API keeps one source.

**Formatting is client-side.** The API never returns pre-formatted money strings. The client
formats with the es-AR locale (`.` thousands, `,` decimal), the currency `symbol`, decimals from
`minorUnits`, and `−` before the symbol for negatives (PRD-ux-spec §7 "Montos"). This keeps
responses locale-neutral and machine-comparable.

**Convention for later changes: no financial state without membership.** Responses that must not
reveal a plan's financial state (e.g. the join preview on screen 30 "Unirse a un plan", or the
plan list rows on screen 16, which show only the currency name and symbol) omit amount fields
entirely; feature changes define separate lean schemas for them instead of nulling amounts.

**Backend spec export with `@nestjs/swagger`.** `src/openapi.ts` builds the document with
`DocumentBuilder` (title, version, bearer scheme named `bearerAuth`, global security requirement).
Both `main.ts` (Swagger UI at `/docs`, only when `NODE_ENV !== 'production'`) and the export script
use it, so what developers see in Swagger UI is what CI diffs. Controllers use explicit
decorators (`@ApiTags`, `@ApiOkResponse`, `@ApiProperty` on DTOs, `@ApiSecurity([])` for public
endpoints); the Nest CLI swagger plugin is not used, to keep behavior explicit and the build
unchanged.

**Export without a database.** The export script lives in `src/scripts/export-openapi.ts` (compiled
by `nest build`, so no ts-node/ESM loader is needed) and runs as `npm run openapi:export`
(`nest build && node dist/scripts/export-openapi.js`), writing `openapi.generated.json`
(gitignored). It uses `NestFactory.create(AppModule, { preview: true, logger: false })`: preview
mode builds the module graph and routes but does not instantiate providers, so `TypeOrmModule`
never connects. `ConfigModule` validates env at import time, so the script sets placeholder
`DATABASE_*` values with `??=` before importing `AppModule`. Prototype verified: the export runs
with Docker stopped and no `.env`. Alternative considered: a dedicated database-free module
duplicating controllers; rejected because it could drift from the real `AppModule`.

**Drift check in CI (`contract-drift` job).** Contract-first means the contract may be ahead of the
backend, so a plain full diff would fail on every unimplemented path. The job:
1. checks out `budget-tracker-back` and the public repo `rojb/budget-tracker-specs` (default
   branch `main`, so the approved contract is used) into `specs/`;
2. runs `npm ci` and `npm run openapi:export`;
3. downloads the pinned `oasdiff` release binary (v1.32.1);
4. runs `node scripts/contract-drift.mjs`, which reads the generated spec's paths, escapes them
   into an anchored regex, prints contract paths missing from the backend as a `::notice::`, then
   runs `oasdiff breaking specs/openapi.yaml openapi.generated.json --match-path '<regex>'
   --fail-on ERR` (contract is the base, the backend the revision: breakage means clients built
   from the contract would fail) and finally `oasdiff diff ... -f text` for informational output.
   Paths the backend implements but the contract lacks also fail the job, since that is
   undocumented API surface.
The binary is used instead of the `tufin/oasdiff` Docker image so the same command runs on
developer machines without Docker running; the pinned version keeps results reproducible.

**Two-dev approval** stays a repository setting (protected `main`, two approvals), documented in
`docs/COLABORACION.md` §4; it is not encoded in CI.

## Risks / Trade-offs

- [Nest emits OpenAPI 3.0, the contract is 3.1] -> oasdiff 1.32.1 compares the two (prototype
  verified); differences that are only version markers are informational. If a future construct
  (e.g. type arrays for nullable) yields false positives, use 3.0-compatible constructs in the
  contract.
- [Drift check only covers implemented paths, so a missing implementation goes unnoticed] ->
  Unimplemented paths are printed as notices in every run; ownership per change (docs/ROADMAP.md)
  covers completion.
- [`--match-path` regex built from generated paths] -> paths are escaped and anchored; parameter
  names must match between contract and controllers (`{id}` vs `{planId}`), which the diff
  reports.
- [CI depends on the specs repo being public and reachable] -> it is public by team decision; a
  checkout failure fails the job loudly rather than skipping the check.
- [Placeholder env in the export script] -> only affects preview mode, which never reads them for
  connections.
