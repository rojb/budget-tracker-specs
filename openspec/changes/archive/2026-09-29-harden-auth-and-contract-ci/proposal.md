# Proposal

## Why

The reviews of `add-auth` (RRG-44) and `api-contract-base` (RRG-42) left non-blocking findings that
weaken two guarantees. First, the auth spec says a session token must be one the server signed, but
the JWT verification does not pin the signing algorithm. Second, the contract-first drift check can
pass without really running, downloads its tool without verifying it, and compares against a moving
target: the `main` branch of the specs repo, which can move ahead of the backend.

## What Changes

- Backend: pin JWT signing and verification to HS256 only; a token signed with any other algorithm,
  or unsigned (`alg: none`), is rejected with `401`.
- Backend: `scripts/contract-drift.mjs` fails closed. It exits non-zero, with a clear message, when
  `oasdiff` cannot run or its output cannot be parsed.
- Backend CI: verify the SHA-256 of the downloaded `oasdiff` release against a value committed in the
  workflow before extracting it.
- Backend CI: check out the specs repo at the commit recorded in a new `.contract-ref` file instead
  of its default branch; bumping it is an explicit commit.
- Docs: document the bump procedure (`docs/COLABORACION.md` section 4) and the local drift run
  (back README).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `auth`: the session token requirement now demands HS256 signatures only.
- `api-conventions`: the contract-first drift rule runs against the pinned contract version the
  backend declares and fails closed when the check cannot run.

## Impact

- Repos touched: `budget-tracker-specs` (delta specs, `docs/COLABORACION.md`),
  `budget-tracker-back` (auth module, drift script, CI workflow, `.contract-ref`, README).
- No endpoint or schema changes; `openapi.yaml` is untouched.
- Verification: manual (curl with forged tokens, drift script runs, checksum simulation).

## Metadata

- Owner: Ruben
- Repos touched: budget-tracker-specs, budget-tracker-back
- FRs covered: FR-01
- Screens: none
- Depends on: add-auth, api-contract-base
- Size: S
- Linear: [RRG-56](https://linear.app/rgonaut/issue/RRG-56)
