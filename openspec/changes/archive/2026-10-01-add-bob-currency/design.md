# Design

## Context

See proposal.md for the why. A plan's currency is a closed list that appears in five places: the
`CurrencyCode` enum of the contract, the `CURRENCIES` table of the backend, the `CHECK` constraint
of the `plans` table, the `Currency` enum of `packages/ui` (which also drives `formatMoney`), and
the selector of screen 20. Adding BOB means extending each one with the same four values; nothing
else in the data model depends on the currency except `minorUnits`, which BOB shares with USD and
EUR (2), so no amount logic changes.

Sources: FR-40; PRD-ux-spec.md §7 "Moneda" and "Montos", §8 `AmountCapsule`, §9.1 rows 16, 20, 33;
render `design/screens/20-nuevo-plan.png`. Values decided by the owner: code `BOB`, symbol `Bs.`
(with the dot), name `bolivianos`, 2 minor units.

## Goals / Non-Goals

**Goals:**
- Create, list and show a plan in BOB end to end, with `Bs. 1.250,50` and `−Bs. 12,50` everywhere.
- Keep screen 20 visually faithful to its render with four options.

**Non-Goals:**
- Conversion between currencies (FR-33) and a per-user currency preference.
- Changing the currency of an existing plan (still immutable).
- Further currencies; the change only adds the pattern's fourth entry.
- A new `packages/ui` component, a new endpoint, or test files.

## API surface

No endpoint is added; only the enum and the `Currency` schema of `openapi.yaml` change.

| Operation | Path | Change |
|---|---|---|
| `createPlan` | `POST /plans` | `CreatePlanRequest.currencyCode` accepts `BOB` (via `CurrencyCode`) |
| `listPlans`, `getPlan`, `createPlan` responses | `/plans`, `/plans/{planId}` | `Plan.currency` may be `{ BOB, "Bs.", "bolivianos", 2 }` |

Schema edits: `CurrencyCode` enum `[ARS, USD, EUR, BOB]`; `Currency.symbol` enum gains `Bs.`;
`Currency.name` enum gains `bolivianos`; the descriptions that say "ARS, USD or EUR" and "one of
exactly three options" say four and describe BOB. The back `.contract-ref` moves to the commit that
carries this edit, and the Dart `api_client` is regenerated from it.

## Decisions

### Database: replace the check constraint

`plans.currency_code` is `character(3)` with `CONSTRAINT "CHK_plans_currency_code" CHECK
("currency_code" IN ('ARS', 'USD', 'EUR'))`. A `CHECK` cannot be altered in place, so a new
migration, `AddBobCurrency` (next timestamp after the latest, `1791100000000`), runs in one
transaction:

- `up`: `ALTER TABLE "plans" DROP CONSTRAINT "CHK_plans_currency_code"` then `ADD CONSTRAINT
  "CHK_plans_currency_code" CHECK ("currency_code" IN ('ARS', 'USD', 'EUR', 'BOB'))`. Same name, so
  the constraint keeps its identity and nothing else references it.
- `down`: first count plans with `currency_code = 'BOB'`. If any exist the migration throws a clear
  error ("Cannot revert AddBobCurrency: N plan(s) use BOB; delete or migrate them first") and
  changes nothing, because re-adding the narrower constraint would fail with an opaque
  `check constraint is violated by some row` and silently deleting a user's plan is never
  acceptable. With none, it drops and re-adds the three-value constraint.

Alternative considered: change the column to a lookup table with a foreign key. Rejected: it is a
larger, riskier migration for a closed list of four, and the contract enum would still have to be
kept in step by hand.

The runtime table `CURRENCIES` and the `CURRENCY_CODES` list in `src/plans/currency.ts` get the
fourth entry and widen the literal types (`symbol`, `name`); the DTO validation (`@IsIn` over
`CURRENCY_CODES`) and the Swagger enum follow from that list with no further edit, which is what
makes `XYZ` answer `400`.

### Selector layout (screen 20): keep the vertical list

The render shows a white card with one row per currency: a 44 px symbol badge, the label
"Pesos (ARS)" and, on the chosen row, a lavender pill with a check. Rows are 68 px apart and the
card has 8 px of padding. Four options are added as a fourth row of the same shape: the card grows
by one row (about 68 px), the title, note and "Primera cuenta" section simply move down, and the
screen still fits a phone without scrolling the selector. A 2x2 grid was considered and rejected:
the render's rhythm is a single column with the label next to the badge, labels such as "Bolivianos
(BOB)" would wrap in a half-width cell, and the lavender pill with its trailing check would lose
its meaning in a grid. The row reads "Bolivianos (BOB)" with the badge text `Bs.`.

### AmountCapsule and selector badge font

PRD-ux-spec §7 says symbols of more than one character use a smaller font so they fit the 48 px
circle. `Bs.` has three characters, like `US$`, so it already takes that branch: `AmountCapsule`
uses 14 and the selector badge 15, against 20 and 17 for single-character symbols, both keyed on
`symbol.length > 1`. No new rule is needed, and the capsule badge in the screens 07/09/03 keeps
fitting. This is confirmed on the device.

### Where formatting is centralized

`packages/ui/lib/src/format/money.dart` holds the `Currency` enum and `formatMoney`. Adding
`bob(code: 'BOB', symbol: 'Bs.', minorUnits: 2)` is the whole formatting change: the integer
arithmetic, the `.`/`,` separators and the `−` before the symbol already follow `minorUnits` and
`symbol`, so `Bs. 1.250,50`, `−Bs. 12,50` and `Bs. 0,00` come out with no new branch. Every screen
formats through that function. The only other places that know the list are mappings in the app:
`plans_repository.dart` (API code to `Currency`, whose fallback is ARS and must not swallow `BOB`),
the "pesos ($)" style labels of `plans_page.dart` and `join_link_page.dart` ("bolivianos (Bs.)"),
and the two spots that decide the number of decimals for typed amounts (`goal_fields.dart`,
`move_money_page.dart`), which compare against `Currency.ars` and therefore already treat BOB like
USD and EUR. `edit_sheets.dart` is reviewed for the same assumption.

## UI components

From `packages/ui`: `UiCurrencySelector` (modified: fourth option, label map, doc comment),
`UiAmountCapsule` (unchanged, receives `Bs.`), `UiPlanRow` (unchanged, shows "bolivianos (Bs.)").
The Widgetbook story of `UiCurrencySelector` and the money foundations story get the BOB entry. No
new component; the selector change is small and is flagged for the other developer's review per
docs/COLABORACION.md §5.

## Risks / Trade-offs

- The backend `down` refuses to run while a BOB plan exists. Accepted: it protects data; the error
  message names what to do.
- A client that is not updated receives a `Plan` with `currency.code: BOB`. The Flutter client maps
  unknown codes to ARS today, which would show the wrong symbol; the mapping is fixed in this
  change, and the back and front ship together.
- The enum for `symbol` and `name` in the contract is closed, so every future currency repeats
  this pattern; extracting a lookup is left for the day a fifth currency is wanted.
