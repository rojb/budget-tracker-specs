# Proposal

## Why

Envelopes and groups are the core budgeting unit of the app (base-zero, envelope method). This
change delivers the entities, CRUD, reordering, and starter template that every later
budget-viewing and money-moving screen depends on.

## What Changes

- Backend: `EnvelopeGroup`, `Envelope` entities. CRUD + reordering endpoints + starter template
  (4 groups/12 envelopes) + initial bulk assignment.
- Frontend: `EnvelopeRow`, `GroupRow`, header `IconButton/plus`; screens 02 Plan del mes (envelope
  and group management), 31 Nuevo sobre, 32 Grupos, 52 Elegir grupo, 44 Eliminar grupo, 43
  Eliminar sobre, 35 Plantilla sugerida, 46 Asigná tu dinero.
- `openapi.yaml`: envelope/group endpoints.

## Capabilities

### New Capabilities

- `envelopes`: envelope and group CRUD, reordering, starter template, initial bulk assignment.

### Modified Capabilities

None.

## Impact

- Repos touched: `budget-tracker-back`, `budget-tracker-front`, `budget-tracker-specs`.
- Depends on the `Plan` entity from `add-plans-and-accounts` (different owner — coordinate the
  merge before starting, see `docs/ROADMAP.md` §5) and the `Assignment` type from
  `add-budget-calc-engine`.
- Unblocks `add-transactions`, `add-monthly-assignment`, `add-envelope-goals`, `add-reports`.
- Verification: manual — Swagger UI/Prism for the API, Widgetbook vs. `design/screens/02-*.png`,
  `31-*.png`, `32-*.png`, `52-*.png`, `44-*.png`, `43-*.png`, `35-*.png`, `46-*.png`.

## Metadata

- Owner: Ruben
- Repos touched: budget-tracker-back, budget-tracker-front, budget-tracker-specs
- FRs covered: FR-04
- Screens: 02, 31, 32, 52, 44, 43, 35, 46
- Depends on: add-plans-and-accounts, add-budget-calc-engine
- Size: L
- Linear: TBD
