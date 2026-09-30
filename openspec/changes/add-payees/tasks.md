# Tasks

## 1. [specs]

- [ ] 1.1 Update `openapi.yaml`: tag `Payees`; schemas `Payee`, `PayeePage`, `CreatePayeeRequest`, `UpdatePayeeRequest`; parameter `PayeeId`; operations `listPayees` (q, page, pageSize), `createPayee`, `getPayee`, `updatePayee`, `deletePayee` with path parameters per operation. Verify `npx @redocly/cli lint openapi.yaml` reports no errors. Contract PR needs approval from both developers (docs/COLABORACION.md §4).

## 2. [back]

- [ ] 2.1 Add the `payees` migration (FK to plans on delete cascade, partial unique index on `(plan_id, lower(name))` for active payees) and the `Payee` entity. Verify `npm run migration:run`, `migration:revert` and `migration:run` succeed and `\d payees` shows the partial index.
- [ ] 2.2 Add the `payees` module: `PayeesService` (list with search and pagination, create with 409 on duplicate, get including deleted, update, soft delete, `transactionCounts`, `findOrCreate`) and `PayeesController` with role checks through `PlanAccessService`; DTOs with Swagger decorators matching the contract. Verify with curl: create 201/400/409 (case-insensitive), list order and `q`, pagination limits (pageSize 500 → 400), get of a deleted payee returns `deleted: true`, rename 200, delete 204 then 404, same name can be created again after delete, viewer 403, non-member 404.
- [ ] 2.3 Update the back README (Spanish) with the payees endpoints, soft delete, `findOrCreate` and the `transactionCounts` hook; bump `.contract-ref`. Verify `npm run lint`, `npm run build`, and `npm run openapi:export` plus the drift script report no drift.

## 3. [front]

- [ ] 3.1 `packages/ui`: add `UiPayeeRow` and the icons `userPlus`, `lightbulb`, `history`, `trash`, with Widgetbook stories. Verify `flutter analyze` in `packages/ui` and `widgetbook/` (other dev reviews).
- [ ] 3.2 Regenerate `packages/api_client` from the updated `openapi.yaml` (generated code, own commit). Verify `flutter analyze` in `packages/api_client`.
- [ ] 3.3 Add `features/payees` repository and controller and screen 15 Beneficiarios (list card, search in place, "+", tip note, empty state) reachable from 39. Verify `flutter analyze` and compare with `design/screens/15-beneficiarios.png`.
- [ ] 3.4 Screen 41 (new/edit form, disabled "Sobre" row, movements row, `SaveBar`, trash icon) and 47 (confirmation sheet, delete, toast), 409 on the name field; update the front README. Verify `flutter analyze`, `flutter build apk --debug` and compare with `design/screens/41-beneficiario.png` and `47-eliminar-beneficiario.png`.

## 4. Verification

- [ ] 4.1 Manual verification checklist. Swagger UI/Prism vs. `openapi.yaml` for the five payee operations (200/201/204, 400, 401, 403, 404, 409), drift clean, `npx @redocly/cli lint openapi.yaml` clean, `openspec validate add-payees --strict` passes. Back: lint, build, migration. Front: `flutter analyze` in app, `packages/ui`, `widgetbook/`, `packages/api_client`; `flutter build apk --debug`. Widgetbook `PayeeRow` vs. the 15 render. App against the real back: 39 → 15 (empty state) → "+" → 41 create → 15 lists it → search → edit and rename → 47 delete → 15 without it and toast; duplicate name shows the field error. No test files anywhere.
