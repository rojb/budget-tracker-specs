# Tasks

## 1. [specs]

- [ ] 1.1 Update `openapi.yaml`: add the schema `EnvelopeMove` (`id`, `direction` `in`|`out`, `counterpartId` nullable, `counterpartName`, `amountMinor`, `month`, `createdAt`), add `moves` and `movesTotal` to `EnvelopeDetail` (both required), and say in `getEnvelopeDetail` and `moveMoney` that moves are listed and recorded. Verify `npx @redocly/cli lint openapi.yaml` reports no errors. Contract PR needs approval from both developers (docs/COLABORACION.md §4).

## 2. [back]

- [ ] 2.1 Migration `AddEnvelopeMoves` (up and down) and entity `EnvelopeMove` for the table `envelope_moves`, registered in the entity list. Verify lint, build and migration run, revert, run.
- [ ] 2.2 Record each successful move: `EnvelopeMovesService.record` inside the `lockingSource` work of `moveMoney`, with the same `EntityManager` as `shiftAssignments`. Verify a move writes one row, a move over the available (`409`) writes none, and concurrent moves leave as many rows as successes.
- [ ] 2.3 Return `moves` and `movesTotal` in `getEnvelopeDetail` (`EnvelopeMoveDto`, month filter, newest first, at most 100, counterpart live name or stored name), keep `spentMinor` and every figure unchanged, and on `remove` of an envelope delete the moves whose two envelopes are gone. Bump `.contract-ref` to the contract task. Verify lint, build, drift clean (oasdiff, exit 0) and, with curl as a member, both details show the move with the right sign and order among transactions, figures equal to before, the transactions list and account detail unchanged.

## 3. [front]

- [ ] 3.1 Regenerate `api_client` from `openapi.yaml` (own commit). Verify `flutter analyze` in `api_client`.
- [ ] 3.2 Screen 22: carry `moves` in `EnvelopeDetailData`, merge them with the transactions by `createdAt`, and draw each move as a non-tappable `UiTxRow` ("Movido a ..." with `−`, "Movido desde ..." with `+` in the lavender capsule, arrows icon, time subtitle), with "Sin movimientos este mes" only when both lists are empty. Verify `flutter analyze` in the app, `packages/ui` and `widgetbook/`, `flutter build apk --debug`, and on the device a move from 22 through 24 shows in the 22 of both envelopes, side by side with `design/screens/22-detalle-de-sobre.png`, and not in 10.

## 4. Verification

- [ ] 4.1 Manual verification checklist. `openspec validate add-envelope-move-history --strict`; redocly lint and oasdiff drift clean; back lint/build and migration up, down, up; Swagger/curl against `openapi.yaml` for `getEnvelopeDetail` (moves, `movesTotal`, `spentMinor` without moves) and `moveMoney` (row written, `409` writes none, concurrency); front analyze in the app, `packages/ui`, `widgetbook/` and `api_client`; on the device against the real back, 22 of the source and of the destination side by side with `design/screens/22-detalle-de-sobre.png`, 24 as the flow that creates the move, and 10 without the move. No test files anywhere.
