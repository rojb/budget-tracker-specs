# Tasks

## 1. [specs]

- [ ] 1.1 Update `openapi.yaml`: `CurrencyCode` enum gains `BOB`; `Currency.symbol` enum gains `Bs.`; `Currency.name` enum gains `bolivianos`; the descriptions say four options and describe BOB (symbol `Bs.`, name `bolivianos`, 2 minor units); the example plan stays valid. Verify `npx @redocly/cli lint openapi.yaml` reports no errors. Contract PR needs approval from both developers (docs/COLABORACION.md §4).
- [ ] 1.2 Update `PRD.md`: FR-40 lists BOB "Bs." among the currencies, §9 minor units per currency (BOB 2), and add a version-history row. Verify the text reads consistently with `openspec/specs/api-conventions`.
- [ ] 1.3 Update `PRD-ux-spec.md`: §7 "Moneda" (BOB shows 2 decimals, `Bs. 1.250,50`, `−Bs. 12,50`), the `AmountCapsule` row (multi-character symbols include `Bs.`), the `PlanRow` example ("bolivianos (Bs.)"), and the descriptions of screens 20 (selector of 4 options) and 33.

## 2. [back]

- [ ] 2.1 Bump `.contract-ref` to the commit of task 1.1.
- [ ] 2.2 Add BOB to `src/plans/currency.ts` (`CURRENCY_CODES`, `Currency` literal types and the `CURRENCIES` table: `Bs.`, `bolivianos`, 2). Verify `npm run lint` and `npm run build`.
- [ ] 2.3 Add the migration `AddBobCurrency` that drops and recreates `CHK_plans_currency_code` with `ARS, USD, EUR, BOB`; its `down` refuses with a clear error while a BOB plan exists, otherwise restores the three-value constraint. Verify with Docker: `npm run migration:run`, `migration:revert` and `migration:run` again; `POST /plans` with `BOB` answers `201` with symbol `Bs.`, name `bolivianos`, minor units 2; `XYZ` answers `400`; the database rejects an invalid code inserted directly; `node scripts/contract-drift.mjs` exits 0.

## 3. [front]

- [ ] 3.1 Regenerate `packages/api_client` from `openapi.yaml` (own commit, generated code only). Verify `flutter analyze` in `packages/api_client`.
- [ ] 3.2 `packages/ui` money: add `Currency.bob` (`BOB`, `Bs.`, 2) to `format/money.dart`; update the doc comment examples. Verify `flutter analyze` and a scratch script printing `Bs. 1.250,50`, `−Bs. 12,50` and `Bs. 0,00`.
- [ ] 3.3 `UiCurrencySelector`: fourth option "Bolivianos (BOB)" in the same row layout as the render of screen 20; add BOB to the Widgetbook stories (selector and money foundations). Verify `flutter analyze` in `packages/ui` and `widgetbook/`, and compare with `design/screens/20-nuevo-plan.png`. Flag for the other developer's review (docs/COLABORACION.md §5).
- [ ] 3.4 App: map `CurrencyCode.BOB` in `plans_repository.dart`, add "bolivianos (Bs.)" to the labels of `plans_page.dart` and `join_link_page.dart`, and update the quick-amount comment of `goal_fields.dart`; `common/edit_sheets.dart` needs no change (it strips the symbol at the first space). Verify `flutter analyze` in the app.

## 4. Verification

- [ ] 4.1 Manual verification checklist. `openspec validate add-bob-currency --strict`; redocly lint and drift clean (against `openapi.yaml` and against the pinned `.contract-ref`); back lint/build; migration up, down and up again; front analyze in the app, `packages/ui`, `widgetbook/` and `packages/api_client`; `flutter build apk --debug`. Swagger/curl against `openapi.yaml`: create a plan in BOB (`201`) and with `XYZ` (`400`). On the device against the real back, compared with `design/screens/20-nuevo-plan.png` (four options, no clipping) and `33-plan-en-dolares.png` for the capsule: create a plan in bolivianos, add an account with an opening balance and an expense, check `Bs. …` on 01, 02 and 07 (capsule badge fits) and "bolivianos (Bs.)" in 16. No test files anywhere.
