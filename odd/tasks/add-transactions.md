# add-transactions (RRG-49)

## Objective
FR-06, FR-07, FR-08, FR-14, FR-18: record expenses and income (with split across envelopes, income
to Ready to Assign or to an envelope, calculator on the amount) and list movements. Screens 07 Nuevo
movimiento, 36 Elegir sobre, 38 Fecha y hora, 26 Elegir beneficiario, 08 Dividir pago, 09 Registrar
ingreso, 10 Movimientos.

## Why
Money flow is what makes envelopes meaningful. Unblocks RRG-50 editing/filters, RRG-51 monthly
assignment (real spending), RRG-52 goals, RRG-54 reports.

## Constraints / integration points (nathaliascode's merged work)
- `budget-calc-engine`: envelope activity and Ready to Assign must now include transactions
  (expenses per split envelope; income to RTA or to an envelope). Integrate through the engine's
  existing input/interface — additive, no semantic change to her requirements unless a MODIFIED delta
  is justified in specs.
- `accounts`: derived account balance must include transactions (spec "Derived account balance");
  account detail (14) lists transactions alongside transfers.
- `account_transfers` stays a separate entity (RRG-55); transactions never touch it. Movements list
  (10) shows transactions (and transfers if the UX spec says so — check §9 screen 10).
- Reuse screen 38 date/time sheet, account picker (37), payee picker/autocomplete (26, FR-23 client
  side) and payee `suggestedEnvelopeId`; envelope picker (36) grouped with divider labels.
- Budget month attribution by plan time zone (calc engine requirement) applies to transaction dates.
- Split validation: parts sum exactly equal the total (integer minor units); screen 08 uses SaveBar
  Disabled "Faltan $ X" while it doesn't.
- Contract first; bump back `.contract-ref`; regenerate api_client.
- Repo layout nested: back/front inside 2do; contract from back `../openapi.yaml`.
- Local Android builds on this machine need temporary `kotlin.incremental=false` (revert after).
- No test files. UI from packages/ui (TxRow new; AmountCapsule, Key, Toggle, SaveBar exist).

## Tasks
- [x] T1 Specs repo: specs → design → tasks, one commit per phase (delegated writer)
- [x] T2 Contract + back + client + front per tasks, one commit per task
- [x] T3 Verify (lint/build/analyze, drift, live API incl. calc/balance effects + authz, device flows)
- [ ] T4 Review gate; merge (specs first); archive; Linear Done; handoff note to nathaliascode

## Progress
- RRG-49 In Progress. Dependencies RRG-45/47/48 merged.
- Specs 86e2418 specs, 3d9c47e design, 749f429 tasks, 778d165 openapi, d2bf677 complete, 9c948a7 reopen (screen 10 cards), 8f736f3 re-verified. Back 4cbc7f9..ae47adc (.contract-ref 778d165). Front 8e3fbb9..dbed0a9 + fixes 8f26eb2 6c62347 fa6b465 76f1b10.
- Evidence: curl matrix (expense/split/income RTA+envelope/TZ month/pagination/403/404), drift 0 both refs, Swagger docs-json matches, analyze/apk, device 07/08/09/10/14/26/36/38 vs design (parent reviewed cmp-07/08/10/10b). MODIFIED deltas: accounts, budget-calc-engine, envelopes. Cross-owner files: accounts.service/module, payees.service/module, account_detail_page, UiPayeeRow selectable, calendar_month chevron 48dp.
- Parent found screen 10 grouped-card deviation -> fixed in-change (day_groups.dart, also 14).
- Back review declined (medium). Pending: 14 envelope name under amount differs from design (minor); 10 search/filters/summary -> RRG-50.
