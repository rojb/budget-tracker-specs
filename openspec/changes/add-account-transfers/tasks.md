# Tasks

## 1. [specs]

- [ ] 1.1 Update `openapi.yaml`: schemas `Transfer`, `TransferPage`, `CreateTransferRequest`; parameter `TransferId`; operations `listTransfers`, `createTransfer`, `deleteTransfer` under tag `Accounts`, path parameters per operation. Verify `npx @redocly/cli lint openapi.yaml` reports no errors. Contract PR needs approval from both developers (docs/COLABORACION.md §4).

## 2. [back]

- [ ] 2.1 Add the `account_transfers` migration (positive amount and different accounts CHECKs) and entity. Verify migration run/revert/run.
- [ ] 2.2 Add `TransfersService`/`TransfersController` (create with 400/404/409 rules, paginated list with `accountId`, delete) and fold transfers into `AccountsService.balances`, `monthlyFlows` and `ledgerBalanceMovements`. Verify with curl: 20.000 from Banco Nación to Mercado Pago changes both balances and not the total, same account 400, 0/negative/10.5 400, archived 409, foreign account 404, viewer 403, account detail entered/left include it, delete restores balances, list filtered by account.
- [ ] 2.3 Update the back README (Spanish) and bump `.contract-ref`. Verify lint, build and drift clean.

## 3. [front]

- [ ] 3.1 `packages/ui`: add `UiTxRow` (Expense/Income), `UiCalendarMonth`, `UiStepper` and the icons `arrowDown`, `clock`, `chevronUp`, with stories. Verify `flutter analyze` in `packages/ui` and `widgetbook/` (other dev reviews).
- [ ] 3.2 Regenerate `packages/api_client` (own commit). Verify `flutter analyze` in `packages/api_client`.
- [ ] 3.3 Add the 38 date/time sheet and date labels in `features/common`, the transfers repository and screen 29 (origin/destination with 37, amount, date, note, SaveBar, single-account state). Verify `flutter analyze` and compare with `design/screens/29-transferencia.png` and `38-fecha-y-hora.png`.
- [ ] 3.4 Show transfers in 14 grouped by day with `UiTxRow`, delete with confirmation; update the front README. Verify `flutter analyze`, `flutter build apk --debug` and compare with `design/screens/14-detalle-de-cuenta.png`.

## 4. Verification

- [ ] 4.1 Manual verification checklist. Swagger UI/Prism vs. `openapi.yaml` for the three transfer operations and their errors; drift clean; lint clean; `openspec validate add-account-transfers --strict` passes. Back lint/build/migration. Front analyze in app, `packages/ui`, `widgetbook/`, `packages/api_client`; apk debug. App against the real back: 14 → 29 → change destination with 37 → amount → 38 date → Transferir → 14 shows new balance and the row → 13 total unchanged → delete the transfer. No test files anywhere.
