# Proposal

## Why

Every feature screen reuses the same design tokens and base components (UX spec §7, §8).
Building them once in `packages/ui`, each with a Widgetbook story, keeps screens visually
consistent and stops feature owners from hand-rolling one-off widgets.

## What Changes

- Add design tokens to `packages/ui` from UX spec §7: color, Urbanist typography, radii,
  elevation.
- Add base components from UX spec §8, each with a Widgetbook story: `StatusBar`, `NavCluster`,
  `IconButton` (7 variants), `Button` (Primary/Secondary), `Chip`, `AmountCapsule`, `SaveBar`
  (incl. Disabled + swipe-to-confirm), `Toggle`, `TextField`, `FieldRow`, `Key` (calculator
  keypad), `Avatar`, `Toast` (5 variants).
- Domain-specific rows/lists (`EnvelopeRow`, `TxRow`, `AccountRow`, `PayeeRow`, `MemberRow`,
  `PlanRow`) are documented here but implemented by the feature change that first needs them.

## Capabilities

### New Capabilities

- `ui-design-system`: design tokens (color, Urbanist typography, shape), the base component
  library with its variants and states (including SaveBar swipe-to-confirm and Toast behavior),
  and the shared money formatter. Each feature's spec still covers the behavior of the screens
  that use these components.

### Modified Capabilities

None.

## Impact

- Repos touched: `budget-tracker-front` (`packages/ui`).
- Verification: manual, Widgetbook vs. `design/screens/NN-*.png`.
- Unblocks `add-auth` and every screen-building feature change.

## Metadata

- Owner: nathaliascode
- Repos touched: budget-tracker-front
- FRs covered: none (shared UI foundation for all FRs with a UI)
- Screens: none directly (supports all 52 screens in UX spec §9.1)
- Depends on: scaffold-frontend
- Size: M
- Linear: [RRG-43](https://linear.app/rgonaut/issue/RRG-43)
