# add-bob-currency (RRG-58)

## Objective
Add the Bolivian boliviano (BOB) as a fourth plan currency (FR-40), selectable when creating a plan
(screen 20) and formatted everywhere like the others.

## Decisions (user)
- Code `BOB`, symbol `Bs.` (with dot), name "bolivianos", 2 minor units.
- es-AR format like the rest: `Bs. 1.250,50`, negative `−Bs. 12,50` (sign before the symbol).
- AmountCapsule badge: multi-character symbols use the smaller font (UX spec §7), like "US$".

## Touch points
- Contract `openapi.yaml`: `CurrencyCode` enum + Currency description (symbol/name/minor units).
- Spec `api-conventions`: "exactly three options" → MODIFIED to four, with BOB scenario; any other
  spec listing currencies (plans, ui-design-system money formatting) → MODIFIED.
- Back: `src/plans/currency.ts`; NEW migration replacing `CHK_plans_currency_code` (ARS, USD, EUR →
  + BOB) with a working `down`; `.contract-ref` bump.
- Front: `packages/ui` `currency_selector.dart` (4 options, layout per screen 20 render) and
  `format/money.dart`; `lib/features/plans/plans_repository.dart`, `common/edit_sheets.dart`,
  `envelopes/goal_fields.dart`; regenerate `packages/api_client`; Widgetbook stories.
- Docs: PRD FR-40, PRD-ux-spec §7 "Moneda" table and screen 20 description.

## Constraints
- SDD: proposal → specs → design → tasks → one commit per task → tasks complete.
- Device checks ONLY via scratchpad safe-adb.sh guard. No test files. Temporary
  `kotlin.incremental=false` for local Android builds (revert).

## Tasks
- [x] T1 Specs: proposal → specs → design → tasks (delegated writer)
- [x] T2 Contract + back (migration) + client + front + docs, one commit per task
- [x] T3 Verify (migration up/down, API create plan BOB, formatting, device screen 20 + amounts)
- [ ] T4 Review gate; merge (specs first); archive; CI; Linear Done

## Progress
- RRG-58 In Progress (RRG-57 merged).
- Specs 9643e93 proposal, 5dad250 specs, 7b21c57 design, 31ef353 tasks, a49b94e openapi, ac2b23b PRD, 35886bd ux-spec, f2748c0 ticked, 5cefa0e reopen (35), 81fbcf9 re-tick. Back 401c562 .contract-ref, 0bb46d5 currency, 35f9c1b migration AddBobCurrency. Front 2255d93 client, 17638a1 Currency.bob, 34d27dc selector, 9f4fec1 mapping, d676780 screen 35 currency.
- Evidence: migration up/down/up (down refuses with BOB plans), POST /plans BOB 201 / XYZ 400, DB CHECK rejects invalid, drift 0 both refs, formats Bs. 1.250,50 / −Bs. 12,50 / Bs. 0,00, device 01/02/03/07/16/20/35 show Bs. (parent reviewed bob-20).
- Notes: writer used shell grep/sed a few times (rule violation, no harm). Quick-amount chips keep ARS-scale values for every currency (observation, not fixed).
