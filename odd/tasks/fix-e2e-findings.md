# fix-e2e-findings (RRG-57)

## Objective
Fix the defects found by the full end-to-end device test of 2026-10-01 (50/53 screens), in one
OpenSpec change owned by Ruben (user decision: Ruben fixes all, including nathaliascode's areas).

## Defects
- D1 major — 16 Planes y miembros: members list / "Compartido · N miembros" stale after someone joins;
  only an app restart shows the member. Expected: list reflects server state when the screen is shown
  (refresh on open/resume + pull-to-refresh per UX conventions if any).
- D3 major — 09 Registrar ingreso: "¿A dónde va?" choice cards are hidden while the calculator pad is
  open, and the pad opens by default, so "income directly to an envelope" is undiscoverable.
  Design 09 shows the cards visible. Stakeholder requirement: "registrar ingreso directamente a un sobre".
- D4 minor — 02: missing "Nuevo grupo / Editar grupos" row after the last group (check render + §9.5).
- D2 minor — 06 Plan vacío: missing search (lupa) per render.
- D5 cosmetic — 51 Cuentas archivadas: missing "Ver movimientos" link per render/§9.5.
- D6 cosmetic — truncated texts: date in 27 sheet; transfer title in 14.
- D8 (user decision 2026-10-01) — "latest first" means REGISTRATION date: lists 10 and 14 ordered and
  grouped by createdAt day (plan TZ); a row shows its movement date when it differs; month attribution,
  balances, recalculation and date filters keep using occurredAt. MODIFIED delta on `transactions`.
- Not a defect: negative Ready to Assign for a past month (budget-calc-engine formula).

## Stakeholder requirements checked (chat 29/9)
- Share plan with another person (nice to have) → FR-27 implemented (RRG-53); D1 affects it.
- Latest transactions first → implemented (occurredAt DESC, createdAt DESC; spec "Newest first").
- Transfer between accounts → FR-28 implemented (RRG-55).
- Income directly to an envelope → FR-08 API implemented; UI hidden → D3.

## Constraints
- SDD: proposal → specs (MODIFIED deltas only where behavior changes, e.g. members freshness, income
  destination visibility) → design → tasks → one commit per task → tasks complete.
- Touches nathaliascode's features (plans/sharing/accounts): minimal, consistent with her code.
- Device checks ONLY through scratchpad safe-adb.sh guard (focus check before every input; HOME blocked).
- No test files. Local Android builds need temporary `kotlin.incremental=false` (revert).

## Tasks
- [x] T1 Specs: proposal → specs → design → tasks (delegated writer)
- [x] T2 Fixes, one commit per defect/task
- [x] T3 Verify each defect on device vs design + regression of affected flows
- [ ] T4 Review gate; merge (specs first); archive; CI; Linear Done; note to nathaliascode

## Progress
- RRG-57 created, In Progress.
- Specs 4566e23 proposal, 19130d6 D8 in proposal, 4ebe628 specs, 067c1dd design, 8ca207e tasks, 2fa57f1 openapi descriptions, 3249ba5 complete. Back a8f79fc (order by createdAt). Front 3c6a9dd D1, ddd7f36 D3, 267e330 D4, c3c0212 D2, 53d8faa D5, 0201237 D6, 22efc6c D8.
- Root causes: D1 no reload on show (now open/resume/10 s poll); D3 pad open by default hid cards (income opens with cards; hint added); D6 UiTxRow single-line ellipsis (now wraps); D8 back ordered by occurredAt.
- Evidence: device via safe-adb guard (0 guard events); third user joined while 16 open -> appeared; income 5.000 to Farmacia, RTA unchanged; 07 calculator regression ok; backdated movement first under Hoy with its date. Parent reviewed fix-D3/fix-D8. analyze/lint/build clean, drift 0.
- Note: D1 uses 10 s polling while 16 is visible (simple, acceptable for academic scope).
