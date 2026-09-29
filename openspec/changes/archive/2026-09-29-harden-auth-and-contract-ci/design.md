# Design

## Context

`add-auth` shipped a `JwtModule` configured with only a secret and an expiry, so verification relies
on the `jsonwebtoken` default: any HMAC algorithm (HS256, HS384, HS512) is accepted for a string
secret. `api-contract-base` shipped the `contract-drift` CI job, which checks out the specs repo
`main`, downloads `oasdiff` with `curl | tar` without any integrity check, and runs
`scripts/contract-drift.mjs`. The RRG-42 and RRG-44 reviews flagged these as non-blocking findings.
This change closes them in `budget-tracker-back` and documents the new contract-pin procedure.

Sources: capability specs `auth` (Session token) and `api-conventions` (Contract-first drift rule),
`docs/COLABORACION.md` sections 3.1 and 4.

## Goals / Non-Goals

**Goals:**
- Accept only HS256 tokens, sign explicitly with HS256.
- A drift check that cannot silently pass: missing tool or unreadable output is a failure.
- An `oasdiff` download that is verified against a committed SHA-256.
- A reproducible contract reference: the back declares which specs commit it implements.

**Non-Goals:**
- Changing the token format, expiry, refresh tokens or moving to asymmetric keys.
- Any endpoint or schema change: `openapi.yaml` is untouched and no API surface is added or modified.
- Test files of any kind (repo rule); verification is manual.
- Vendoring the `oasdiff` binary or moving to a container image for it.

## API surface

None. No endpoint is added or modified, so there are no `openapi.yaml` entries to create. The
observable behavior change is on existing protected endpoints (for example `GET /users/me`): a token
signed with a non-HS256 algorithm now yields the same `401` as any other invalid token.

## UI components

None. This change has no UI.

## Decisions

### JWT algorithm pinning

`src/auth/auth.module.ts` sets both directions explicitly in `JwtModule.registerAsync`:

```ts
signOptions: { algorithm: 'HS256', expiresIn: ... },
verifyOptions: { algorithms: ['HS256'] },
```

`AuthGuard` keeps calling `jwt.verifyAsync(token)`; `@nestjs/jwt` merges `verifyOptions` from the
module. `jsonwebtoken` already refuses `alg: none` when a secret is supplied, and the `algorithms`
allow-list makes the HS512-with-same-secret case fail with `invalid algorithm`; the guard maps any
verification error to the existing generic `401`. No guard change is needed. Alternative considered:
passing `algorithms` at each `verifyAsync` call; rejected because a future second call site would
silently lose the pin, while module options cover every use of `JwtService`.

### Drift script exit codes

`scripts/contract-drift.mjs` gets one documented convention:

| Exit code | Meaning |
|---|---|
| 0 | No drift on implemented endpoints |
| 1 | Drift detected (breaking change, or implemented endpoint missing from the contract) |
| 2 | The check could not run: bad usage, `oasdiff` not found or failing to start, non-zero exit that is not a drift verdict, or output that is not valid JSON |

Changes: the structural `JSON.parse` is wrapped so an unparseable output prints
`oasdiff output could not be parsed` and exits 2; the missing-binary message names the tool and how
to install it (`OASDIFF` env or `PATH`, README link). The two `run()` failure paths (spawn error and
non-zero status of the structural diff) already exit 2 and are kept. A silent success remains
impossible: the script only reaches "No contract drift" after every `oasdiff` call ran and parsed.

### Checksum verification in CI

The workflow keeps `OASDIFF_VERSION: 1.32.1` and adds `OASDIFF_SHA256` with the value for
`oasdiff_1.32.1_linux_amd64.tar.gz`, copied from the release's official `checksums.txt`
(`https://github.com/oasdiff/oasdiff/releases/download/v1.32.1/checksums.txt`):

```
7c8939fc49b75ee11fec66a5b83b37a2fca6aee109fed85013b1ba2ac2a1ee7f
```

The install step downloads the tarball to `$RUNNER_TEMP` (`curl -fsSL -o`), runs
`echo "$OASDIFF_SHA256  <file>" | sha256sum -c -` (non-zero exit fails the step under GitHub's
default `bash -e`), and only then extracts `oasdiff`. Bumping the tool version means updating both
`OASDIFF_VERSION` and `OASDIFF_SHA256` in the same commit. Tradeoff: one more constant to maintain,
in exchange for detecting a tampered or truncated download; the hash is committed rather than
fetched at runtime because a `checksums.txt` fetched from the same origin would prove nothing.

### Contract ref pinning

- New file `.contract-ref` at the back repo root: one line, the full 40-character SHA of the
  `budget-tracker-specs` commit whose `openapi.yaml` the back implements.
- In the `contract-drift` job, a step reads it into an output
  (`echo "ref=$(tr -d '[:space:]' < .contract-ref)" >> "$GITHUB_OUTPUT"`) and the specs checkout uses
  `ref: ${{ steps.contract-ref.outputs.ref }}`. The step also fails if the value is not 40 hex
  characters, so an empty or malformed file cannot fall back to the default branch.
- The checkout of the specs repo must be able to fetch an arbitrary SHA; `actions/checkout@v4`
  supports `ref` with a full SHA on a public repository.
- Bump procedure: when a back change implements a new contract version, the commit that implements
  it also updates `.contract-ref` to the merged specs commit (`git -C ../budget-tracker-specs
  rev-parse main`). This is documented in `docs/COLABORACION.md` section 4 and in the back README.
  Tradeoff: one extra line per contract change, in exchange for reproducible CI and no breakage when
  specs `main` moves ahead of the back. The initial value is the specs `main` HEAD at implementation
  time, which already contains the auth endpoints, so the drift check passes.

### Local drift run

The back README states that `oasdiff` must be installed and on `PATH` (or `OASDIFF` set), and shows
how to compare against the pinned ref (`git -C ../budget-tracker-specs show "$(cat .contract-ref):openapi.yaml"`
into a temp file, or a checkout at that ref).

## Risks / Trade-offs

- A forgotten `.contract-ref` bump makes the back CI compare against an older contract: acceptable,
  because it is the intended reproducibility behavior and the pin is a visible one-line diff.
- The committed checksum can go stale relative to the version: mitigated by bumping both in one
  commit and by CI failing loudly on mismatch.
- Existing tokens signed with HS256 keep working; nothing signed by this API is invalidated.
