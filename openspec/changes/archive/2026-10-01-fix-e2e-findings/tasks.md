# Tasks

## 1. [specs]

- [x] 1.1 Update `openapi.yaml` descriptions of `listTransactions`, `listTransfers` and the `activity` of `getEnvelopeDetail`: newest first by `createdAt` (ties by id). No schema change. Verify `npx @redocly/cli lint openapi.yaml` reports no errors. Contract PR needs approval from both developers (docs/COLABORACION.md §4). (specs 2fa57f1; redocly lint valid, no errors; two-dev PR approval pending, at merge)

## 2. [back]

- [x] 2.1 D8: order the transactions list (and with it the envelope activity) and the transfers list by `createdAt DESC`, then `id DESC`; leave filters, summary, months and balances on `occurredAt`; bump `.contract-ref`; update the ordering descriptions in the controllers. Verify lint, build, drift clean and, with curl, a transaction dated three days ago recorded last is listed first with the same month figures. (back a8f79fc; lint and build clean, drift check exit 0, curl: a transaction dated three days ago recorded last is listed first)

## 3. [front]

- [x] 3.1 D1 (screen 16): add the silent `PlansController.refresh()` and make `PlansPage` reload on open, on resume and every 10 s while open. Verify `flutter analyze` and, on the device with 16 open, that a member who joins through the API appears without restarting. (front 3c6a9dd; on the device a member who joined through the API appeared in 16 within seconds, "Compartido · 2 miembros")
- [x] 3.2 D3 (screen 09): income opens with "¿A dónde va?" visible and the keypad hidden (amount tap or calculator button opens it); expense 07 keeps its keypad. Verify `flutter analyze`, compare with `design/screens/09-registrar-ingreso.png` and `07-nuevo-movimiento.png`, and record an income directly to an envelope: its Available rises and Ready to Assign does not. (front ddd7f36; 09 shows the cards with the keypad hidden, matching the render; 07 keeps the keypad and 12 + 3 = 15; income of 5.000 to Farmacia: Available 0 → 5.000, Ready to Assign stays 586.234)
- [x] 3.3 D4 (screen 02): add the "Nuevo grupo" / "Editar grupos" row after the last group (→ 32). Verify `flutter analyze` and compare with `design/screens/02-plan-del-mes.png`. (front 267e330; the row shows after the last group on the device)
- [x] 3.4 D2 (screen 06): add the search button and its field to the empty plan. Verify `flutter analyze` and compare with `design/screens/06-plan-vacio.png`. (front c3c0212; lupa opens the field and "Ningún sobre coincide con "alq"." shows)
- [x] 3.5 D5 (screen 51): add "Ver movimientos" under each archived account (→ 10 filtered by the account). Verify `flutter analyze` and compare with `design/screens/51-cuentas-archivadas.png`. (front 53d8faa; the link opens 10 with the Brubank chip)
- [x] 3.6 D6 (`packages/ui`, screens 27 and 14): `UiTxRow` title and subtitle wrap to two lines with a minimum height of 72. Verify `flutter analyze` in `packages/ui` and `widgetbook/`, and compare with `design/screens/27-eliminar-movimiento.png` and `14-detalle-de-cuenta.png`. (front 0201237; 27 shows the full date, 14 wraps "Transferencia a Banco Nación")
- [x] 3.7 D8 (screens 10, 14, 22): carry `createdAt` in `TransactionData` and `TransferData`, group and sort by registration day, and show the movement's own date in the subtitle when it differs. Verify `flutter analyze`, and on the device a backdated expense recorded last shows first under "Hoy" with its date; 10 keeps newest first. (front 22efc6c; on the device a backdated expense registered last is first under "Hoy · jueves 1" with "lun 28, 17:48")

## 4. Verification

- [x] 4.1 Manual verification checklist. `openspec validate fix-e2e-findings --strict`; redocly lint and drift clean; back lint/build; front analyze in the app, `packages/ui` and `widgetbook/`; `flutter build apk --debug`. On the device against the real back, side by side with the renders: 16 (a new member joins while open), 09 (cards visible, income directly to an envelope raises its Available and not Ready to Assign), 07 (calculator still works), 02 (group row), 06 (search), 51 (Ver movimientos), 27 and 14 (no truncation), 10 (backdated expense first under "Hoy" with its date). No test files anywhere. (Verified 2026-10-01: openspec validate --strict, redocly lint, drift exit 0, back lint/build, analyze in app, packages/ui and widgetbook, apk debug; on the device against the real back every screen above; evidence fix-D1..D8 side by side. No test files. Pending: other developer review of the UiTxRow change)
