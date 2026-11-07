# add-envelope-move-history (RRG-59)

## Objective
Record every money move between envelopes (screen 24) and show it in the envelope detail activity
(screen 22), so an envelope that only received/sent money no longer shows "Sin actividad".

## Why
Reported by the user during manual testing. Today a move only adjusts two assignments
(AssignmentsService) and leaves no record; the 22 activity lists transactions only (spec
`envelope-goals` "Month activity", render 22).

## Decisions (user)
- Moves appear ONLY in 22 activity — NOT in Movimientos (10) nor in account detail (14), and never in
  the "Salió / Entró" totals (moves don't touch accounts).
- Row in 22: "Movido desde <Sobre>" (+amount, lavender like income) on the destination, "Movido a
  <Sobre>" (−amount) on the source; ⇄ icon; subtitle with time (and month when needed); ordered with the
  transactions by registration instant (createdAt), consistent with RRG-57 D8.
- Figures (assigned, available, spent, Ready to Assign) unchanged — history only. `spentMinor` must NOT
  include moves; `activityTotal` counts both kinds (decide/document).
- Moves made before this change cannot be reconstructed (no data); documented, no backfill.
- Tapping a move row: no edit screen (not a transaction) — no dead tap: either non-tappable with no
  affordance, or opens the other envelope's 22. Decide from §9.5 and document.

## Constraints
- SDD: proposal → specs (MODIFIED envelope-goals activity + move requirements) → design → tasks → one
  commit per task → complete. Contract first (detail response gains move items; discriminated union or
  separate `moves` array — decide), bump `.contract-ref`, regenerate api_client.
- New table + migration (up/down), written in the SAME DB transaction as the move (FOR UPDATE NOWAIT
  path from RRG-52). Deleting an envelope: decide cascade/retention of its move records.
- AuthZ unchanged (members read; editors/owners move). Viewer sees moves read-only.
- Device checks only via scratchpad safe-adb.sh guard; device login with an email without a period
  before "@" (SwiftKey). No test files. Temporary `kotlin.incremental=false` (revert).
- Do NOT stage docs/PLAN-DE-PRUEBAS.md (untracked, pending user decision).

## Tasks
- [x] T1 Specs: proposal → specs → design → tasks (delegated writer) (specs 2147e81, bcedd6e, 2c84ac6, 36f2326)
- [x] T2 Contract + back + client + front, one commit per task (specs 3fce9f7; back fe8003f, 71f86e3, c7e7df8; front e841aa9, 451852a)
- [x] T3 Verify, delegated (back main merged as c940517; migration run, revert, run; device 22 of both envelopes, 10/14 unaffected; specs 44ba7f9). Device run used the side-by-side debug package `.uxcheck` because the installed app has another debug signature. Not run after the merge: oasdiff drift (tool missing), 409 and concurrency re-checks.
- [ ] T4 Merge (specs first); archive; CI; production rollout. RDD is off, so no native review.

## Progress
- RRG-59 created; Linear already Done by user decision.
- 2026-11-06 resume: back main gained 9 commits (Vercel deploy, 2026-10-18) that the back branch lacks.
  Production runs at https://budget-tracker-back.vercel.app without RRG-59, and it needs the
  `AddEnvelopeMoves` migration BEFORE the new code (README: migrations run manually, then `vercel --prod`).
- Local DB container and volume no longer exist: the demo data is gone, reseed through the API.
- safe-adb.sh was lost with its old scratchpad: recreate it before any device input.

## Next step
Ask the user about the production rollout (T4): merge, push, Neon migration, then `vercel --prod`.
