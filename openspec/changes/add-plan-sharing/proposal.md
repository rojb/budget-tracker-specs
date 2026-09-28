# Proposal

## Why

A plan can have up to 5 members (PRD §7 scalability). This change lets a plan owner invite others
via a code/link instead of manual membership setup, which `add-plans-and-accounts` already
supports at the data level.

## What Changes

- Backend: generate/regenerate/revoke invitation code (single use, 24h expiry) on `PlanMember`;
  resolve the `sobres.app/unirse/<code>` link.
- Frontend: role chips (Editor/Lector), plan preview; screens 21 Invitar miembro, 30 Unirse a un
  plan, 45 Unirse desde enlace.
- `openapi.yaml`: invitation endpoints.

## Capabilities

### New Capabilities

- `plan-sharing`: invitation code generation/revocation/expiry, join-by-code, join-by-link, role
  assignment (Editor/Lector).

### Modified Capabilities

None.

## Impact

- Repos touched: `budget-tracker-back`, `budget-tracker-front`, `budget-tracker-specs`.
- Depends on `add-plans-and-accounts`.
- Complementary scope (not in the professor's guidelines; team decision, per `ALCANCE.md`).
- Verification: manual — Swagger UI/Prism for the API, Widgetbook vs. `design/screens/21-*.png`,
  `30-*.png`, `45-*.png`.

## Metadata

- Owner: nathaliascode
- Repos touched: budget-tracker-back, budget-tracker-front, budget-tracker-specs
- FRs covered: FR-27
- Screens: 21, 30, 45
- Depends on: add-plans-and-accounts
- Size: M
- Linear: [RRG-53](https://linear.app/rgonaut/issue/RRG-53)
