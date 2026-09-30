# Design

## Context

See proposal.md for the why. `add-plans-and-accounts` left `PlansModule` with `PlanAccessService`
(404 for non-members, 403 by role), the shared `parseUuid` pipe, the app-scoped
`PlansController`, `showUiSheet`/`UiSheet`, `UiCard`, `UiFieldRow`, `UiInfoNote` and the 39 menu
whose "Beneficiarios" entry points at a placeholder route. Envelopes and transactions do not exist
yet (`add-envelopes`, `add-transactions`, both Ruben's).

Sources: FR-05, FR-23 (PRD.md), PRD-ux-spec.md §5 (Beneficiarios states), §6.1, §8 (`PayeeRow`
keeps its chevron), §9.4 (41, 47), §9.5; renders `design/screens/{15,41,47}-*.png`.

## Goals / Non-Goals

**Goals:**
- `payees` table with logical delete; CRUD endpoints with search and pagination.
- Screens 15, 41, 47 and the 39 → 15 entry.
- A `PayeesService` other modules can use to resolve or create a payee by name (FR-23 / 26).

**Non-Goals:**
- Choosing the suggested envelope (the "Sobre" row opens 36, which arrives with
  `add-envelopes`; until then it reads "Sin sobre" and is not tappable).
- Real transaction counts and "Ver movimientos" filtering (they depend on `add-transactions`; the
  count is 0 and the link opens the 10 placeholder).
- Test files of any kind.

## API surface

Added to `openapi.yaml` (first `[specs]` task), tag `Payees`, all under bearer auth:

| Operation | Path | Role | Request | Responses |
|---|---|---|---|---|
| `listPayees` | `GET /plans/{planId}/payees?q&page&pageSize` | member | — | `200 PayeePage`, `400`, `401`, `404` |
| `createPayee` | `POST /plans/{planId}/payees` | owner, editor | `CreatePayeeRequest` | `201 Payee`, `400`, `401`, `403`, `404`, `409` |
| `getPayee` | `GET /plans/{planId}/payees/{payeeId}` | member | — | `200 Payee`, `400`, `401`, `404` |
| `updatePayee` | `PATCH /plans/{planId}/payees/{payeeId}` | owner, editor | `UpdatePayeeRequest` | `200 Payee`, `400`, `401`, `403`, `404`, `409` |
| `deletePayee` | `DELETE /plans/{planId}/payees/{payeeId}` | owner, editor | — | `204`, `400`, `401`, `403`, `404` |

Schemas: `Payee { id, name, suggestedEnvelopeId? (uuid, absent when none), transactionCount,
deleted, createdAt }`; `PayeePage = PageMeta + { items: Payee[] }` (payees are an unbounded
collection, so they follow `api-conventions` pagination); `CreatePayeeRequest { name 1..60,
suggestedEnvelopeId? }`; `UpdatePayeeRequest` same fields optional, `minProperties: 1`. Path
parameters are declared per operation and optional fields are omitted rather than `null` (the
oasdiff/Redocly constraints found in `add-plans-and-accounts`).

## Backend design

```
src/payees/ payees.module.ts payees.controller.ts payees.service.ts
            entities/payee.entity.ts dto/{payee,payee-page,create-payee,update-payee,list-payees-query}.dto.ts
src/database/migrations/<ts>-CreatePayees.ts
```

- **Table.** `payees(id, plan_id fk plans on delete cascade, name varchar(60), suggested_envelope_id
  uuid null, deleted_at timestamptz null, created_at)` with a partial unique index
  `UQ_payees_plan_name_active` on `(plan_id, lower(name)) WHERE deleted_at IS NULL`. The unique
  violation (`23505`) maps to `409 "Payee name already in use"`; no pre-check (it would race).
  `suggested_envelope_id` has no FK yet: `add-envelopes` adds `FK_payees_suggested_envelope`
  (`on delete set null`) and validates that the envelope belongs to the plan.
- **Soft delete.** `DELETE` sets `deleted_at`. Transactions (added later) reference `payee_id` with
  a normal FK, so the row never disappears and old transactions keep the name.
- **Counts.** `PayeesService.transactionCounts(planId)` returns 0 for every payee; `add-transactions`
  replaces its body with a `GROUP BY payee_id` over its table (single place, commented).
- **Search.** `ILIKE '%q%'` on the name (escaped), ordered by `lower(name)`, `page`/`pageSize`
  validated as in `api-conventions` (default 1/20, max 100).
- **For other modules.** `PayeesModule` exports `PayeesService` with `findOrCreate(planId, name)`
  (returns the active payee with that name or creates it), used by `add-transactions` for 26's
  "Crear…" and for payees created on first use.
- Every route calls `PlanAccessService.require` first (READ for GET, WRITE for mutations).

## Frontend design

```
lib/features/payees/
  payees_repository.dart   # generated PayeesApi → PayeeData
  payees_controller.dart   # list + search + create/update/delete for the active plan
  payees_page.dart         # 15
  payee_form_page.dart     # 41 (new and edit), with its form controller
  delete_payee_sheet.dart  # 47
```

- Routes: `/payees` (15, pushed from 39 on the root navigator), `/payees/new` and
  `/payees/:payeeId` (41).
- `PayeesController` is created per visit to 15 (not app-scoped: no other screen needs payees until
  `add-transactions`, which can promote it). It loads with `pageSize=100`; the search field filters
  the loaded list in place (the API `q` is for the future picker 26).
- 409 on save maps to the name field error "Ya tenés un beneficiario con ese nombre".

## UI components

Existing: `UiIconButton` (back, search, danger trash), `UiCard`, `UiFieldRow`, `UiInfoNote`,
`UiSaveBar`, `UiSheet`, `UiButton` white/danger, `UiAvatar`, `UiTextField`, `UiToast`.

New in `packages/ui`, with Widgetbook stories, flagged for the other dev's review
(docs/COLABORACION.md §5):
- **`UiPayeeRow` (new, molecule)**: initials avatar (lavender for the first row as in the render,
  soft grey otherwise), name, subtitle and chevron (§8: `PayeeRow` keeps its chevron).
- **`UiIcons` (modified)**: adds `userPlus`, `lightbulb`, `history`, `trash`.

## Decisions

**PRD over the 47 render copy.** The render of 47 says the movements are kept "sin beneficiario
asignado", but FR-05 and the proposal say past transactions keep the payee they had. A logical
delete is also the only option that does not rewrite history. 47 therefore says "Sus N
movimientos se conservan con este beneficiario."

**Paginated list.** Payees grow with use (every new store), unlike plans or accounts, so the list
follows the pagination convention; 15 asks for 100 per page, far above realistic use.

**Name uniqueness among active payees only.** Deleting "Coto" and creating it again yields a new
payee; the old one keeps the history it had.

## Risks / Trade-offs

- [Counts are 0 until transactions exist] -> single method to extend, named in the README.
- [Suggested envelope not selectable yet] -> the row is shown disabled with "Sin sobre"; the API
  already accepts the id so `add-envelopes` only adds validation and the picker.

## Migration Plan

`npm run migration:run` creates `payees`. Rollback: `npm run migration:revert`.
