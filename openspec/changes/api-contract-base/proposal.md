# Proposal

## Why

Both devs work against a shared `openapi.yaml` from day one so the frontend can build against a
stable stub/mock (Prism) while the backend implements endpoints, and so CI can detect drift
between the contract and the actual Nest implementation.

## What Changes

- Author the initial `openapi.yaml` in `budget-tracker-specs`: error envelope shape
  (`{ statusCode, message, error }`, Nest style), `Bearer` JWT auth scheme, money as integer in
  minor unit + plan `currency` (FR-40), dates as `timestamptz` ISO-8601, UUID v4 ids, pagination
  mechanism (offset `page`/`pageSize` vs. cursor — decide here), English naming conventions.
- Wire `oasdiff` in `budget-tracker-back` CI once `scaffold-backend` exists: compares
  `openapi.yaml` against the `@nestjs/swagger` export.
- PR requires approval from both devs (contract-first rule).

## Capabilities

### New Capabilities

None — this defines the shared API contract document and CI wiring, not an application
capability with its own requirements/scenarios. Each feature change owns the spec for its own
endpoints as it adds them to `openapi.yaml`.

### Modified Capabilities

None.

## Impact

- Repos touched: `budget-tracker-specs` (contract), `budget-tracker-back` (CI wiring).
- Depends on `scaffold-backend` for the `oasdiff` CI wiring; the document itself can be drafted
  in parallel.
- Resolves PRD ambiguity #1 (pagination mechanism, see `docs/ROADMAP.md`).

## Metadata

- Owner: Ruben (PR approved by nathaliascode)
- Repos touched: budget-tracker-specs, budget-tracker-back
- FRs covered: none directly (contract conventions used by all FRs); enables FR-40 (money/currency shape)
- Screens: none
- Depends on: scaffold-backend (for CI wiring only)
- Size: S
- Linear: [RRG-42](https://linear.app/rgonaut/issue/RRG-42)
