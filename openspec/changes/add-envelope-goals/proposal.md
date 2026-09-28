# Proposal

## Why

Envelope goals are the highest-value differentiator beyond plain budgeting: a target amount
(monthly or amount+date), derived funded/underfunded/overspent states, moving money between
envelopes, and an optional goal photo.

## What Changes

- Backend: extend `Envelope` with a goal (monthly amount, or amount+date) and derived states
  (`Funded`/`Underfunded`/`Overspent`); endpoint to move money between envelopes in the same
  month; goal photo upload endpoint (multipart, ≤ 5 MB, JPEG/PNG/WebP, server-side resize, returns
  URL).
- Frontend: `GoalCard` (lavender tint + icon when no photo), progress indicator (chartreuse
  stripes/dots); screens 22 Detalle de sobre, 23 Editar sobre (goal fields), 05 Detalle de meta,
  40 Opciones de meta, 50 Foto de la meta, 24 Mover dinero, 01 Inicio (goal carousel).
- `openapi.yaml`: goal fields on the envelope endpoints, money-move endpoint, photo upload
  endpoint.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `envelopes`: adds goal fields, derived funded/underfunded/overspent states, inter-envelope
  money movement, and goal photo upload. Requires the `envelopes` capability spec from
  `add-envelopes` to exist first.

## Impact

- Repos touched: `budget-tracker-back`, `budget-tracker-front`, `budget-tracker-specs`.
- Depends on `add-envelopes`, `add-transactions` (needs real `Spent`).
- `GoalCard` is a new `packages/ui` component — small PR reviewed by the other dev even though
  the feature has a single owner (see `docs/ROADMAP.md` §5).
- Verification: manual — Swagger UI/Prism for the API, Widgetbook vs. `design/screens/22-*.png`,
  `23-*.png`, `05-*.png`, `40-*.png`, `50-*.png`, `24-*.png`, `01-*.png`.

## Metadata

- Owner: Ruben
- Repos touched: budget-tracker-back, budget-tracker-front, budget-tracker-specs
- FRs covered: FR-19, FR-20, FR-24, FR-25, FR-41
- Screens: 22, 23, 05, 40, 50, 24, 01
- Depends on: add-envelopes, add-transactions
- Size: L
- Linear: TBD
