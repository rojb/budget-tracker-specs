# api-contract-base (RRG-42)

## Objective
Create the base `openapi.yaml` contract (conventions + shared components) in the specs repo and
wire contract-drift detection (`@nestjs/swagger` export + `oasdiff`) into the back repo CI.

## Why
Contract-first: every feature change adds endpoints on top of these conventions. Unblocks
`add-budget-calc-engine` (RRG-45, nathaliascode) and `add-auth` (RRG-44).

## Decisions
- Pagination: offset-based `?page` (1-based) + `?pageSize` (default 20, max 100), response envelope
  `{ items, page, pageSize, total }`. Rationale: small per-user datasets, simplest for Flutter lists.
- Money: integer minor units (`amountMinor`), currency is a plan property (ISO 4217), never per amount.
- Errors: Nest default shape `{ statusCode, message, error }` (message may be string or string[]).
- Auth: HTTP bearer JWT security scheme, applied globally; public endpoints opt out.
- IDs UUID v4; timestamps ISO-8601 with offset; month keys `YYYY-MM`; JSON camelCase.
- Drift check scope: contract may be AHEAD of the back (contract-first), so CI only fails when an
  endpoint that EXISTS in the back differs from the contract; unimplemented contract paths are
  reported, not failed.
- SDD: this change gets a real spec (capability `api-conventions`), so `skip_specs` is removed.

## Tasks
- [x] T1 Specs repo: specs → design → tasks, one commit per phase (route: delegated writer)
- [x] T2 Specs repo: implement `openapi.yaml` per tasks (route: same writer)
- [x] T3 Back repo: `@nestjs/swagger`, spec export script, oasdiff CI job (route: same writer)
- [ ] T4 Verify + tasks-complete commit; merge; archive; Linear Done

## Checks
`openspec validate api-contract-base`, OpenAPI lint of `openapi.yaml` (redocly or equivalent via npx),
back `npm run lint` + `npm run build`, export script produces a spec, oasdiff check runs locally
and passes. TDD: off (no test files rule).

## Progress
- RRG-42 moved to In Progress.
- Specs branch: e7a8a8a specs, b9ca594 design, 78b3335 tasks, d5b46d2 task 1.1, 97775ef task 1.2, ddb9254 tasks complete. Back branch: 9b7f1a1..2f635b9 (tasks 2.1-2.4).
- UX spec §7 Moneda folded in: Currency {code ARS|USD|EUR, symbol, name, minorUnits 0/2/2}; clients format.
- Evidence: redocly lint valid (14 warnings), openspec validate ok, back lint+build ok (parent re-ran), openapi:export works without DB, drift script passes and fails on injected mismatches. contract-drift job not yet run on GitHub.
