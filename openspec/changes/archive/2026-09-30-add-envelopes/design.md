# Design

## Context

See proposal.md for the why. The repos now live side by side (`budget-tracker-back` and
`budget-tracker-front` inside the specs folder; the contract is `../openapi.yaml` from the back).
Already merged and reused here:

- Back: `PlansModule` exports `PlanAccessService` (404 for non-members, 403 by role, constants
  `READ_ROLES`/`WRITE_ROLES`) and the shared `parseUuid` pipe; `BudgetModule` exports
  `CalculationService` and `AssignmentsService` (`setAssignment`, `ledgerRows`) over `budget_months`
  and `assignments`; `AccountsModule` exports `AccountsService.ledgerBalanceMovements`;
  `payees.suggested_envelope_id` and `assignments.envelope_id` are plain `uuid` columns waiting for
  the FK this change adds.
- Front: app-scoped `PlansController`/`AccountsController`, `ApiGateway` + `guardApi`/`ApiFailure`,
  06 Plan vacío on the Plan tab with placeholder routes for 31, 32 and 35, `features/common`
  (`showTextEditSheet`, `showAmountSheet`, `confirmSheet`, `showSaved`), and `packages/ui` with
  `UiSheet`, `UiCard`, `UiInfoNote`, `UiJoinedCard`, `UiMonthSwitch`, `UiStripeBar`, `UiFieldRow`,
  `UiSaveBar`, `UiButton` (white/danger), `UiIconButton`, `UiChip`.

