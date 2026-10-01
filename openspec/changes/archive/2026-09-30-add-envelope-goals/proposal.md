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
- `openapi.yaml`: goal, photo and state fields on the envelope schemas; set and clear goal, envelope
  detail, move money, upload, serve and delete photo, suggested photos list, image and apply.

## Capabilities

### New Capabilities

- `envelope-goals`: the envelope goal (monthly, or amount by a date), the required amount for a
  month, the derived funded/underfunded/overspent states (one server-side definition that the plan
  filters of RRG-51 reuse), the envelope detail, money movement between envelopes inside a month,
  the goal photo (upload, replace, remove, suggested set, authenticated serving) and the screens
  22, 23, 05, 40, 50, 24 and the goals carousel of 01.

### Modified Capabilities

- `envelopes`: the envelope carries its goal, state and photo; row tap opens 22; 31 gains the
  objective block; the entry to 43 becomes the trash of 23 (the temporary long press is removed).
- `ui-design-system`: adds `GoalCard`, the goal progress presentations and the building blocks of
  05 and 50, with their Widgetbook use cases.

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
- Linear: [RRG-52](https://linear.app/rgonaut/issue/RRG-52)
