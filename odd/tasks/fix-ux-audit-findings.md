# fix-ux-audit-findings (RRG-84)

## Objective
Fix the daily-use and visual problems found by the UX audit of 2026-11-06, so the app is comfortable to
use every day. Animations follow in add-motion-system (RRG-85), which builds on these screens.

## Why
The user is starting to use the app against production. Reports: `odd/ux-audit/`.

## Scope
- Flows: F-04 expense taps, F-05 Inicio refresh, F-10 feedback after a move, F-02 over-assign warning,
  F-08 amount keypad and split button label, F-06 layout shift from inline errors, F-07 filter chips,
  F-03 new goal defaults.
- Visual: V-01 to V-08, V-11, V-12 and text scaling support.

## Out of scope
- F-01 registration-day grouping: user decision RRG-57 D8.
- Move rows surviving a deleted envelope: RRG-59 design.
- Any animation (RRG-85). Auto-learning payee envelopes unless the user approves that spec change.

## Constraints
- OpenSpec cycle in specs, one commit per phase; code repos one commit per task with `(RRG-84, task N.N)`.
- No test files. TDD off (project rule, config.yaml). RDD off (global switch).
- No Co-Authored-By. Do not stage docs/PLAN-DE-PRUEBAS.md.
- Device checks only through safe-adb.sh on the `.uxcheck` package with the local back. Production app
  and account on the phone are the user's: do not touch them.
- About 400 authored changed lines per task is advisory only.

## Delivery
Forecast above 400 lines. Strategy: ask-on-risk; chain strategy pending the user's answer.

## Tasks
- [ ] T1 OpenSpec proposal, specs, design, tasks. Route: delegated (preparation trigger, 4+ files).
- [ ] T2 Implementation by task from tasks.md. Route: delegated, one writer (2+ non-trivial files).
- [ ] T3 Verify: flutter analyze, device against renders.
- [ ] T4 Merge, archive, CI, new production APK.

## Progress
- RRG-84 In Progress, RRG-85 Todo. User approved the PRD motion rule, the 22 header change and the new
  "Meta cumplida" / "Todo asignado" copy for RRG-85.

## Next step
T1.