Sources: FR-04 (PRD.md), PRD-ux-spec.md §6.1 (rules 1, 2, 4, 9), §8 (`EnvelopeRow` variants, "Los
tres estilos de etiqueta de grupo", chevron decision), §9.3, §9.4, §9.5; renders
`design/screens/{02,31,32,35,43,44,46,52}-*.png`; capability specs `plans`, `payees`,
`budget-calc-engine`, `api-conventions`.

## Goals / Non-Goals

**Goals:**
- `envelope_groups` and `envelopes` tables; group and envelope CRUD, reordering, the starter
  template and the initial bulk assignment; the two FKs that were waiting for `envelopes`.
- Screens 31, 32, 35, 43, 44, 46, 52 and the envelope management part of 02.

**Non-Goals:**
- Goals on envelopes, derived Underfunded state, 22 Detalle de sobre, 23 Editar sobre, 24 Mover
  dinero (`add-envelope-goals`). The objective block of 31 is left out until that change adds it.
- Transactions and `Spent` (`add-transactions`); the envelope picker 36 (also `add-transactions`).
- Assigning one envelope for a month, the rest of the month view (status chips, 03/04/53, month
  navigation, month close 25) (`add-monthly-assignment`).
- Test files of any kind (repo rule).

## Screen 02 boundary with add-monthly-assignment (RRG-51)

02 is shared. This change owns the **Plan tab shell and the structure of the list**; RRG-51 owns
the **monthly flow**. Nobody builds the same widget twice:

| Owned by this change (RRG-47) | Owned by RRG-51 (nathaliascode) |
|---|---|
| Route `/plan` decides 06 vs 02 by the number of envelopes | Month navigation ‹ › and screen 04 (future month) |
| `layers` button → 32, search button (in place, by name) | Status filter chips Todos / Sobregirados / Falta (FR-21) |
| `UiJoinedCard` with Ready to Assign + "Sobres activos" (reads `GET /envelopes`) | The "+" of the card → 03 Asignar dinero, 53, `POST` assignment for one envelope |
| Group headers (`UiGroupHeader`: name, subtotal, "+" → 31) and `EnvelopeRow`s per group, "Sin grupo" at the end | Month-view aggregate endpoint, month close (25) and its trigger |
| `EnvelopeRow` variants Funded / Overspent / Empty from `assignedMinor`/`availableMinor` | Row subtitles that depend on goals ("Vence el 10", Underfunded) are `add-envelope-goals` |
| Row tap → placeholder 22; long press → 43 (interim, see Decisions) | |

Consequences: the month switch is shown for the current month with both arrows disabled (the API
already accepts `month`, so RRG-51 only enables them); the "+" of the `JoinedCard` is disabled with
"Asignar dinero" as its label until RRG-51; the filter chip row is not rendered. `GET
/plans/{planId}/envelopes?month` returns the structure plus the two figures the engine already
derives (`assignedMinor`, `availableMinor`, and `readyToAssignMinor` of the month); it is not the
month view of RRG-51 (no statuses, no close summary, no `spentMinor` until transactions exist), and
RRG-51 may add its own aggregate next to it without touching this contract.

## API surface

Added to `openapi.yaml` (first `[specs]` task), tag `Envelopes`, all under bearer auth:

| Operation | Path | Role | Request | Responses |
|---|---|---|---|---|
| `getEnvelopeTemplate` | `GET /envelope-template` | any signed-in | — | `200 EnvelopeTemplate`, `401` |
| `listEnvelopeGroups` | `GET /plans/{planId}/envelope-groups` | member | — | `200 EnvelopeGroup[]`, `400`, `401`, `404` |
| `createEnvelopeGroup` | `POST /plans/{planId}/envelope-groups` | owner, editor | `CreateEnvelopeGroupRequest` | `201 EnvelopeGroup`, `400`, `401`, `403`, `404`, `409` |
| `updateEnvelopeGroup` | `PATCH /plans/{planId}/envelope-groups/{groupId}` | owner, editor | `UpdateEnvelopeGroupRequest` | `200 EnvelopeGroup`, `400`, `401`, `403`, `404`, `409` |
| `deleteEnvelopeGroup` | `DELETE /plans/{planId}/envelope-groups/{groupId}` | owner, editor | — | `204`, `400`, `401`, `403`, `404` |
| `reorderEnvelopeGroups` | `PUT /plans/{planId}/envelope-groups/order` | owner, editor | `ReorderEnvelopeGroupsRequest` | `200 EnvelopeGroup[]`, `400`, `401`, `403`, `404` |
| `applyEnvelopeTemplate` | `POST /plans/{planId}/envelope-groups/template` | owner, editor | `ApplyEnvelopeTemplateRequest` | `201 EnvelopeTemplateResult`, `400`, `401`, `403`, `404`, `409` |
| `listEnvelopes` | `GET /plans/{planId}/envelopes?month` | member | — | `200 EnvelopeList`, `400`, `401`, `404` |
| `createEnvelope` | `POST /plans/{planId}/envelopes` | owner, editor | `CreateEnvelopeRequest` | `201 Envelope`, `400`, `401`, `403`, `404`, `409` |
| `getEnvelope` | `GET /plans/{planId}/envelopes/{envelopeId}` | member | — | `200 Envelope`, `400`, `401`, `404` |
| `updateEnvelope` | `PATCH /plans/{planId}/envelopes/{envelopeId}` | owner, editor | `UpdateEnvelopeRequest` | `200 Envelope`, `400`, `401`, `403`, `404`, `409` |
| `deleteEnvelope` | `DELETE /plans/{planId}/envelopes/{envelopeId}` | owner, editor | — | `204`, `400`, `401`, `403`, `404` |
| `reorderEnvelopes` | `PUT /plans/{planId}/envelopes/order` | owner, editor | `ReorderEnvelopesRequest` | `200 Envelope[]`, `400`, `401`, `403`, `404` |
| `applyInitialAssignment` | `POST /plans/{planId}/envelopes/initial-assignment` | owner, editor | `InitialAssignmentRequest` | `200 InitialAssignmentResult`, `400`, `401`, `403`, `404` |

Schemas (camelCase, optional fields omitted rather than `null`, as in the merged contract):
- `EnvelopeIcon` enum: `tag, home, bus, utensils, heartPulse, gift, cart, pill, wifi, settings,
  ticket, repeat, lifeBuoy, plane`.
- `EnvelopeGroup { id, name, position, envelopeCount, createdAt }`; `CreateEnvelopeGroupRequest` and
  `UpdateEnvelopeGroupRequest { name 1..60 }`; `ReorderEnvelopeGroupsRequest { groupIds: Uuid[] }`.
- `Envelope { id, name, icon, groupId?, position, createdAt }`; `EnvelopeLine { envelope, assignedMinor,
  availableMinor }`; `EnvelopeList { month, readyToAssignMinor, items: EnvelopeLine[] }`.
- `CreateEnvelopeRequest { name 1..60, groupId?, icon? }`; `UpdateEnvelopeRequest` the same fields all
  optional with `minProperties: 1`; `ReorderEnvelopesRequest { groupId?, envelopeIds: Uuid[] }`
  (no `groupId` = the envelopes without a group).
- `EnvelopeTemplate { groups: [{ name, envelopes: [{ name, icon }] }] }` (`TemplateGroup`,
  `TemplateEnvelope`); `ApplyEnvelopeTemplateRequest { envelopeNames?: string[] }`;
  `EnvelopeTemplateResult { groups: EnvelopeGroup[], envelopes: Envelope[] }`.
- `InitialAssignmentRequest { month?: MonthKey, assignments: [{ envelopeId, amountMinor >= 0 }] (1..100) }`
  and `InitialAssignmentResult { month, assignedMinor, readyToAssignMinor }`.
- Responses `EnvelopeGroupNameTaken`, `EnvelopeNameTaken` and `PlanHasEnvelopes` (all `409`).
- All `additionalProperties: false` on requests; path parameters declared per operation and no
  3.1 `null` types (the oasdiff/Redocly constraints found in `add-plans-and-accounts`).

Groups and envelopes are bounded collections (a plan has a handful of each), so they return plain
arrays and the `EnvelopeList` wrapper, not the pagination envelope. A group or envelope of another
plan answers `404`. The `PUT .../order` routes are declared before the `{id}` routes, and `PUT
/order` never clashes with them because no `{id}` route uses `PUT`.

## Backend design

```
src/envelopes/
  envelopes.module.ts
  envelope-groups.controller.ts  envelope-groups.service.ts
  envelopes.controller.ts        envelopes.service.ts
  envelope-template.controller.ts  envelope-template.ts   # constant: 4 groups / 12 envelopes
  envelope-icons.ts                                       # ENVELOPE_ICONS closed set
  entities/{envelope-group,envelope}.entity.ts
  dto/{envelope-group,envelope,envelope-list,envelope-template,initial-assignment}.dto.ts
src/budget/assignments.service.ts       # + setAssignments (bulk, one transaction)
src/payees/payees.service.ts            # + suggested envelope validation
src/database/migrations/<ts>-CreateEnvelopes.ts
```

- **Tables.** `envelope_groups(id, plan_id fk plans cascade, name varchar(60), position integer,
  created_at)` with `UQ_envelope_groups_plan_name` on `(plan_id, lower(name))`; `envelopes(id,
  plan_id fk plans cascade, group_id uuid null fk envelope_groups ON DELETE SET NULL, name
  varchar(60), icon varchar(16) default 'tag' CHECK in the closed set, position integer, created_at)`
  with `UQ_envelopes_plan_name` on `(plan_id, lower(name))`. The unique violation (`23505`) maps to
  `409`; no pre-check (it would race), as in `payees`.
- **Foreign keys that were waiting.** The same migration adds `FK_assignments_envelope`
  (`assignments.envelope_id` → `envelopes`, ON DELETE CASCADE) and `FK_payees_suggested_envelope`
  (`payees.suggested_envelope_id` → `envelopes`, ON DELETE SET NULL), exactly as announced in the
  migrations of `add-budget-calc-engine` and `add-payees`. Both columns exist, so both FKs are in.
  Orphan rows cannot exist yet (nothing creates envelope ids before this change), so the migration
  cannot fail on them. Later, `add-transactions` adds `transactions.envelope_id` with ON DELETE SET
  NULL so a deleted envelope leaves its movements as "Sin sobre" (spec "Delete an envelope").
- **Order.** `position` is an integer; lists sort by `position, created_at`. New rows take
  `max(position) + 1` of their scope (the plan's groups, one group, or the ungrouped envelopes).
  Reorder replaces the positions `0..n-1` in one transaction after checking the list is a permutation
  of the scope. Deleting a group moves its envelopes to the end of the ungrouped ones (positions
  appended in their old order) in the same transaction as the delete, so "Sin grupo" keeps a stable
  order.
- **Authorization.** Controllers call `PlanAccessService.require(planId, user.id, READ_ROLES |
  WRITE_ROLES)` first, like `payees`. `EnvelopesModule` imports `PlansModule`, `AccountsModule` and
  `BudgetModule` and exports `EnvelopesService` for `add-transactions` and `add-monthly-assignment`
  (sync point: `EnvelopesService.ledger(planId)` builds the `PlanLedger`).
- **Figures.** `EnvelopesService.list(planId, month)` builds the `PlanLedger` of the plan:
  `currentMonth` from the plan's time zone, `envelopeIds` from the `envelopes` table,
  `balanceMovements` from `AccountsService.ledgerBalanceMovements`, `assignments` from
  `AssignmentsService.ledgerRows`, and `spending: []` with a comment naming `add-transactions`
  (it extends this single method, like the account balance and the payee counts). It then calls
  `CalculationService.calculateMonth` and maps each `EnvelopeMonthState` to an `EnvelopeLine`.
- **Initial bulk assignment.** `EnvelopesService.assignInitial` checks that every envelope id
  belongs to the plan (one query, else `404`), rejects repeated ids (`400`) and calls the new
  `AssignmentsService.setAssignments(planId, month, rows)`, which runs the existing upsert for all
  rows inside one `dataSource.transaction` (the budget month is created lazily once). The result
  carries `assignedMinor` (Σ of the request) and `readyToAssignMinor` from `calculateMonth`, which
  is negative when over-assigned. The existing `setAssignment` is untouched.
- **Template.** `envelope-template.ts` holds the constant (group, envelope, icon). `apply` runs in a
  transaction: `409` when the plan has any envelope, `400` for a name outside the template, reuse of
  a same-named group (case-insensitive), creation of missing groups only when at least one of their
  envelopes is selected, envelopes in template order.
- **Delete rules.** Envelope: plain `DELETE`; the DB cascades its assignments and nulls the payees'
  suggestion. Group: `ON DELETE SET NULL` leaves the envelopes ungrouped (plus the reposition
  above).
- **Payees.** `PayeesService` validates `suggestedEnvelopeId` on create and update with an
  `envelopes` lookup by `{ id, planId }` (`404 'Envelope not found'`). `PayeesModule` imports the
  `Envelope` repository through `TypeOrmModule.forFeature`, not `EnvelopesModule`, to avoid a cycle.
- **Validation.** DTOs trim names (`@Transform(trim)`), `@IsUUID`, `@IsIn(ENVELOPE_ICONS)`,
  `amountMinor` with `@IsInt()` and `@Min(0)`, month with the `MonthKey` pattern, `@ArrayUnique` on
  id lists; the global pipe already rejects unknown properties.
- **Swagger.** Every DTO with `@ApiProperty`, operationIds equal to the contract's; drift must stay
  clean. `.contract-ref` is bumped in a dedicated `[back]` task to the specs commit that holds the
  new paths.

## Generated client

Regenerated from the updated `openapi.yaml` with the pinned `dart-dio` generator (`-i` pointed at
`../openapi.yaml`, the pin untouched), then `dart run build_runner build`, `test/` and `doc/`
removed, own commit (as in the previous changes).

## Frontend design

```
lib/features/envelopes/
  envelopes_repository.dart   # generated EnvelopesApi → GroupData / EnvelopeData / EnvelopeList, guardApi
  envelopes_controller.dart   # app-scoped ChangeNotifier: groups, envelope lines, RTA, mutations
  plan_tab_page.dart          # /plan: 06 or 02 depending on the envelope count
  plan_page.dart              # 02
  envelope_form_page.dart     # 31
  group_picker_sheet.dart     # 52  showGroupPicker(...)
  groups_page.dart            # 32
  delete_group_sheet.dart     # 44
  delete_envelope_sheet.dart  # 43  showDeleteEnvelopeSheet(...)
  template_page.dart          # 35
  assign_money_page.dart      # 46
```

- **Routes.** `/plan` builds `PlanTabPage` (06 while `envelopes.isEmpty`, 02 otherwise; a spinner-free
  blank while the first load runs). `/groups` (32), `/envelopes/template` (35), `/envelopes/new`
  (31, optional `?groupId=`), `/envelopes/assign` (46) replace the placeholders, on the root
  navigator so the tab bar hides as in the design. 44 and 43 are sheets (`showUiSheet`), 52 is a
  sheet opened by 31. The `AppRoutes` comments for 32, 35 and 31 lose "placeholder".
- **State.** `EnvelopesController` is app-scoped (like `AccountsController`): it reloads when the
  active plan changes and after every mutation, because the figures and the Ready to Assign come
  from the API. It exposes `groups`, `lines` (envelope + figures), `readyToAssignMinor`,
  `envelopeCount`, `ungrouped`, `linesOf(group)` and `subtotalOf(group)` (Σ available, for the
  header). Mutations: `createEnvelope`, `createGroup`, `renameGroup`, `reorderGroups` (optimistic,
  reverted on failure), `deleteGroup`, `deleteEnvelope`, `applyTemplate(names)`, `assign(amounts)`.
- **02.** Header "Plan" with the currency capsule for non-peso plans, `layers` (→ 32) and search
  (in place, by name), `UiMonthSwitch` with both arrows disabled, `UiJoinedCard` (Ready to Assign,
  envelope count), then per group `UiGroupHeader` and `UiEnvelopeRow`s in a `UiCard`; "Sin grupo"
  header without "+" for ungrouped envelopes. Row state: `available < 0` Overspent, `assigned == 0 &&
  available == 0` Empty, else Funded; Underfunded is drawn by `UiEnvelopeRow` but only
  `add-envelope-goals` produces it. The subtitle reads "<spent> de <assigned>" (spent is 0 until
  transactions, so "$ 0 de $ 20.000"). Pull to refresh.
- **31.** Back button, "Nuevo sobre" title, subtitle "Sumá un sobre a <grupo>", `UiFieldRow`s for
  Nombre (text sheet) and Grupo (→ 52), the icon selector (seven `UiIconButton`s: the chosen icon
  lavender; "…" expands the remaining icons of the closed set), `UiSaveBar` "Crear sobre". 409 →
  "Ya tenés un sobre con ese nombre." on the name. The "Objetivo" block of the design is not built
  here (`add-envelope-goals`).
- **52.** `showGroupPicker` → `UiSheet` "Elegí un grupo", a `UiCard` of `UiGroupRow` (selectable),
  and the expandable "+ Nuevo grupo" row with a `UiTextField` and a "Crear" `UiButton`.
- **32.** `ReorderableListView` of `UiGroupRow` (manage variant: drag handle, name, "N sobres", pencil
  `UiIconButton` soft, trash `UiIconButton` danger), a "Nuevo grupo" `UiTextField` with "+", the
  `UiInfoNote`. The pencil opens `showTextEditSheet`; 409 → "Ya tenés un grupo con ese nombre.".
- **44 / 43.** Sheets with `UiGroupRow`/`UiEnvelopeRow` summary card, the lavender `UiInfoNote` and
  Cancelar (`UiButton` white) / Eliminar (`UiButton` danger). After a delete a Success toast
  ("Grupo eliminado", "Sobre eliminado"); no "Deshacer" because the delete is permanent (Decisions).
- **35.** Reads `getEnvelopeTemplate`, `UiSectionLabel` per group, `UiEnvelopeTickRow`s (all ticked),
  the note, `UiButton` Primary "Crear N sobres" with the wand icon (disabled at 0). On confirm:
  `applyTemplate(names)` then `context.go('/envelopes/assign')`.
- **46.** White card with the Ready to Assign, the same grouping with `UiEnvelopeAmountRow` (pill
  opens `showAmountSheet`, "$ 0" muted), the live "Te quedan …" / "Te pasaste …" note and "Listo"
  (`assign` with the non-zero amounts → `context.go('/plan')`). Close (x) → `/plan`.
- **Amounts** go through `formatMoney(minor, plans.currency)`; entry uses the existing
  `showAmountSheet`. Errors through `ApiFailure` (400 by field, 403 → `showForbidden`, 404 →
  reload, network → `showConnectionProblem`).
- **Interim entry to 43.** The real entry is the trash of 23 Editar sobre (`add-envelope-goals`).
  Until then a long press on an `EnvelopeRow` in 02 opens 43 (with a semantics custom action
  "Eliminar sobre"), and a tap opens the existing placeholder route for 22.

## UI components

Existing, used as is: `UiIconButton` (back, close, layers, search, pencil, trash Danger, icon
selector), `UiButton` Primary / white / danger, `UiCard`, `UiFieldRow`, `UiInfoNote` (plain and
lavender), `UiJoinedCard`, `UiMonthSwitch`, `UiSaveBar`, `UiSheet`/`showUiSheet`, `UiTextField`,
`UiChip`, `UiToast`, `UiStripeBar`.

New in `packages/ui`, each with Widgetbook stories and flagged for the other dev's review
(docs/COLABORACION.md §5), landed as small separate commits. Names follow the design components:
- **`UiEnvelopeRow` (new, molecule)**: icon circle, name, subtitle, amount (`body-strong`), state
  caption and a `UiStripeBar`. Variants **Funded** (chartreuse stripes, "Disponible"), **Underfunded**
  (partial stripes, "Falta $ X"), **Overspent** (red icon circle, red amount with "−", red
  "Sobregirado", full `danger` bar) and **Empty** (muted amount, no bar). No chevron (§8). Also
  used, without bar, as the summary of 43.
- **`UiGroupHeader` (new, molecule)**: group name 20 / 400, "<amount> disponible" 13 `ink-muted`
  and a 32 dp "+" (48 dp hit area) — style 1 of §8.
- **`UiGroupRow` (new, molecule)**: name 16 / 500 and "N sobres" 13 — style 3 of §8 — in three
  variants: manage (32: drag handle, `trailing` slot for pencil and trash), selectable (52: layers
  circle, radio or lavender check) and summary (44: layers circle).
- **`UiSectionLabel` (new, atom)**: UPPERCASE divider 12 / 600 `ink-muted` — style 2 of §8 (35, 46).
- **`UiEnvelopeTickRow` (new, molecule)**: icon, name, lavender check circle (ticked) or outline
  (unticked), for 35.
- **`UiEnvelopeAmountRow` (new, molecule)**: icon, name and an amount pill (`$ 0` muted) for 46.
- **`UiIcons` (modified)** adds `tag`, `bus`, `utensils`, `heartPulse`, `gift`, `cart`, `pill`,
  `wifi`, `settings`, `ticket`, `repeat`, `lifeBuoy`, `plane`, `ellipsis`, `grip`, plus
  `uiEnvelopeIcons` (name → `IconData`, in the order of the picker) so the app maps the API's
  `EnvelopeIcon` without a switch in every screen.

The `EnvelopeRow` and `GroupRow` components are the ones `add-monthly-assignment` and
`add-envelope-goals` reuse; both owners are notified through the packages/ui PR.

## Decisions

**Groups and envelopes have unique names per plan, ignoring case.** The UX does not say it, but two
"Transporte" rows are indistinguishable in 36 and 46, and `payees` already sets the precedent. A
partial-free unique index is the source of truth.

**Deleting a group keeps its envelopes; deleting an envelope deletes its assignments.** Both follow
the copy of 44 and 43 ("pasan a «Sin grupo»", "los disponibles vuelven a Listo para asignar").
Removing the assignments is what frees the money: `ReadyToAssign` subtracts every envelope's
Available, so a deleted envelope stops subtracting. Transactions are never deleted (they go to "Sin
sobre" when `add-transactions` exists).

**No undo for deletions.** §8 lists "Sobre eliminado · Deshacer", but restoring an envelope would
need its assignments kept as soft-deleted facts, which contradicts "facts only" in the engine. The
toast is Success without an action; 43 and 44 already force a confirmation.

**Initial assignment is its own endpoint, not N `POST`s.** Screen 46 sets up to a dozen envelopes at
once and must be atomic; it reuses the engine's assignment facts through one new bulk method, and
leaves the per-envelope endpoint to RRG-51.

**Over-assigning is reported, not blocked** (`budget-calc-engine`: ReadyToAssign "SHALL NOT be
clamped"; §6 "Asignar de más → Listo para asignar negativo en rojo").

**Template served by the API.** The front would otherwise duplicate 12 names and icons; the back
owns the constant and `GET /envelope-template` is the single source. The 06 preview chips stay
static (they only preview).

**Ungrouped envelopes.** `groupId` is optional on create and is the state a group delete leaves
behind; there is no "move to Sin grupo" in 52 (the design has only real groups).

**Interim entry to 43 by long press** instead of inventing a screen: 23 (its real entry) belongs to
`add-envelope-goals`. Recorded so the next change moves it to the trash icon.

**Screen order in 32.** The render lists Día a día first, the template (35, PRD) lists Obligaciones
first. The template order is the default; 32 shows whatever order the plan has.

## Risks / Trade-offs

- [`add-monthly-assignment` builds a competing month aggregate] -> the boundary table above and the
  `EnvelopesService.ledger` hook; the envelope list carries only what the engine derives.
- [Spent is 0 until transactions, so rows read "$ 0 de $ X"] -> documented in the README and the
  hook is one method; Overspent cannot appear before transactions or negative assignments.
- [`packages/ui` gets several components at once] -> one commit per component family with stories,
  reviewable independently (§5).
- [Reordering on 32 uses drag only] -> a semantics custom action for moving up and down keeps it
  accessible.

## Migration Plan

`npm run migration:run` creates `envelope_groups` and `envelopes` and adds
`FK_assignments_envelope` and `FK_payees_suggested_envelope`. Rollback: `npm run migration:revert`
drops the two FKs and both tables. Front: regenerated client plus additive routes; the Plan tab
switches from 06 to 02 by itself once a plan has envelopes.
