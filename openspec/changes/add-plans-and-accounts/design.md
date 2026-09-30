# Design

## Context

See proposal.md for the why. The back has `users`/`auth` (global JWT guard, `@CurrentUser()`,
`@Public()`) and the budget engine from `add-budget-calc-engine` (`budget_months.plan_id` waits
for this change's `plans` table). The front has the auth flow, the generated `packages/api_client`,
`ApiGateway`, `ChangeNotifier` controllers and `packages/ui` with tokens, `UiButton`, `UiChip`,
`UiIconButton`, `UiFieldRow`, `UiAmountCapsule`, `UiSaveBar`, `UiNavCluster`, `UiToast`,
`UiAvatar` and the joined-shape painter. Screens 20 and 30 are placeholder routes.

Sources: FR-02, FR-03, FR-40 (PRD.md), PRD §7 "Autorización por plan", PRD-ux-spec.md §5, §6.1,
§7 (Moneda), §8, §9.4, §9.5; renders `design/screens/{06,13,14,16,20,28,33,37,39,42,48,51}-*.png`;
`odd/tasks/canonical-dataset.md` state A; capability specs `api-conventions`, `auth`,
`budget-calc-engine`.

## Goals / Non-Goals

**Goals:**
- `plans`, `plan_members`, `accounts` tables; plan and account endpoints; authorization by
  membership reusable by every later plan-scoped module.
- Screens 20, 06, 16, 33 (currency display), 13, 14, 28, 42, 48, 51, 37 and the signed-in tab
  shell with `NavCluster`.
- The minimal shells of 01 Inicio (avatar → 39) and 39 Menú de cuenta, needed as the entry to 16.

**Non-Goals:**
- Invitations, joining, role changes and member removal (`add-plan-sharing`); 16 shows members
  read-only and "Invitar con código" is a placeholder.
- Envelopes (06's template buttons are placeholders), transactions (14's list stays empty,
  `inflow/outflow` are 0), transfers (29 is a placeholder), the month view (02/03/04).
- Test files of any kind (repo rule).

## API surface

Added to `openapi.yaml` (first `[specs]` task), tags `Plans` and `Accounts`:

| Operation | Path | Role | Request | Responses |
|---|---|---|---|---|
| `listPlans` | `GET /plans` | any signed-in | — | `200 Plan[]`, `401` |
| `createPlan` | `POST /plans` | any signed-in | `CreatePlanRequest` | `201 Plan`, `400`, `401` |
| `getPlan` | `GET /plans/{planId}` | member | — | `200 Plan`, `400`, `401`, `404` |
| `updatePlan` | `PATCH /plans/{planId}` | owner | `UpdatePlanRequest` | `200 Plan`, `400`, `401`, `403`, `404` |
| `deletePlan` | `DELETE /plans/{planId}` | owner | — | `204`, `400`, `401`, `403`, `404` |
| `listAccounts` | `GET /plans/{planId}/accounts?archived` | member | — | `200 Account[]`, `400`, `401`, `404` |
| `createAccount` | `POST /plans/{planId}/accounts` | owner, editor | `CreateAccountRequest` | `201 Account`, `400`, `401`, `403`, `404` |
| `getAccount` | `GET /plans/{planId}/accounts/{accountId}?month` | member | — | `200 AccountDetail`, `400`, `401`, `404` |
| `updateAccount` | `PATCH /plans/{planId}/accounts/{accountId}` | owner, editor | `UpdateAccountRequest` | `200 Account`, `400`, `401`, `403`, `404` |
| `archiveAccount` | `POST /plans/{planId}/accounts/{accountId}/archive` | owner, editor | — | `200 Account`, `401`, `403`, `404`, `409` |
| `restoreAccount` | `POST /plans/{planId}/accounts/{accountId}/restore` | owner, editor | — | `200 Account`, `401`, `403`, `404`, `409` |

Schemas (camelCase):
- `PlanRole` enum `owner | editor | viewer`; `AccountType` enum `bank | digitalWallet | cash`.
- `PlanMember { userId, name, email, role, joinedAt }`.
- `Plan { id, name, currency: Currency, timeZone, myRole, members: PlanMember[], createdAt }`.
- `CreatePlanRequest { name 1..60, currencyCode: CurrencyCode, timeZone?, firstAccount?: CreateAccountRequest }`,
  `additionalProperties: false`.
- `UpdatePlanRequest { name 1..60 }`, `additionalProperties: false` (so `currencyCode` → 400).
- `Account { id, name, type, openingBalanceMinor, balanceMinor, archived, archivedAt: Timestamp|null, createdAt }`.
- `AccountDetail = Account + { month: MonthKey, inflowMinor, outflowMinor }`.
- `CreateAccountRequest { name 1..60, type, openingBalanceMinor: MoneyMinor }`; `UpdateAccountRequest`
  the same fields, all optional, `minProperties: 1`.

Plan and account lists are bounded (a user has a handful of plans; a plan a handful of accounts)
so they return plain arrays, not the pagination envelope, which `api-conventions` requires only for
unbounded collections. `403` uses the standard error shape (`error: Forbidden`); `409` for
archive/restore of an account already in that state.

## Backend design

```
src/plans/  plans.module.ts plans.controller.ts plans.service.ts plan-access.service.ts
            entities/plan.entity.ts entities/plan-member.entity.ts
            dto/{plan,plan-member,create-plan,update-plan}.dto.ts currency.ts
src/accounts/ accounts.module.ts accounts.controller.ts accounts.service.ts
            entities/account.entity.ts dto/{account,account-detail,create-account,update-account,list-accounts-query,account-detail-query}.dto.ts
src/database/migrations/<ts>-CreatePlansMembersAccounts.ts
```

- **Tables.** `plans(id, name varchar(60), currency_code char(3) CHECK in ('ARS','USD','EUR'),
  time_zone varchar(64), created_at)`; `plan_members(plan_id fk cascade, user_id fk users cascade,
  role varchar(10) CHECK in owner/editor/viewer, joined_at, PK(plan_id, user_id))`;
  `accounts(id, plan_id fk cascade, name varchar(60), type varchar(16) CHECK, opening_balance_minor
  bigint, archived_at timestamptz null, created_at)`. The same migration adds
  `FK_budget_months_plan` (`budget_months.plan_id → plans`, on delete cascade), closing the
  pending FK of `add-budget-calc-engine`. Amounts use the shared `minorAmountTransformer`.
- **No stored balance.** `AccountsService.balances(planId)` computes `opening_balance_minor +
  Σ signed transaction amounts`; with no `transactions` table yet it returns the opening balance,
  and `add-transactions` extends that single query (documented in the method). `inflow/outflow`
  of the detail are 0 for the same reason. `AccountsService.ledgerBalanceMovements(planId)`
  returns the opening balance of every non-archived account in its opening month (`created_at` in
  the plan's time zone) for the engine's `PlanLedger`.
- **Authorization.** `PlanAccessService.require(planId, userId, allowed: PlanRole[])` loads the
  membership: none (or no plan) → `NotFoundException('Plan not found')`; role not allowed →
  `ForbiddenException`. Controllers call it first; there is no route guard because the plan id
  sits in different params per module and an explicit call is easier to read. `PlansModule`
  exports it, so `envelopes`, `payees`, `transactions` reuse it (sync point with Ruben). Role sets
  are constants: `READ = [owner, editor, viewer]`, `WRITE = [owner, editor]`, `OWNER = [owner]`.
- **Create plan** runs in one transaction: insert plan, insert owner membership, insert the first
  account when present. `timeZone` is validated with `Intl.supportedValuesOf('timeZone')`.
- **Currency** is derived from `currency_code` by a constant table (`currency.ts`) matching the
  `api-conventions` table; it is never accepted after creation (`UpdatePlanDto` whitelists `name`).
- **Account ownership check.** Account routes load `{ id: accountId, planId }` together, so an id
  from another plan is `404`.
- **Validation.** DTOs trim names; `openingBalanceMinor` uses `@IsInt()` plus a safe-integer bound;
  `month` query uses the `MonthKey` pattern; `archived` query is a boolean transform.
- **Swagger.** Every DTO with `@ApiProperty`; operationIds equal to the contract's; the drift check
  must stay clean.

## Generated client

Regenerated from the updated `openapi.yaml` with the pinned `dart-dio` generator (`inputSpec`
pointed at `../budget-tracker-specs/openapi.yaml` through the CLI `-i` flag, the pin untouched),
`test/` and `doc/` deleted, own commit.

## Frontend design

```
lib/core/plan/active_plan_storage.dart   # remembers the active plan id (flutter_secure_storage)
lib/features/plans/
  plans_repository.dart     # generated PlansApi → PlanData, maps DioException → ApiFailure
  plans_controller.dart     # ChangeNotifier: plans, active plan, load/select/create
  new_plan_page.dart        # 20
  plans_page.dart           # 16
  empty_plan_page.dart      # 06 (Plan tab while there are no envelopes)
  no_plan_page.dart         # signed-in without plans: create (20) or join (30)
lib/features/accounts/
  accounts_repository.dart  accounts_controller.dart
  accounts_page.dart        # 13
  account_detail_page.dart  # 14
  account_form_page.dart    # 28 and 42
  archive_account_sheet.dart # 48
  archived_accounts_page.dart # 51
  account_picker.dart       # 37 showAccountPicker(...)
lib/features/shell/
  app_shell.dart            # tabs with UiNavCluster (Inicio · Plan · + · Movimientos · Cuentas)
  home_page.dart            # 01 minimal shell: avatar → 39, greeting
  account_menu_sheet.dart   # 39
lib/core/api/api_failure.dart # shared error mapping (400 fields, 403, 404, 409, network)
```

- **Tabs.** `StatefulShellRoute.indexedStack` with branches `/home` (01 shell), `/plan` (06 while
  the plan has no envelopes; `add-envelopes` swaps in 02), `/transactions` (placeholder 10) and
  `/accounts` (13 → 14 nested). The "+" opens the 07 placeholder. The `UiNavCluster` sits in a
  fixed `bottomNavigationBar` sibling of the scrolling content (§6.1 rule 3).
- **Active plan.** `PlansController` is app-scoped (composition root). It loads `GET /plans` when
  the session becomes `signedIn`, picks the stored id if still listed, else the first, and exposes
  `activePlan` (with its `Currency` from `packages/ui`). It clears on sign-out. The router
  redirects signed-in users with no plans to `/start` (no-plan page, same two options as 34).
  Creating a plan (20) selects it and goes to `/plan`.
- **Money.** Every amount goes through `formatMoney(minor, activePlan.currency)`. Amount entry in
  28/42 uses a keypad of `UiKey` (0–9, 00, Del) that fills minor units from the right, so USD/EUR
  get two decimals without a decimal key.
- **Names** are edited from a `UiFieldRow` opening a small sheet with a `UiTextField` and "Listo".
- **Errors.** `ApiFailure` maps `400` messages to fields (class-validator prefix, as in auth),
  `403` → Warning toast "No tenés permiso para hacer esto", `404` → reload plans, network/5xx →
  Error toast "No pudimos conectar". Successful creates and edits show the "Guardado" Success toast
  (§5 "Guardado").
- **Placeholders** (existing `PlaceholderPage`): 07, 10, 15, 21, 29, 30, 31, 35.

## UI components

Existing, used as is: `UiIconButton` (back, search, layers, pencil, transfer, archive Danger),
`UiButton` Primary/Secondary, `UiChip` (type chips, template chips compact, Restaurar),
`UiFieldRow`, `UiAmountCapsule` (symbol from the plan currency), `UiSaveBar`, `UiNavCluster`,
`UiToast`, `UiAvatar`, `UiKey`, `UiTextField`, typography and colors.

New or modified in `packages/ui`, each with Widgetbook stories and flagged for the other dev's
review (docs/COLABORACION.md §5), landed as small separate commits:
- **`UiJoinedCard` (new, organism)**: the two joined white blocks of 01/02/04/06/13/33 — amount in
  `display` with its label on the left, a count with its label on the right, and a 52 dp "+"
  (Lavender, or muted `soft` when disabled). Also used by 14 with two amounts ("Entró"/"Salió") and
  no "+". Built on `JoinedShapePainter`. Reused later by `add-monthly-assignment`.
- **`UiAccountRow` (new, molecule)**: icon circle by type, name, subtitle, amount (`body-strong`),
  share caption, and a `UiStripeBar` of the share. Variants: Default (13), Selectable (37, radio
  or lavender check instead of the bar), Archived (51, muted icon and name, `trailing` slot for the
  Restaurar chip).
- **`UiStripeBar` (new, atom)**: chartreuse vertical stripes for the filled part and dots for the
  rest (§7 Forma). Reused by `EnvelopeRow` later.
- **`UiPlanRow` (new, molecule)**: Active (lavender, black check) / Inactive (white, chevron), a
  leading icon or overlapped initials, title and subtitle.
- **`UiMemberRow` (new, molecule)**: avatar, name, email and a role pill.
- **`UiCurrencySelector` (new, molecule)**: the three-option card of 20 (symbol badge, name,
  selected option lavender with check).
- **`UiSheet` (new, organism)** and `showUiSheet`: bottom sheet with handle, optional title and a
  48×48 close button, used by 37, 39, 48 and the name editor.
- **`UiInfoNote` (new, atom)**: white card with an info icon and muted text (13, 51) and a lavender
  variant with a leading icon for 48's consequence note.
- **`UiMonthSwitch` (new, molecule)**: ‹ month label › control of 06/02/04.
- **`UiChecklistRow` (new, atom)**: circle (done: lavender with check; pending: outline; disabled:
  muted) + label + chevron, for 06's "Primeros pasos".
- **`UiButton` (modified)**: new `danger` variant (solid `#C62828`, white text, 56 high, §6.1
  rule 2).
- **`UiIcons` (modified)**: adds `chevronLeft`, `close`, `search`, `layers`, `pencil`, `archive`,
  `landmark`, `smartphone`, `banknote`, `keyRound`, `contact`, `cornerDownRight`, `wand`.

## Decisions

**Owner-only plan settings, editor writes data.** Matches 16's note ("Julián puede cargar
movimientos y asignar, pero solo vos invitás, quitás miembros o borrás el plan"). Viewer is
read-only everywhere.

**404 for non-members.** Does not reveal which plan ids exist (PRD §7 security row).

**First account inside `POST /plans`.** Screen 20 creates both in one confirmation; one request
keeps it atomic and avoids a plan without its declared account if the second call fails.

**Plain arrays for plans and accounts.** Bounded collections; pagination would complicate every
picker for no benefit. Recorded here so later reviewers see it is deliberate.

**Active plan on the device.** The server has no notion of a "current" plan; storing it locally is
enough for a single-device user and avoids a settings endpoint.

**Plan tab title stays "Plan".** §6.1 rule 7 keeps root tab titles fixed; 33's currency capsule is
shown next to that title for non-peso plans instead of replacing it with the plan name.

**01 and 39 shells here, not in `add-payees`.** The roadmap gave the first hub shell to
`add-payees`, but 16 (this change) is only reachable through 39. Both are mine; `add-payees` only
wires the "Beneficiarios" entry.

## Risks / Trade-offs

- [Many new `packages/ui` components in one change] -> each lands in its own commit with its
  stories so Ruben can review them independently (§5).
- [Balance derivation must change when transactions arrive] -> a single method with a comment
  naming `add-transactions`; the engine's `PlanLedger` rules already describe the target.
- [Stored active plan id of a plan the user left] -> ignored when not in the list.

## Migration Plan

`npm run migration:run` creates `plans`, `plan_members`, `accounts` and adds the pending FK on
`budget_months` (fails only if orphan `budget_months` rows exist; none in any environment yet).
Rollback: `npm run migration:revert`. Front: regenerated client plus additive routes.
