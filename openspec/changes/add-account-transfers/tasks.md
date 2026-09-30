# Tasks

## 1. [specs]

- [x] 1.1 Update `openapi.yaml`: schemas `Transfer`, `TransferPage`, `CreateTransferRequest`; parameter `TransferId`; operations `listTransfers`, `createTransfer`, `deleteTransfer` under tag `Accounts`, path parameters per operation. Verify `npx @redocly/cli lint openapi.yaml` reports no errors. Contract PR needs approval from both developers (docs/COLABORACION.md §4). (specs a2bdfbd; lint 0 errors; two-dev PR approval pending, at merge)

## 2. [back]

- [x] 2.1 Add the `account_transfers` migration (positive amount and different accounts CHECKs) and entity. Verify migration run/revert/run. (back f7fd565)
- [x] 2.2 Add `TransfersService`/`TransfersController` (create with 400/404/409 rules, paginated list with `accountId`, delete) and fold transfers into `AccountsService.balances`, `monthlyFlows` and `ledgerBalanceMovements`. Verify with curl: 20.000 from Banco Nación to Mercado Pago changes both balances and not the total, same account 400, 0/negative/10.5 400, archived 409, foreign account 404, viewer 403, account detail entered/left include it, delete restores balances, list filtered by account. (back 0478358; all curl cases verified; the plan total stays at 370.000 and `ledgerBalanceMovements` sums to the same total with a transfer between active accounts)
- [x] 2.3 Update the back README (Spanish) and bump `.contract-ref`. Verify lint, build and drift clean. (back c414f0e; `.contract-ref` → a2bdfbd; drift exit 0)

## 3. [front]

- [x] 3.1 `packages/ui`: add `UiTxRow` (Expense/Income), `UiCalendarMonth`, `UiStepper` and the icons `arrowDown`, `clock`, `chevronUp`, with stories. Verify `flutter analyze` in `packages/ui` and `widgetbook/` (other dev reviews). (front a753fa0)
- [x] 3.2 Regenerate `packages/api_client` (own commit). Verify `flutter analyze` in `packages/api_client`. (front 686475b)
- [x] 3.3 Add the 38 date/time sheet and date labels in `features/common`, the transfers repository and screen 29 (origin/destination with 37, amount, date, note, SaveBar, single-account state). Verify `flutter analyze` and compare with `design/screens/29-transferencia.png` and `38-fecha-y-hora.png`. (front b8724dd, toast offset 3e178e2; 29 and 38 match the renders; amount 0 shows the error; 37 excludes the origin account)
- [x] 3.4 Show transfers in 14 grouped by day with `UiTxRow`, delete with confirmation; update the front README. Verify `flutter analyze`, `flutter build apk --debug` and compare with `design/screens/14-detalle-de-cuenta.png`. (front 54af7f0; `confirmSheet` moved to `features/common`; 14 shows "Ayer · martes 29 / Transferencia a Efectivo / −$ 20.000" and deleting restores $ 300.000)

## 4. Verification

- [x] 4.1 Manual verification checklist. Swagger UI/Prism vs. `openapi.yaml` for the three transfer operations and their errors; drift clean; lint clean; `openspec validate add-account-transfers --strict` passes. Back lint/build/migration. Front analyze in app, `packages/ui`, `widgetbook/`, `packages/api_client`; apk debug. App against the real back: 14 → 29 → change destination with 37 → amount → 38 date → Transferir → 14 shows new balance and the row → 13 total unchanged → delete the transfer. No test files anywhere. (Verified 2026-09-30: curl matrix, drift clean, lint/build, analyze x4, apk debug; local web build: 14 → 29 → 38 (yesterday) → 37 (Efectivo) → Transferir → 14 shows $ 280.000, "Salió $ 20.000" and the row → delete → back to $ 300.000. No test files. Pending: TxRow/CalendarMonth/Stepper review by Ruben, on-device check)
