# scaffold-frontend (RRG-41)

## Objective
Bootstrap `budget-tracker-front` (Flutter) with the structure every feature change builds on:
app shell, `packages/ui` local package, Widgetbook catalog, `lib/features/`, CI.

## Why
Unblocks `ui-foundation` (RRG-43) and the front half of `add-auth` (RRG-44) and every feature.

## Decisions
- State management: plain `ChangeNotifier` + `ListenableBuilder` (Flutter SDK only, no Riverpod,
  no `provider`). User decision 2026-09-29 (PRD §8 rule: Riverpod only if someone had used it;
  nobody has). Dependencies injected via constructors from a composition root.
- `packages/ui`: presentational StatelessWidgets only, never imports API/feature code.
- Widgetbook app in `widgetbook/` depending on `packages/ui` via path.
- NO test files: remove `test/` folders and `flutter_test` dev dependency everywhere.
- UI tokens/components are NOT in scope (that's `ui-foundation`); scaffold only.

## Tasks
- [x] T1 Specs repo: design → tasks (one commit per phase); record state-management decision in PRD (route: delegated writer)
- [x] T2 Front repo: scaffold per tasks, one commit per task (route: same writer)
- [ ] T3 Verify + tasks-complete commit; review gate; merge; archive; Linear Done

## Checks
`flutter analyze` (app, packages/ui, widgetbook), a build that runs locally (apk debug if Android
SDK present, else web/windows — report), Widgetbook launches/builds, no test files.
TDD: off (no test files rule).

## Progress
- RRG-41 moved to In Progress.
- Specs: 8c7acc3 design, 3ccfab4 tasks, 5f0129c PRD state mgmt (1.1), e3a6a2a tasks complete (3.1 visual check unchecked). Front: main 0b3378c; branch caf4c65..f45b1dd (2.1-2.7).
- Evidence: flutter analyze clean x3 (parent re-ran), apk debug builds for app; widgetbook apk needs kotlin.incremental=false on Windows cross-drive (not committed). No emulator/device available for visual check.
- Flutter 3.47.1, go_router, minSdk 26, iOS target 13.0 untested (Flutter default 15.0).
