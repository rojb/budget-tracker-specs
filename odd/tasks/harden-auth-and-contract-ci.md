# harden-auth-and-contract-ci (RRG-56)

## Objective
Close the non-blocking findings left by the RRG-42 and RRG-44 reviews, in the back repo.

## Why
The findings weaken two guarantees: the auth spec (tokens must be ours) and the contract-first drift
check (it can pass without actually running, and depends on unverified/moving inputs).

## Decisions
- JWT verification pins `algorithms: ['HS256']` (sign also explicit HS256). Delta spec on `auth`.
- `scripts/contract-drift.mjs` exits non-zero when `oasdiff` cannot run or its output cannot be
  parsed (fail closed).
- CI downloads the pinned `oasdiff` release and verifies its SHA-256 against a value committed in
  the workflow (taken from the release `checksums.txt`) before extracting.
- Contract ref pinning: back stores the specs commit it implements in `.contract-ref` (full SHA). CI
  checks out `rojb/budget-tracker-specs` at that SHA. Bumping it is an explicit commit in the back
  change that implements a new contract version (documented in README and COLABORACION §4).
  Tradeoff: one extra line per contract change, in exchange for reproducible CI and no breakage when
  specs `main` moves ahead of the back.
- Local drift run documented (oasdiff must be installed / on PATH).

## Tasks
- [x] T1 Proposal/specs/design/tasks, one commit per phase (delegated writer)
- [x] T2 Back implementation, one commit per task (same writer)
- [ ] T3 Verify + tasks-complete; review gate; merge; archive; Linear Done

## Checks
lint, build; curl: HS256 token ok, token signed with HS512 using the same secret → 401, alg none → 401;
drift script: missing oasdiff → non-zero; normal run → pass; checksum step: correct → ok, altered hash →
fail (simulate locally with the same shell/pwsh logic); `.contract-ref` resolves to an existing specs
commit. TDD: off (no test files rule).

## Progress
- RRG-56 created and In Progress.
- Specs: 01ea24a propose, ad47923 specs, 944949d design, 955306d tasks, 7847707 task 1.1, 153b13c tasks complete. Back: 32ba50c..89a064e (2.1-2.5).
- Evidence: JWT HS512-same-secret 401, alg none 401, HS256 200; drift exit 2 without oasdiff (parent re-ran), 0 with; checksum ok/tampered fails before extract; .contract-ref eaaace5 contains /auth/login; lint/build ok (parent re-ran). Actions run not yet observed.
