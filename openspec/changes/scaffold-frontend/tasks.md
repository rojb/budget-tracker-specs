# Tasks

## 1. [specs]

- [ ] 1.1 Update `PRD.md` in `budget-tracker-specs`: in §9 Dependencies, change the "Decisión de gestión de estado en Flutter" row to resolved ("ChangeNotifier + ListenableBuilder (2026-09-29)"); add a note to the "Gestión de estado en Flutter" constraint bullet recording the resolution (Riverpod not adopted because nobody on the team had used it); add PRD changelog row 1.9. Verify by re-reading both passages and the new changelog row.

## 2. [front]

- [ ] 2.1 Clone the empty `budget-tracker-front` remote, create `main` with a `chore: initial commit` (`.gitignore` and README stub only), branch `rrg-41-scaffold-frontend`, then run `flutter create --org com.budgettracker --project-name budget_tracker --platforms android,ios .`; delete `test/` and remove the `flutter_test` dev dependency from `pubspec.yaml`; set Android `minSdk` to 26 and the iOS deployment target to 13.0. Verify `flutter pub get` and `flutter analyze` pass and that no `test/` folder or `flutter_test` reference remains.
- [ ] 2.2 Create the `packages/ui` local package (package name `ui`, Flutter SDK dependency only, no `test/`, no `flutter_test`) with `lib/src/{tokens,atoms,molecules,organisms}/`, a throwaway `PlaceholderCard` StatelessWidget under `atoms/`, and the barrel `lib/ui.dart`. Verify `flutter analyze` in `packages/ui` reports no issues.
- [ ] 2.3 Create the `widgetbook/` Flutter app (android and ios platforms only, path dependency on `packages/ui`, no `test/`, no `flutter_test`, no code generation) with a manually declared catalog and one placeholder use case for `PlaceholderCard`. Verify `flutter pub get` and `flutter analyze` in `widgetbook/` report no issues.
- [ ] 2.4 Build the app structure: `lib/main.dart`, `lib/app/{app.dart,router.dart,dependencies.dart}` (go_router, composition root), `lib/core/config.dart` (`API_BASE_URL` via `--dart-define`), and `lib/features/home/` with `HomeController` (ChangeNotifier) and `HomePage` (ListenableBuilder) rendering `PlaceholderCard` from `packages/ui`; replace the generated counter app; add the path dependency on `packages/ui`. Verify `flutter analyze` at the app root reports no issues.
- [ ] 2.5 Configure `analysis_options.yaml` in the app root, `packages/ui`, and `widgetbook/` (`flutter_lints` plus the extra rules from design.md); confirm `packages/ui/pubspec.yaml` has no dependency on the app or on any API client. Verify `flutter analyze` reports no issues in all three projects.
- [ ] 2.6 Add `.github/workflows/ci.yml` (`subosito/flutter-action` stable, `actions/setup-java`, `flutter pub get` and `flutter analyze` for the app, `packages/ui`, and `widgetbook`, then `flutter build apk --debug`; no test step). Verify the file is valid YAML and lists exactly those steps.
- [ ] 2.7 Write `README.md` (Spanish): requisitos, setup, estructura de carpetas, regla de dependencias (`packages/ui` no importa código de la app), cómo correr Widgetbook, regla sin tests, link al repo de specs. Verify each documented command runs as written.

## 3. Verification

- [ ] 3.1 Manual verification checklist (no screens or endpoints are touched, so no Widgetbook-vs-`design/screens` or Swagger/Prism comparison applies): `flutter analyze` passes in the app root, `packages/ui`, and `widgetbook/`; `flutter build apk --debug` succeeds locally; Widgetbook builds or launches and shows the `PlaceholderCard` story; the app's home screen renders the `PlaceholderCard` through `HomePage` and `HomeController`; a glob for `test/` folders and `*_test.dart` (excluding `build/` and `.dart_tool/`) returns nothing and no `pubspec.yaml` mentions `flutter_test`; `openspec validate scaffold-frontend` passes.
