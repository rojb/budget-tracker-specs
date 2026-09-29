# Tasks

## 1. [specs]

- [ ] 1.1 Update `docs/COLABORACION.md` section 4 (Spanish): the back declares the contract version it implements in `.contract-ref`, CI compares against that pinned commit, and the bump procedure (update `.contract-ref` in the back commit that implements a new contract version, using the merged specs commit). This change does not modify `openapi.yaml`. Verify the section reads correctly and `openspec validate harden-auth-and-contract-ci` passes.

## 2. [back]

- [ ] 2.1 Pin JWT algorithms in `src/auth/auth.module.ts`: `signOptions.algorithm: 'HS256'` and `verifyOptions.algorithms: ['HS256']`. Verify `npm run lint` and `npm run build` pass.
- [ ] 2.2 Make `scripts/contract-drift.mjs` fail closed: exit codes 0 (no drift), 1 (drift), 2 (check could not run), a clear message when `oasdiff` is missing, and a guarded parse of the `oasdiff` JSON output. Verify with `oasdiff` off `PATH` (non-zero and a clear message) and with it on `PATH` after `npm run openapi:export` (exit 0).
- [ ] 2.3 Verify the `oasdiff` download in `.github/workflows/ci.yml`: add `OASDIFF_SHA256` (from the release `checksums.txt`), download the tarball to `$RUNNER_TEMP`, run `sha256sum -c`, then extract. Verify the committed hash checks OK against the real tarball, fails with one altered digit, and the workflow YAML parses.
- [ ] 2.4 Pin the contract: add `.contract-ref` with the full specs commit SHA and make the workflow check out `rojb/budget-tracker-specs` at the `ref` read from it (failing on a malformed value). Verify `.contract-ref` resolves to a commit in the specs repo whose `openapi.yaml` contains `/auth/login`, the drift script passes against it, and the workflow YAML parses.
- [ ] 2.5 Update `README.md` (Spanish): the JWT algorithm pin, the pinned contract and bump procedure, the checksum step, and the local drift run (`oasdiff` on `PATH` or `OASDIFF`). Verify the documented commands run as written.

## 3. Verification

- [ ] 3.1 Manual verification checklist. Back: `npm run lint`, `npm run build`, `docker compose up -d --wait`, `npm run migration:run`, start the app; register/login returns a token and `GET /users/me` with it is `200`; a token signed with HS512 using the same secret returns `401`; a token with `alg: none` returns `401`; stop the app and `docker compose down`. Drift script: missing `oasdiff` gives a non-zero exit and a clear message; with `oasdiff` on `PATH` after `npm run openapi:export` against the pinned contract it passes. Checksum: correct hash OK, altered hash FAILED. `.contract-ref` is an existing specs commit that includes the auth endpoints. Workflow YAML parses. Swagger UI/Prism vs. `openapi.yaml`: no endpoint is added or modified by this change, `GET /users/me` still documents `200` and `401`. `openspec validate harden-auth-and-contract-ci` passes. No test files anywhere (`*.spec.ts`, `*.test.ts`, `test/`).
