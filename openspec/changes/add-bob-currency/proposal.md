# Proposal

## Why

FR-40 lets a plan pick its currency from an extensible list, and today the list has three entries:
ARS, USD and EUR. The team and its first users are in Bolivia as well as Argentina, so a plan kept
in bolivianos (BOB) is needed. Because the currency is a property of the plan, immutable, and every
amount is an integer in the minor units of that currency, adding one is a small and well-bounded
change that has to touch the contract, the database, the selector in screen 20 and the money
formatting that every screen shares.

## What Changes

- Contract: `CurrencyCode` gains `BOB`; `Currency` accepts symbol `Bs.`, name `bolivianos` and
  minor units 2 for it.
- Backend: the supported-currency table gains BOB (`Bs.`, `bolivianos`, 2 minor units) and a new
  migration replaces the `CHK_plans_currency_code` check constraint so the database also accepts
  `BOB`. The migration has a working `down`.
- Frontend: the currency selector of screen 20 offers four options; the money function formats BOB
  as `Bs. 1.250,50` and `−Bs. 12,50`; the `AmountCapsule` badge uses the small font for the
  multi-character symbol `Bs.`; the generated API client is regenerated.
- Documentation: PRD FR-40 and §9, and PRD-ux-spec §7 "Moneda" and the descriptions of screens 20
  and 33, list BOB.
- No new endpoint, no new `packages/ui` component, no test files.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `api-conventions`: the plan currency is one of four options, including BOB.
- `plans`: a plan can be created with `currencyCode` `BOB`.
- `ui-design-system`: money formatting supports BOB with the symbol `Bs.`.

## Impact

- Repos touched: `budget-tracker-specs`, `budget-tracker-back`, `budget-tracker-front`.
- Existing plans and amounts are untouched: the change only widens the set of accepted currencies.
- Verification: manual, against the real back (create a plan in BOB, migration up and down) and on
  the device against `design/screens/20-*.png`, with the amounts of 01, 02 and 07 and the plan list
  of 16 showing `Bs.`.

## Metadata

- Owner: Ruben
- Repos touched: budget-tracker-specs, budget-tracker-back, budget-tracker-front
- FRs covered: FR-40
- Screens: 20, 33 and every screen that shows an amount: 01, 02, 03, 04, 05, 07, 08, 09, 10, 12, 13, 14, 17, 22, 23, 24, 25, 27, 29; 16 shows the currency name and symbol
- Depends on: api-contract-base, add-plans-and-accounts
- Size: S
- Linear: [RRG-58](https://linear.app/rgonaut/issue/RRG-58)
