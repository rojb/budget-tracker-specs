# add-transaction-editing-and-filters (RRG-50)

## Objective
FR-13 edit/delete a transaction with full recalculation of every affected month (balances,
Available, carryover, Ready to Assign), and FR-22 filter movements (date range, time range, payee,
envelope, account, direction) with the "Salió en la franja / Entró" summary and search on screen 10.
Screens 12 Editar movimiento, 27 Eliminar movimiento, 49 Movimientos · recalculado (toast), 11 Filtrar
movimientos, plus the screen 10 header (search + filter icons, active filter chips, summary card).

## Why
Closes the movements flow started in RRG-49 and removes the known screen-10 gap.

## Constraints
- Recalculation correctness is the core risk: editing amount/envelope/account/date (including
  moving a transaction to another month) must leave every derived value equal to recomputing from
  scratch (budget-calc-engine "Derived values are never persisted"). Verify with before/after
  numbers across two months.
- Toasts per UX spec §8: Neutral "Recalculado · <months> actualizados · Deshacer" after edit (49), and
  "Movimiento eliminado · ... · Deshacer" after delete. "Deshacer" must really restore the previous
  state (design decides how: soft delete + restore / previous-version restore — document it).
- Reuse 36/37/38 pickers, TxRow, day_groups (one card per row), UiToast/showUiToast.
- Splits editable consistently with RRG-49 rules (exact sum, SaveBar Disabled "Faltan $ X").
- Authorization: members read; editors/owners edit/delete; 404 non-member, 403 viewer.
- Contract first; bump back `.contract-ref`; regenerate api_client. Nested repo layout.
- Verification honesty: never tick a verification task with caveats — leave it unchecked and say
  what is pending.
- Local Android builds need temporary `kotlin.incremental=false` (revert after). No test files.

## Tasks
- [x] T1 Specs: specs → design → tasks, one commit per phase (delegated writer)
- [x] T2 Contract + back + client + front, one commit per task
- [x] T3 Verify (lint/build/analyze, drift, live recalculation matrix, authz, device flows vs design)
- [ ] T4 Review gate; merge (specs first); archive; CI; Linear Done

## Progress
- RRG-50 In Progress.
- Specs 2428f04 specs, d559f2c design, 34c7ec5 tasks, 5981e57 openapi, b825e72 complete, db2b1ab reopen (income icon), 0ff34cc re-verified. Back 14caf6c..6a79ee3 (.contract-ref 5981e57). Front 35645f7..e11a284 + 756e78b (income icon, root in RRG-49 code).
- Evidence: recalculation matrix (amount, envelope, prev month, account, delete, undo delete, undo edit, undo split) equal to from-scratch; filters/search/summary/pagination; 403/404; drift 0 both refs; docs-json + Swagger UI; analyze/apk; device 10/11/12/27/49 + 14->12; Widgetbook new comps. Parent reviewed side-12, side-10, side-10b.
- Decisions: PUT (not PATCH) to clear optional fields; soft delete deleted_at + restore endpoint; edit-undo = client snapshot replay via PUT; server returns affectedMonths for toast; 12 adds Cuenta + Descripción rows.
- Incident: subagent adb input leaked into Retro Music on user phone (track changed, paused). Rule: foreground + screenshot check before every adb input.
