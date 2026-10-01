# Tasks

## 1. [specs]

- [ ] 1.1 Update `openapi.yaml` descriptions of `listTransactions`, `listTransfers` and the `activity` of `getEnvelopeDetail`: newest first by `createdAt` (ties by id). No schema change. Verify `npx @redocly/cli lint openapi.yaml` reports no errors. Contract PR needs approval from both developers (docs/COLABORACION.md §4).

## 2. [back]

- [ ] 2.1 D8: order the transactions list (and with it the envelope activity) and the transfers list by `createdAt DESC`, then `id DESC`; leave filters, summary, months and balances on `occurredAt`; bump `.contract-ref`; update the ordering descriptions in the controllers. Verify lint, build, drift clean and, with curl, a transaction dated three days ago recorded last is listed first with the same month figures.

## 3. [front]

- [ ] 3.1 D1 (screen 16): add the silent `PlansController.refresh()` and make `PlansPage` reload on open, on resume and every 10 s while open. Verify `flutter analyze` and, on the device with 16 open, that a member who joins through the API appears without restarting.
- [ ] 3.2 D3 (screen 09): income opens with "¿A dónde va?" visible and the keypad hidden (amount tap or calculator button opens it); expense 07 keeps its keypad. Verify `flutter analyze`, compare with `design/screens/09-registrar-ingreso.png` and `07-nuevo-movimiento.png`, and record an income directly to an envelope: its Available rises and Ready to Assign does not.
- [ ] 3.3 D4 (screen 02): add the "Nuevo grupo" / "Editar grupos" row after the last group (→ 32). Verify `flutter analyze` and compare with `design/screens/02-plan-del-mes.png`.
- [ ] 3.4 D2 (screen 06): add the search button and its field to the empty plan. Verify `flutter analyze` and compare with `design/screens/06-plan-vacio.png`.
- [ ] 3.5 D5 (screen 51): add "Ver movimientos" under each archived account (→ 10 filtered by the account). Verify `flutter analyze` and compare with `design/screens/51-cuentas-archivadas.png`.
- [ ] 3.6 D6 (`packages/ui`, screens 27 and 14): `UiTxRow` title and subtitle wrap to two lines with a minimum height of 72. Verify `flutter analyze` in `packages/ui` and `widgetbook/`, and compare with `design/screens/27-eliminar-movimiento.png` and `14-detalle-de-cuenta.png`.
- [ ] 3.7 D8 (screens 10, 14, 22): carry `createdAt` in `TransactionData` and `TransferData`, group and sort by registration day, and show the movement's own date in the subtitle when it differs. Verify `flutter analyze`, and on the device a backdated expense recorded last shows first under "Hoy" with its date; 10 keeps newest first.

## 4. Verification

- [ ] 4.1 Manual verification checklist. `openspec validate fix-e2e-findings --strict`; redocly lint and drift clean; back lint/build; front analyze in the app, `packages/ui` and `widgetbook/`; `flutter build apk --debug`. On the device against the real back, side by side with the renders: 16 (a new member joins while open), 09 (cards visible, income directly to an envelope raises its Available and not Ready to Assign), 07 (calculator still works), 02 (group row), 06 (search), 51 (Ver movimientos), 27 and 14 (no truncation), 10 (backdated expense first under "Hoy" with its date). No test files anywhere.
